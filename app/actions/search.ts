"use server";

import { prisma } from "@/lib/prisma";

export type SearchResult = {
  id: string;
  type: "snippet" | "file";
  repo: string;
  file: string;
  line: number;
  matchType: "semantic" | "exact" | "hybrid";
  similarity: number; // 0.0 to 1.0
  score: number;      // 0 to 100
  language: string;
  preview: string;
  fullContent: string;
  tokenCount: number;
  tags?: string[];
};

// Character 3-gram and term tokenizer for local vector embedding computation
function generateVector(text: string): Map<string, number> {
  const vec = new Map<string, number>();
  const clean = text.toLowerCase().replace(/[^a-z0-9_\s]/g, " ");
  const words = clean.split(/\s+/).filter(w => w.length > 1);

  // Term frequencies
  for (const w of words) {
    vec.set(w, (vec.get(w) || 0) + 2.0);
    // Subword n-grams for semantic fuzzy overlap
    if (w.length > 3) {
      for (let i = 0; i <= w.length - 3; i++) {
        const tri = w.slice(i, i + 3);
        vec.set(tri, (vec.get(tri) || 0) + 0.5);
      }
    }
  }

  // Normalize vector to unit length
  let norm = 0;
  for (const val of vec.values()) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (const [k, v] of vec.entries()) {
      vec.set(k, v / norm);
    }
  }

  return vec;
}

// Compute cosine similarity between two sparse unit vectors
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dot = 0;
  for (const [key, valA] of vecA.entries()) {
    const valB = vecB.get(key);
    if (valB) {
      dot += valA * valB;
    }
  }
  return Math.min(Math.max(dot, 0), 1.0);
}

// Estimate tokens using code heuristics (~4 chars/token or word factor)
function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 3.8));
}

// BM25 / exact keyword matching score (0.0 to 1.0)
function calculateKeywordScore(query: string, text: string, title?: string, tags?: string[]): { score: number; matchLine: number; matchPreview: string } {
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(w => w.length > 1);
  const textLower = text.toLowerCase();
  const lines = text.split("\n");

  let matchLine = 1;
  let matchPreview = lines[0] || text.slice(0, 150);

  // Find best matching line for preview
  for (let idx = 0; idx < lines.length; idx++) {
    const lineLower = lines[idx].toLowerCase();
    if (lineLower.includes(q)) {
      matchLine = idx + 1;
      matchPreview = lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 4)).join("\n");
      break;
    }
    for (const word of qWords) {
      if (lineLower.includes(word)) {
        matchLine = idx + 1;
        matchPreview = lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 4)).join("\n");
        break;
      }
    }
  }

  // Exact phrase match
  let score = 0;
  if (textLower.includes(q)) {
    score += 0.5;
  }

  // Title match
  if (title && title.toLowerCase().includes(q)) {
    score += 0.4;
  }

  // Tag match
  if (tags && tags.some(t => t.toLowerCase().includes(q))) {
    score += 0.35;
  }

  // Individual word hits
  let wordHits = 0;
  for (const w of qWords) {
    if (textLower.includes(w)) wordHits++;
    if (title && title.toLowerCase().includes(w)) wordHits += 0.5;
  }

  if (qWords.length > 0) {
    score += (wordHits / (qWords.length * 1.5)) * 0.4;
  }

  return {
    score: Math.min(score, 1.0),
    matchLine,
    matchPreview: matchPreview.trim() || text.slice(0, 200),
  };
}

export async function searchCode(
  query: string,
  options?: {
    repositoryId?: string;
    language?: string;
    limit?: number;
  }
): Promise<SearchResult[]> {
  try {
    const q = (query || "").trim();
    if (!q) return [];

    const limit = options?.limit || 15;
    const queryVector = generateVector(q);

    // 1. Fetch Candidate Files from Repositories
    const fileWhere: any = {};
    if (options?.repositoryId && options.repositoryId !== "all") {
      fileWhere.repositoryId = options.repositoryId;
    }
    if (options?.language && options.language !== "all") {
      fileWhere.language = options.language.toLowerCase();
    }

    const files = await prisma.file.findMany({
      where: fileWhere,
      include: {
        repository: true,
      },
      take: 60,
    });

    // 2. Fetch Candidate Snippets
    const snippetWhere: any = { isArchived: false };
    if (options?.language && options.language !== "all") {
      snippetWhere.language = options.language.toLowerCase();
    }

    const snippets = await prisma.snippet.findMany({
      where: snippetWhere,
      include: {
        folder: true,
        tags: true,
        repository: true,
      },
      take: 40,
    });

    const results: SearchResult[] = [];

    // Evaluate Files
    for (const file of files) {
      const docVector = generateVector(`${file.name} ${file.path} ${file.content}`);
      const semanticSim = cosineSimilarity(queryVector, docVector);
      const kw = calculateKeywordScore(q, file.content, file.name);

      // Hybrid fusion: 60% semantic, 40% keyword
      const combinedScore = (semanticSim * 0.6) + (kw.score * 0.4);

      if (combinedScore > 0.08 || kw.score > 0.15) {
        const matchType = kw.score > 0.7 ? "exact" : semanticSim > 0.4 ? "semantic" : "hybrid";
        results.push({
          id: file.id,
          type: "file",
          repo: file.repository.name,
          file: file.path,
          line: kw.matchLine,
          matchType,
          similarity: parseFloat(semanticSim.toFixed(2)),
          score: Math.min(99, Math.round(combinedScore * 100)),
          language: file.language,
          preview: kw.matchPreview,
          fullContent: file.content,
          tokenCount: estimateTokens(file.content),
        });
      }
    }

    // Evaluate Snippets
    for (const snip of snippets) {
      const tagNames = snip.tags.map(t => t.name);
      const docVector = generateVector(`${snip.title} ${snip.description || ""} ${tagNames.join(" ")} ${snip.code}`);
      const semanticSim = cosineSimilarity(queryVector, docVector);
      const kw = calculateKeywordScore(q, snip.code, snip.title, tagNames);

      const combinedScore = (semanticSim * 0.6) + (kw.score * 0.4);

      if (combinedScore > 0.08 || kw.score > 0.15) {
        const matchType = kw.score > 0.7 ? "exact" : semanticSim > 0.4 ? "semantic" : "hybrid";
        results.push({
          id: snip.id,
          type: "snippet",
          repo: snip.repository?.name || (snip.folder ? `folder: ${snip.folder.name}` : "Personal Snippets"),
          file: snip.title,
          line: kw.matchLine,
          matchType,
          similarity: parseFloat(semanticSim.toFixed(2)),
          score: Math.min(99, Math.round(combinedScore * 100)),
          language: snip.language,
          preview: kw.matchPreview,
          fullContent: snip.code,
          tokenCount: estimateTokens(snip.code),
          tags: tagNames,
        });
      }
    }

    // Sort by combined score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  } catch (error) {
    console.error("Hybrid semantic search error:", error);
    throw new Error("Failed to execute code search");
  }
}
