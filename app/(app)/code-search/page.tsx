'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { mockSearchResults } from '../../_lib/mockData';

const EXAMPLE_QUERIES = [
  'Where is authentication handled?',
  'Find all database connection functions',
  'Show me the error handling logic',
  'Which files depend on the retrieval module?',
  'Find all async functions',
];

const RECENT_SEARCHES = [
  'token budget retrieval',
  'RepositoryAnalyzer class',
  'async def analyze',
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
  const [results, setResults] = useState(mockSearchResults);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedLang, setSelectedLang] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(q);
    setTimeout(() => {
      setResults(mockSearchResults.filter(r =>
        (selectedRepo === 'all' || r.repo === selectedRepo) &&
        r.preview.toLowerCase().includes(q.toLowerCase().split(' ').find(w => w.length > 3) ?? q.toLowerCase())
      ));
      setLoading(false);
    }, 700);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div>
      <div className="search-hero">
        <div className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#b8a7ff', marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8ce5bc', boxShadow: '0 0 8px rgba(140,229,188,0.5)', display: 'inline-block' }} />
          SEMANTIC CODE SEARCH
        </div>
        <h1 className="page-title" style={{ fontSize: 22, textAlign: 'center' }}>Search across your entire codebase</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Ask in natural language or search for exact code patterns.</p>

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
            placeholder="Ask about your code..."
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
          <select className="select-field" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
            <option value="all">All Repositories</option>
            <option value="snippnxt-core">snippnxt-core</option>
            <option value="snippnxt-ui">snippnxt-ui</option>
            <option value="auth-service">auth-service</option>
          </select>
          <select className="select-field" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>
        {searched && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {results.length} results for &quot;{searched}&quot; · <span className="badge badge-info">Demo results</span>
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
              {(searched ? results : mockSearchResults).map(result => (
                <div key={result.id} className="search-result-card">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="row" style={{ gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 600 }}>{result.repo}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>/</span>
                      <Link href={`/repositories/repo-1`} style={{ fontSize: 12, color: 'var(--cyan)', textDecoration: 'none', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                        {result.file}:{result.lineStart}
                      </Link>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Relevance: {Math.round(result.relevance * 100)}%</span>
                      <span className="badge badge-accent">python</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, lineHeight: 1.8, color: '#C9D1D9', background: '#0D1117', whiteSpace: 'pre' }}>
                    {searched
                      ? highlight(result.preview, searched.split(' ').find(w => w.length > 3) ?? searched)
                      : result.preview}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                    <Link href={`/repositories/repo-1`} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>Open file</Link>
                    <Link href="/ai-assistant" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>Explain with AI</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Recent searches</div>
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
        </div>
      </div>
    </div>
  );
}
