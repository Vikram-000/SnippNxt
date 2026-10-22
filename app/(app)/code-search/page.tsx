'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { searchCode, type SearchResult } from '@/app/actions/search';
import { getRepositories, type RepositoryWithIssues } from '@/app/actions/repositories';

const EXAMPLE_QUERIES = [
  'Binary search algorithm',
  'RepositoryAnalyzer orchestration',
  'Where is token budget handled?',
  'Find database connection functions',
  'Async code execution',
];

const RECENT_SEARCHES = [
  'binary search',
  'RepositoryAnalyzer',
  'token budget',
  'algorithms',
];

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(139,92,246,0.3)', color: 'var(--accent-light)', borderRadius: 2 }}>{part}</mark>
      : part
  );
}

export default function CodeSearchPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [repos, setRepos] = useState<RepositoryWithIssues[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedLang, setSelectedLang] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    getRepositories().then(setRepos).catch(console.error);
    // Initial search to showcase live DB index
    doSearch('search');
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(q);
    try {
      const data = await searchCode(q, {
        repositoryId: selectedRepo,
        language: selectedLang,
      });
      setResults(data);
    } catch (err) {
      console.error('Failed to execute search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
  };

  return (
    <div>
      <div className="search-hero">
        <div className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#b8a7ff', marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8ce5bc', boxShadow: '0 0 8px rgba(140,229,188,0.5)', display: 'inline-block' }} />
          HYBRID SEMANTIC CODE SEARCH
        </div>
        <h1 className="page-title" style={{ fontSize: 22, textAlign: 'center' }}>Search across repositories & student snippets</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Combines BM25 token matching with vector cosine embeddings across files and saved code snippets.
        </p>

        <div className="search-hero-input-wrap">
          <span className="search-field-icon" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="search-hero-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your code in natural language or search patterns..."
          />
          <button
            className="btn btn-primary"
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', height: 38 }}
            onClick={() => doSearch(query)}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Example queries */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          {EXAMPLE_QUERIES.map(q => (
            <button key={q} className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--border)', fontSize: 11 }}
              onClick={() => { setQuery(q); doSearch(q); }}
            >{q}</button>
          ))}
        </div>
      </div>

      <div className="row-between" style={{ margin: '16px 0', flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 10 }}>
          <select
            className="select-field"
            value={selectedRepo}
            onChange={e => {
              setSelectedRepo(e.target.value);
              if (searched) doSearch(searched);
            }}
          >
            <option value="all">All Repositories & Snippets</option>
            {repos.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            className="select-field"
            value={selectedLang}
            onChange={e => {
              setSelectedLang(e.target.value);
              if (searched) doSearch(searched);
            }}
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="sql">SQL</option>
          </select>
        </div>
        {searched && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {results.length} results for &quot;{searched}&quot; · <span className="badge badge-success">Live SQLite Index</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Main results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
              ))}
            </div>
          ) : searched && results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3>No results found</h3>
              <p>Try different keywords or adjust your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map(result => (
                <div key={result.id} className="search-result-card">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="badge badge-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                        {result.type}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 600 }}>{result.repo}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>/</span>
                      <span style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                        {result.file}:{result.line}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={`badge ${result.matchType === 'exact' ? 'badge-success' : result.matchType === 'semantic' ? 'badge-accent' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {result.matchType} ({result.score}%)
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>~{result.tokenCount} tokens</span>
                      <span className="badge badge-accent">{result.language}</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, lineHeight: 1.8, color: '#C9D1D9', background: '#0D1117', whiteSpace: 'pre', overflowX: 'auto' }}>
                    {highlight(result.preview, searched.split(' ').find(w => w.length > 3) ?? searched)}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {result.type === 'snippet' ? (
                        <Link href="/snippets" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                          Open in Snippets
                        </Link>
                      ) : (
                        <Link href="/repositories/repo-1" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                          Open in File Explorer
                        </Link>
                      )}
                      <Link href="/ai-assistant" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                        Ask AI Assistant
                      </Link>
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {result.tags.map(t => (
                          <span key={t} style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Recent Searches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RECENT_SEARCHES.map(s => (
                <button key={s} className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: 11, padding: '4px 8px', textAlign: 'left' }}
                  onClick={() => { setQuery(s); doSearch(s); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14, marginTop: 14 }}>
            <div className="card-title" style={{ marginBottom: 8 }}>Hybrid Search Engine</div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Queries calculate multi-field cosine similarity alongside BM25 term weighting to rank exact and conceptual matches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
