"use server";

import { prisma } from "@/lib/prisma";

export type RepositoryWithIssues = {
  id: string;
  name: string;
  description: string;
  language: string;
  langColor: string;
  branch: string;
  fileCount: number;
  linesOfCode: number;
  lastAnalyzed: string;
  status: "indexed" | "analyzing" | "pending";
  stars: number;
  issues: number;
  url: string;
};

export async function getRepositories(): Promise<RepositoryWithIssues[]> {
  try {
    const repos = await prisma.repository.findMany({
      include: {
        _count: {
          select: { issues: { where: { status: "OPEN" } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description ?? "",
      language: repo.language,
      langColor: repo.langColor,
      branch: repo.branch,
      fileCount: repo.fileCount,
      linesOfCode: repo.linesOfCode,
      lastAnalyzed: repo.lastAnalyzed
        ? formatTimeAgo(repo.lastAnalyzed)
        : "Just now",
      status: (repo.status.toLowerCase() as "indexed" | "analyzing" | "pending") || "pending",
      stars: repo.stars,
      issues: repo._count.issues,
      url: repo.url ?? "",
    }));
  } catch (error) {
    console.error("Failed to fetch repositories from database:", error);
    throw new Error("Failed to fetch repositories");
  }
}

export type RepositoryFile = {
  id: string;
  name: string;
  path: string;
  language: string;
  size: string;
  lines: number;
  content: string;
  lastModified: string;
};

export type RepositoryDetail = RepositoryWithIssues & {
  files: RepositoryFile[];
};

export async function getRepositoryDetail(id: string): Promise<RepositoryDetail | null> {
  try {
    const repo = await prisma.repository.findUnique({
      where: { id },
      include: {
        files: true,
        _count: {
          select: { issues: { where: { status: "OPEN" } } },
        },
      },
    });

    if (!repo) {
      // Fallback: if id not found, fetch the first repo
      const fallbackRepo = await prisma.repository.findFirst({
        include: {
          files: true,
          _count: {
            select: { issues: { where: { status: "OPEN" } } },
          },
        },
      });
      if (!fallbackRepo) return null;
      return mapRepoDetail(fallbackRepo);
    }

    return mapRepoDetail(repo);
  } catch (error) {
    console.error("Failed to fetch repository detail:", error);
    throw new Error("Failed to fetch repository detail");
  }
}

function mapRepoDetail(repo: any): RepositoryDetail {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description ?? "",
    language: repo.language,
    langColor: repo.langColor,
    branch: repo.branch,
    fileCount: repo.fileCount,
    linesOfCode: repo.linesOfCode,
    lastAnalyzed: repo.lastAnalyzed ? formatTimeAgo(repo.lastAnalyzed) : "Just now",
    status: (repo.status.toLowerCase() as "indexed" | "analyzing" | "pending") || "pending",
    stars: repo.stars,
    issues: repo._count.issues,
    url: repo.url ?? "",
    files: (repo.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      language: f.language,
      size: f.size ?? "4 KB",
      lines: f.lines,
      content: f.content,
      lastModified: f.lastModified ? formatTimeAgo(f.lastModified) : "2 hours ago",
    })),
  };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
