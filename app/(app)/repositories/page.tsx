'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRepositories, type RepositoryWithIssues } from '@/app/actions/repositories';

type Repo = RepositoryWithIssues;

function AddRepoDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [tab, setTab] = useState<'git' | 'upload'>('git');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1800);
  };

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        <div className="dialog-header">
          <div>
            <h2 className="dialog-title">Add Repository</h2>
            <p className="dialog-subtitle">Connect a Git repository or upload local files</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {step === 'success' ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)', color: 'var(--success)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3>Repository queued for indexing</h3>
            <p>This is a demo — no real repository was cloned or uploaded. In production, this would trigger the indexing pipeline.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={onClose}>Done</button>
              <Link href="/repositories/repo-1" className="btn btn-primary" onClick={onClose}>View Example Repo</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="tab-list" style={{ marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <button className={`tab-btn ${tab === 'git' ? 'tab-btn-active' : ''}`} onClick={() => setTab('git')}>Git URL</button>
              <button className={`tab-btn ${tab === 'upload' ? 'tab-btn-active' : ''}`} onClick={() => setTab('upload')}>Upload Files</button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'git' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="form-label">Repository Name</label>
                    <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="my-project" required />
                  </div>
                  <div>
                    <label className="form-label">Git URL</label>
                    <input className="input-field" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/org/repo" required />
                  </div>
                  <div className="demo-notice">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Demo mode — no repository will actually be cloned.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="upload-zone" onClick={() => document.getElementById('file-input')?.click()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                      {fileName ? fileName : 'Click to select files or ZIP archive'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Supported: .zip, .tar.gz or individual files</div>
                    <input id="file-input" type="file" accept=".zip,.tar.gz" style={{ display: 'none' }}
                      onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
                  </div>
                  <div className="demo-notice">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    </svg>
                    Demo mode — uploaded files are not processed on a server.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                      Queuing...
                    </span>
                  ) : 'Add Repository'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: Repo }) {
  return (
    <Link href={`/repositories/${repo.id}`} className="repo-card" style={{ textDecoration: 'none' }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, minWidth: 0 }}>
          <span className="lang-dot" style={{ background: repo.langColor }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repo.name}</span>
        </div>
        <span className={`badge ${repo.status === 'indexed' ? 'badge-success' : repo.status === 'analyzing' ? 'badge-warning' : 'badge-muted'}`}>
          {repo.status}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14, minHeight: 34 }}>{repo.description}</p>
      <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-dim)' }}>
        <span>{repo.language}</span>
        <span>·</span>
        <span>{repo.fileCount} files</span>
        <span>·</span>
        <span>{repo.branch}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-dim)' }}>
        Analyzed {repo.lastAnalyzed}
        {repo.issues > 0 && <span style={{ color: 'var(--warning)', marginLeft: 10 }}> ⚠ {repo.issues} issues</span>}
      </div>
    </Link>
  );
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    getRepositories()
      .then((data) => {
        if (isMounted) {
          setRepositories(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load repositories:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = repositories.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {showDialog && <AddRepoDialog onClose={() => setShowDialog(false)} />}

      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Repositories</h1>
          <p className="page-subtitle">
            {loading
              ? 'Loading repositories from database...'
              : `${repositories.length} repositories connected · ${repositories.filter(r => r.status === 'indexed').length} indexed`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowDialog(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Repository
        </button>
      </div>

      {/* Controls */}
      <div className="row-between" style={{ marginBottom: 20 }}>
        <div className="row" style={{ gap: 10 }}>
          <div className="search-field" style={{ width: 260 }}>
            <span className="search-field-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input className="input-field" placeholder="Search repositories..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="indexed">Indexed</option>
            <option value="analyzing">Analyzing</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className={`btn btn-ghost btn-sm btn-icon ${viewMode === 'grid' ? 'btn-secondary' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className={`btn btn-ghost btn-sm btn-icon ${viewMode === 'list' ? 'btn-secondary' : ''}`} onClick={() => setViewMode('list')} aria-label="List view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="repo-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="repo-card skeleton"
              style={{ height: 140, borderRadius: 12, opacity: 0.5 }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <h3>No repositories found</h3>
          <p>Try adjusting your search or filters, or add a new repository.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowDialog(true)}>Add Repository</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="repo-grid">
          {filtered.map(repo => <RepoCard key={repo.id} repo={repo} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((repo, i) => (
            <Link key={repo.id} href={`/repositories/${repo.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
              className="repo-list-row"
            >
              <span className="lang-dot" style={{ background: repo.langColor, width: 10, height: 10 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{repo.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{repo.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                <span>{repo.language}</span>
                <span>{repo.fileCount} files</span>
                <span>{repo.branch}</span>
                <span>{repo.lastAnalyzed}</span>
              </div>
              <span className={`badge ${repo.status === 'indexed' ? 'badge-success' : repo.status === 'analyzing' ? 'badge-warning' : 'badge-muted'}`}>
                {repo.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
