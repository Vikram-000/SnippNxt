'use client';

import { useState, useEffect } from 'react';
import { getIssues, updateIssueStatus, type IssueItem as Issue } from '@/app/actions/issues';
import Link from 'next/link';

function SeverityIcon({ sev }: { sev: Issue['severity'] }) {
  const c = { error: 'var(--error)', warning: 'var(--warning)', info: 'var(--cyan)' }[sev];
  const icons = { error: '✕', warning: '⚠', info: 'ℹ' };
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, border: `1px solid ${c}33`, display: 'grid', placeItems: 'center', color: c, fontSize: 12, flexShrink: 0 }}>
      {icons[sev]}
    </div>
  );
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    getIssues()
      .then((data) => {
        if (isMounted) {
          setIssues(data);
          setSelected(data[0] ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load issues:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = issues.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.file.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    error: issues.filter(i => i.severity === 'error' && i.status !== 'resolved').length,
    warning: issues.filter(i => i.severity === 'warning' && i.status !== 'resolved').length,
    info: issues.filter(i => i.severity === 'info' && i.status !== 'resolved').length,
  };

  const resolve = async (id: string) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'resolved' } : null);
    await updateIssueStatus(id, 'resolved').catch(console.error);
  };

  const ignore = async (id: string) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'ignored' } : i));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'ignored' } : null);
    await updateIssueStatus(id, 'ignored').catch(console.error);
  };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">
            {loading ? 'Loading code quality findings from database...' : 'Code quality findings · Live database'}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {([['error', 'Errors', counts.error], ['warning', 'Warnings', counts.warning], ['info', 'Info', counts.info]] as const).map(([sev, label, count]) => (
          <div key={sev} className="stat-card" style={{ cursor: 'pointer', borderColor: severityFilter === sev ? `var(--${sev === 'error' ? 'error' : sev === 'warning' ? 'warning' : 'cyan'})` + '55' : undefined }}
            onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
            <div className={`stat-value sev-${sev}`} style={{ fontSize: 28 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="row" style={{ gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-field" style={{ width: 240 }}>
          <span className="search-field-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input className="input-field" placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32 }} />
        </div>
        <select className="select-field" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} issues</span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 320px)', minHeight: 400 }}>
        {/* Issue list */}
        <div style={{ width: 340, flexShrink: 0, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"/>
                  </svg>
                </div>
                <h3>No issues</h3>
                <p>Good work — no issues match the current filters.</p>
              </div>
            ) : filtered.map((issue, i) => (
              <div key={issue.id}
                onClick={() => setSelected(issue)}
                style={{
                  padding: '12px 14px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  background: selected?.id === issue.id ? 'var(--accent-glow)' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div className="row" style={{ gap: 10, marginBottom: 6 }}>
                  <SeverityIcon sev={issue.severity} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selected?.id === issue.id ? 'var(--text)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-geist-mono, monospace)' }}>
                      {issue.file}:{issue.line}
                    </div>
                  </div>
                </div>
                {issue.status !== 'open' && (
                  <span className={`badge ${issue.status === 'resolved' ? 'badge-success' : 'badge-muted'}`}>{issue.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              </div>
              <h3>Select an issue</h3>
              <p>Click an issue from the list to see details.</p>
            </div>
          ) : (
            <div style={{ padding: 20, overflow: 'auto' }}>
              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <SeverityIcon sev={selected.severity} />
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{selected.title}</h2>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {selected.file}:{selected.line} · Rule: {selected.rule}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>DESCRIPTION</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{selected.description}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>PROPOSED FIX</div>
                <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>
                  {selected.fix}
                </div>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <Link href={`/repositories/repo-1`} className="btn btn-secondary btn-sm">View in Code</Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-sm">Ask AI</Link>
                {selected.status === 'open' && (
                  <>
                    <button className="btn btn-sm" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}
                      onClick={() => resolve(selected.id)}>
                      Mark Resolved
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => ignore(selected.id)}>Ignore</button>
                  </>
                )}
                {selected.status !== 'open' && (
                  <span className={`badge ${selected.status === 'resolved' ? 'badge-success' : 'badge-muted'}`} style={{ padding: '6px 12px' }}>
                    {selected.status === 'resolved' ? '✓ Resolved' : 'Ignored'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
