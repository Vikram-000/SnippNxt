// Centralized mock data — replace with API calls when backend is ready

export const mockRepositories = [
  {
    id: "repo-1",
    name: "snippnxt-core",
    description: "Core analysis engine for the SnippNXT platform",
    language: "Python",
    langColor: "#3572A5",
    branch: "main",
    fileCount: 142,
    linesOfCode: 18450,
    lastAnalyzed: "2 minutes ago",
    status: "indexed" as const,
    stars: 0,
    issues: 3,
    url: "https://github.com/snippnxt/core",
  },
  {
    id: "repo-2",
    name: "snippnxt-ui",
    description: "Frontend workspace for SnippNXT",
    language: "TypeScript",
    langColor: "#3178C6",
    branch: "feat/ai-assistant",
    fileCount: 87,
    linesOfCode: 9210,
    lastAnalyzed: "15 minutes ago",
    status: "indexed" as const,
    stars: 0,
    issues: 1,
    url: "https://github.com/snippnxt/ui",
  },
  {
    id: "repo-3",
    name: "auth-service",
    description: "Authentication and authorization microservice",
    language: "Go",
    langColor: "#00ADD8",
    branch: "main",
    fileCount: 34,
    linesOfCode: 4120,
    lastAnalyzed: "1 hour ago",
    status: "indexed" as const,
    stars: 0,
    issues: 0,
    url: "https://github.com/snippnxt/auth-service",
  },
  {
    id: "repo-4",
    name: "data-pipeline",
    description: "ETL pipeline for code embeddings and indexing",
    language: "Python",
    langColor: "#3572A5",
    branch: "dev",
    fileCount: 56,
    linesOfCode: 7830,
    lastAnalyzed: "3 hours ago",
    status: "analyzing" as const,
    stars: 0,
    issues: 5,
    url: "https://github.com/snippnxt/data-pipeline",
  },
  {
    id: "repo-5",
    name: "api-gateway",
    description: "REST and WebSocket API gateway layer",
    language: "TypeScript",
    langColor: "#3178C6",
    branch: "main",
    fileCount: 29,
    linesOfCode: 3670,
    lastAnalyzed: "1 day ago",
    status: "pending" as const,
    stars: 0,
    issues: 2,
    url: "https://github.com/snippnxt/api-gateway",
  },
  {
    id: "repo-6",
    name: "vector-store",
    description: "Vector database abstraction layer for embeddings",
    language: "Rust",
    langColor: "#DEA584",
    branch: "main",
    fileCount: 18,
    linesOfCode: 2910,
    lastAnalyzed: "2 days ago",
    status: "indexed" as const,
    stars: 0,
    issues: 0,
    url: "https://github.com/snippnxt/vector-store",
  },
];

export const mockFiles = [
  {
    id: "f1",
    name: "analyzer.py",
    path: "src/core/analyzer.py",
    language: "python",
    size: "12 KB",
    lines: 380,
    lastModified: "2 hours ago",
    content: `import asyncio
from typing import Optional, List
from dataclasses import dataclass
from .embeddings import EmbeddingModel
from .retrieval import SmartRetriever

@dataclass
class AnalysisConfig:
    repository: str
    include_dependencies: bool = True
    smart_retrieval: bool = True
    max_context_tokens: int = 8000

class RepositoryAnalyzer:
    """
    Core analysis engine for SnippNXT.
    Provides repository-level code intelligence using
    semantic embeddings and smart context retrieval.
    """
    
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.embedder = EmbeddingModel()
        self.retriever = SmartRetriever(
            max_tokens=config.max_context_tokens
        )
        self._index_cache: dict = {}
    
    async def analyze(self, query: str) -> dict:
        """
        Analyze a query against the repository context.
        Returns relevant code snippets and insights.
        """
        # Build or retrieve cached index
        if self.config.repository not in self._index_cache:
            await self._build_index()
        
        # Retrieve semantically relevant context
        context = await self.retriever.retrieve(
            query=query,
            index=self._index_cache[self.config.repository],
            include_deps=self.config.include_dependencies,
        )
        
        return {
            "query": query,
            "context": context.snippets,
            "token_count": context.token_count,
            "files_searched": context.files_searched,
            "insights": await self._generate_insights(context),
        }
    
    async def _build_index(self) -> None:
        """Build semantic index for the repository."""
        files = await self._load_repository_files()
        embeddings = await self.embedder.encode_batch(files)
        self._index_cache[self.config.repository] = embeddings
    
    async def _generate_insights(self, context) -> List[str]:
        """Generate high-level insights from retrieved context."""
        insights = []
        if context.has_circular_deps:
            insights.append("Circular dependency detected")
        if context.complexity_score > 0.7:
            insights.append("High complexity region identified")
        return insights
    
    async def _load_repository_files(self) -> List[dict]:
        """Load and parse repository files."""
        # Simulated for demo — replace with actual file system reader
        return []
`,
  },
  {
    id: "f2",
    name: "embeddings.py",
    path: "src/core/embeddings.py",
    language: "python",
    size: "8 KB",
    lines: 220,
    lastModified: "1 day ago",
    content: `import numpy as np
from typing import List, Optional
from sentence_transformers import SentenceTransformer

class EmbeddingModel:
    """
    Manages code embedding generation using
    transformer-based sentence encoders.
    """
    
    MODEL_NAME = "microsoft/codebert-base"
    
    def __init__(self, model_name: str = MODEL_NAME):
        self.model = SentenceTransformer(model_name)
        self._cache: dict = {}
    
    async def encode(self, text: str) -> np.ndarray:
        """Encode a single text string to a vector."""
        if text in self._cache:
            return self._cache[text]
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        self._cache[text] = embedding
        return embedding
    
    async def encode_batch(self, texts: List[str]) -> np.ndarray:
        """Batch encode multiple texts efficiently."""
        return self.model.encode(
            texts,
            convert_to_numpy=True,
            batch_size=32,
            show_progress_bar=False,
        )
    
    def similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
`,
  },
  {
    id: "f3",
    name: "retrieval.py",
    path: "src/core/retrieval.py",
    language: "python",
    size: "15 KB",
    lines: 420,
    lastModified: "3 hours ago",
    content: `from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import numpy as np

@dataclass
class RetrievalResult:
    snippets: List[dict]
    token_count: int
    files_searched: int
    has_circular_deps: bool = False
    complexity_score: float = 0.0

class SmartRetriever:
    """
    Intelligent context retrieval system that balances
    relevance, token budget, and dependency traversal.
    
    Research goal: maximize retrieval quality while
    minimizing token consumption and latency.
    """
    
    def __init__(self, max_tokens: int = 8000):
        self.max_tokens = max_tokens
        self._token_estimator = lambda text: len(text.split()) * 1.3
    
    async def retrieve(
        self,
        query: str,
        index: dict,
        include_deps: bool = True,
        strategy: str = "bm25+semantic",
    ) -> RetrievalResult:
        """
        Retrieve the most relevant code context for a query.
        
        Strategies:
          - 'bm25': Keyword-based retrieval only
          - 'semantic': Embedding similarity only
          - 'bm25+semantic': Hybrid retrieval (default)
        """
        candidates = await self._rank_candidates(query, index, strategy)
        selected = self._fit_to_budget(candidates)
        
        if include_deps:
            deps = await self._expand_dependencies(selected, index)
            selected = self._fit_to_budget(selected + deps)
        
        return RetrievalResult(
            snippets=selected,
            token_count=sum(
                int(self._token_estimator(s["content"])) for s in selected
            ),
            files_searched=len(index),
        )
    
    async def _rank_candidates(self, query, index, strategy) -> List[dict]:
        # Ranking logic depends on strategy
        return []
    
    def _fit_to_budget(self, candidates: List[dict]) -> List[dict]:
        """Greedily select snippets within token budget."""
        selected, total = [], 0
        for c in candidates:
            tokens = int(self._token_estimator(c.get("content", "")))
            if total + tokens > self.max_tokens:
                break
            selected.append(c)
            total += tokens
        return selected
    
    async def _expand_dependencies(self, selected, index) -> List[dict]:
        """Add imported modules to context if budget allows."""
        return []
`,
  },
  {
    id: "f4",
    name: "main.py",
    path: "src/main.py",
    language: "python",
    size: "3 KB",
    lines: 85,
    lastModified: "5 hours ago",
    content: `"""
SnippNXT Core — Entry point
"""
import asyncio
import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from .api import router
from .core.analyzer import RepositoryAnalyzer, AnalysisConfig

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up models
    print("SnippNXT Core starting up...")
    yield
    # Shutdown
    print("SnippNXT Core shutting down...")

app = FastAPI(
    title="SnippNXT Core API",
    description="Repository-level code intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
`,
  },
  {
    id: "f5",
    name: "api.py",
    path: "src/api.py",
    language: "python",
    size: "6 KB",
    lines: 155,
    lastModified: "1 day ago",
    content: `from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from .core.analyzer import RepositoryAnalyzer, AnalysisConfig

router = APIRouter()

class QueryRequest(BaseModel):
    repository: str
    query: str
    strategy: str = "bm25+semantic"
    max_tokens: int = 8000
    include_dependencies: bool = True

class QueryResponse(BaseModel):
    query: str
    snippets: list
    token_count: int
    files_searched: int
    insights: list

@router.post("/analyze", response_model=QueryResponse)
async def analyze_repository(req: QueryRequest):
    """
    Analyze a repository and retrieve relevant code context.
    """
    config = AnalysisConfig(
        repository=req.repository,
        include_dependencies=req.include_dependencies,
        smart_retrieval=True,
        max_context_tokens=req.max_tokens,
    )
    
    analyzer = RepositoryAnalyzer(config)
    
    try:
        result = await analyzer.analyze(req.query)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/repositories/{repo_id}/files")
async def list_files(repo_id: str):
    """List all indexed files in a repository."""
    return {"files": [], "total": 0}

@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
`,
  },
];

export type IssueSeverity = "error" | "warning" | "info";
export type IssueStatus = "open" | "resolved" | "ignored";

export interface Issue {
  id: string;
  severity: IssueSeverity;
  file: string;
  line: number;
  title: string;
  description: string;
  rule: string;
  fix: string;
  status: IssueStatus;
}

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    severity: "error",
    file: "src/core/retrieval.py",
    line: 78,
    title: "Uncaught exception in _rank_candidates",
    description: "The method may raise IndexError when index is empty, with no error handling.",
    rule: "PYL-E1120",
    fix: "Add a guard clause: `if not index: return []` at the start of the method.",
    status: "open",
  },
  {
    id: "issue-2",
    severity: "warning",
    file: "src/core/analyzer.py",
    line: 42,
    title: "Unbounded cache growth in _index_cache",
    description: "The dictionary _index_cache is never evicted, which may cause memory issues in long-running processes.",
    rule: "PYL-W0612",
    fix: "Use functools.lru_cache or implement a TTL-based cache.",
    status: "open",
  },
  {
    id: "issue-3",
    severity: "warning",
    file: "src/api.py",
    line: 53,
    title: "RepositoryAnalyzer created per request",
    description: "Creating a new analyzer instance on every request re-initializes the embedding model, causing latency spikes.",
    rule: "PERF-101",
    fix: "Use dependency injection with a singleton analyzer pool.",
    status: "open",
  },
  {
    id: "issue-4",
    severity: "info",
    file: "src/core/embeddings.py",
    line: 30,
    title: "In-memory cache not thread-safe",
    description: "The _cache dict can have race conditions under concurrent async access.",
    rule: "PYL-W1505",
    fix: "Use asyncio.Lock when reading/writing cache entries.",
    status: "resolved",
  },
  {
    id: "issue-5",
    severity: "error",
    file: "src/main.py",
    line: 15,
    title: "Missing error handling in lifespan",
    description: "If model warm-up fails during startup, the error is silently swallowed.",
    rule: "PYL-E0001",
    fix: "Wrap startup logic in try/except and log or re-raise.",
    status: "open",
  },
  {
    id: "issue-6",
    severity: "warning",
    file: "src/core/retrieval.py",
    line: 120,
    title: "Magic number 1.3 in token estimator",
    description: "The 1.3 multiplier is undocumented. Consider extracting it to a named constant.",
    rule: "PYL-W0612",
    fix: "Define TOKEN_WORD_RATIO = 1.3 as a class constant.",
    status: "ignored",
  },
];


export const mockTestSuites = [
  {
    id: "suite-1",
    name: "Core Analyzer Tests",
    file: "tests/test_analyzer.py",
    total: 18,
    passed: 16,
    failed: 2,
    skipped: 0,
    duration: 1.42,
    lastRun: "5 minutes ago",
    tests: [
      { id: "t1", name: "test_analyze_returns_context", status: "passed" as const, duration: 0.12 },
      { id: "t2", name: "test_empty_repository_raises", status: "passed" as const, duration: 0.08 },
      { id: "t3", name: "test_cache_populated_after_analyze", status: "passed" as const, duration: 0.23 },
      { id: "t4", name: "test_config_defaults", status: "passed" as const, duration: 0.04 },
      { id: "t5", name: "test_circular_dep_detected", status: "failed" as const, duration: 0.18, error: "AssertionError: Expected has_circular_deps=True, got False" },
      { id: "t6", name: "test_token_budget_respected", status: "failed" as const, duration: 0.31, error: "AssertionError: Token count 8421 exceeds budget 8000" },
      { id: "t7", name: "test_insights_not_empty", status: "passed" as const, duration: 0.09 },
      { id: "t8", name: "test_analyze_with_smart_retrieval", status: "passed" as const, duration: 0.55 },
    ],
  },
  {
    id: "suite-2",
    name: "Embedding Model Tests",
    file: "tests/test_embeddings.py",
    total: 10,
    passed: 10,
    failed: 0,
    skipped: 0,
    duration: 0.98,
    lastRun: "5 minutes ago",
    tests: [
      { id: "t9", name: "test_encode_returns_vector", status: "passed" as const, duration: 0.14 },
      { id: "t10", name: "test_cache_hit", status: "passed" as const, duration: 0.02 },
      { id: "t11", name: "test_similarity_bounds", status: "passed" as const, duration: 0.06 },
      { id: "t12", name: "test_batch_encoding", status: "passed" as const, duration: 0.67 },
    ],
  },
  {
    id: "suite-3",
    name: "API Endpoint Tests",
    file: "tests/test_api.py",
    total: 12,
    passed: 9,
    failed: 0,
    skipped: 3,
    duration: 0.76,
    lastRun: "1 hour ago",
    tests: [
      { id: "t13", name: "test_health_check", status: "passed" as const, duration: 0.03 },
      { id: "t14", name: "test_analyze_endpoint_200", status: "passed" as const, duration: 0.22 },
      { id: "t15", name: "test_analyze_invalid_repo_404", status: "passed" as const, duration: 0.11 },
      { id: "t16", name: "test_list_files_empty", status: "skipped" as const, duration: 0 },
    ],
  },
];

export interface DependencyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  imports: string[];
  size: "large" | "medium" | "small";
}

export const mockDependencies: DependencyNode[] = [
  { id: "main.py", label: "main.py", x: 400, y: 200, imports: ["api.py", "core/analyzer.py"], size: "large" },
  { id: "api.py", label: "api.py", x: 600, y: 100, imports: ["core/analyzer.py"], size: "medium" },
  { id: "core/analyzer.py", label: "analyzer.py", x: 600, y: 300, imports: ["core/embeddings.py", "core/retrieval.py"], size: "large" },
  { id: "core/embeddings.py", label: "embeddings.py", x: 800, y: 150, imports: [], size: "medium" },
  { id: "core/retrieval.py", label: "retrieval.py", x: 800, y: 350, imports: ["core/embeddings.py"], size: "large" },
  { id: "utils/tokenizer.py", label: "tokenizer.py", x: 200, y: 350, imports: [], size: "small" },
  { id: "utils/logger.py", label: "logger.py", x: 200, y: 200, imports: [], size: "small" },
];

export const mockSearchResults = [
  {
    id: "sr-1",
    file: "src/core/retrieval.py",
    repo: "snippnxt-core",
    lineStart: 56,
    lineEnd: 72,
    matchedTerms: ["retrieve", "context", "query"],
    preview: `async def retrieve(
    self,
    query: str,
    index: dict,
    include_deps: bool = True,
    strategy: str = "bm25+semantic",
) -> RetrievalResult:
    """
    Retrieve the most relevant code context for a query.
    """`,
    relevance: 0.97,
  },
  {
    id: "sr-2",
    file: "src/core/analyzer.py",
    repo: "snippnxt-core",
    lineStart: 32,
    lineEnd: 46,
    matchedTerms: ["analyze", "query", "context"],
    preview: `async def analyze(self, query: str) -> dict:
    """
    Analyze a query against the repository context.
    Returns relevant code snippets and insights.
    """
    if self.config.repository not in self._index_cache:
        await self._build_index()`,
    relevance: 0.94,
  },
  {
    id: "sr-3",
    file: "src/api.py",
    repo: "snippnxt-core",
    lineStart: 40,
    lineEnd: 55,
    matchedTerms: ["analyze", "repository", "query"],
    preview: `@router.post("/analyze", response_model=QueryResponse)
async def analyze_repository(req: QueryRequest):
    """
    Analyze a repository and retrieve relevant code context.
    """
    config = AnalysisConfig(
        repository=req.repository,`,
    relevance: 0.88,
  },
];

export const mockActivity = [
  { id: "a1", type: "indexed", repo: "snippnxt-core", message: "Repository re-indexed (142 files)", time: "2m ago" },
  { id: "a2", type: "search", repo: "snippnxt-ui", message: 'Search: "authentication flow"', time: "8m ago" },
  { id: "a3", type: "issue", repo: "snippnxt-core", message: "3 new issues detected", time: "15m ago" },
  { id: "a4", type: "ai", repo: "snippnxt-core", message: "AI explained retrieval.py", time: "32m ago" },
  { id: "a5", type: "test", repo: "snippnxt-core", message: "Test suite ran (16/18 passed)", time: "1h ago" },
  { id: "a6", type: "indexed", repo: "auth-service", message: "Repository indexed (34 files)", time: "1h ago" },
];

export const mockAIConversations = [
  {
    id: "conv-1",
    title: "Explain RepositoryAnalyzer",
    repo: "snippnxt-core",
    lastMessage: "The RepositoryAnalyzer class is the central engine...",
    time: "2m ago",
  },
  {
    id: "conv-2",
    title: "Debug token budget issue",
    repo: "snippnxt-core",
    lastMessage: "The test failure suggests the token estimator...",
    time: "45m ago",
  },
  {
    id: "conv-3",
    title: "Refactor retrieval strategy",
    repo: "snippnxt-core",
    lastMessage: "I'd suggest extracting a Strategy protocol...",
    time: "2h ago",
  },
];

export const mockPerformanceData = {
  avgAnalysisDuration: 1240,
  avgResponseLatency: 340,
  estimatedTokensPerQuery: 4850,
  retrievalEfficiency: 0.73,
  weekly: [
    { day: "Mon", queries: 24, tokens: 118000, latency: 310 },
    { day: "Tue", queries: 31, tokens: 149000, latency: 328 },
    { day: "Wed", queries: 18, tokens: 88000, latency: 295 },
    { day: "Thu", queries: 42, tokens: 198000, latency: 355 },
    { day: "Fri", queries: 37, tokens: 175000, latency: 340 },
    { day: "Sat", queries: 11, tokens: 52000, latency: 280 },
    { day: "Sun", queries: 8, tokens: 38000, latency: 265 },
  ],
  strategies: [
    { name: "BM25 only", precision: 0.61, recall: 0.72, tokens: 3200, latency: 180 },
    { name: "Semantic only", precision: 0.74, recall: 0.68, tokens: 5100, latency: 420 },
    { name: "BM25 + Semantic", precision: 0.81, recall: 0.79, tokens: 4850, latency: 340 },
  ],
};
