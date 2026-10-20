import Link from 'next/link';
import { mockRepositories, mockActivity, mockIssues } from '../../_lib/mockData';

const StatCard = ({ label, value, change, icon, color }: {
  label: string; value: string | number; change?: string; icon: string; color?: string;
}) => (
  <div className="stat-card">
    <div className="stat-icon" style={color ? { background: color, color: 'white' } : undefined}>
      <span style={{ fontSize: 15 }}>{icon}</span>
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  </div>
);

const ActivityIcon = ({ type }: { type: string }) => {
  const icons: Record<string, string> = {
    indexed: '⬡', search: '⌕', issue: '⚠', ai: '✦', test: '✓'
  };
  const colors: Record<string, string> = {
    indexed: 'var(--success)', search: 'var(--cyan)', issue: 'var(--warning)',
    ai: 'var(--accent-light)', test: 'var(--success)'
  };
  return (
    <span style={{ color: colors[type] ?? 'var(--text-muted)', fontSize: 13 }}>
      {icons[type] ?? '·'}
    </span>
  );
};

export default function DashboardPage() {
  const openIssues = mockIssues.filter(i => i.status === 'open');

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Good evening, Jane</h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening across your repositories.</p>
        </div>
        <Link href="/repositories" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Repository
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Repositories" value={mockRepositories.length} change="↑ 1 this week" icon="⬡" color="rgba(139,92,246,0.3)" />
        <StatCard label="Files Analyzed" value="366" change="↑ 28 today" icon="⌕" color="rgba(34,211,238,0.2)" />
        <StatCard label="Open Issues" value={openIssues.length} change="↓ 2 resolved" icon="⚠" color="rgba(251,191,36,0.2)" />
        <StatCard label="AI Queries Today" value="17" change="avg 4.8s response" icon="✦" color="rgba(52,211,153,0.2)" />
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* Recent Repositories */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Repositories</div>
              <div className="card-subtitle">Last accessed or analyzed</div>
            </div>
            <Link href="/repositories" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockRepositories.slice(0, 4).map(repo => (
              <Link
                href={`/repositories/${repo.id}`}
                key={repo.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                className="repo-list-row"
              >
                <span
                  className="lang-dot"
                  style={{ background: repo.langColor }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repo.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{repo.fileCount} files · {repo.branch}</div>
                </div>
                <span className={`badge ${repo.status === 'indexed' ? 'badge-success' : repo.status === 'analyzing' ? 'badge-warning' : 'badge-muted'}`}>
                  {repo.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Actions and events across your workspace</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mockActivity.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                borderBottom: i < mockActivity.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <ActivityIcon type={item.type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{item.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.repo} · {item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Quick Actions</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/code-search" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search Code
          </Link>
          <Link href="/ai-assistant" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Ask AI Assistant
          </Link>
          <Link href="/repositories" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Repository
          </Link>
          <Link href="/issues" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            View Issues
            {openIssues.length > 0 && <span className="badge badge-error" style={{ marginLeft: 4 }}>{openIssues.length}</span>}
          </Link>
          <Link href="/testing" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
            </svg>
            Run Tests
          </Link>
          <Link href="/performance" className="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            </svg>
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
