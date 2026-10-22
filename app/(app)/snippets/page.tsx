import { Suspense } from 'react';
import { getSnippets, getFolders, getTags } from '@/app/actions/snippets';
import SnippetsClient from './SnippetsClient';

export const metadata = {
  title: 'Snippets — SnippNXT',
  description: 'Manage, tag, and search your personal code snippets and coursework.',
};

function SnippetsLoadingSkeleton() {
  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 20 }}>
        <div>
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 360, height: 16 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
        </div>
      </div>

      <div className="snippet-workspace">
        <aside className="snippet-sidebar-card" style={{ height: 420 }}>
          <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '100%', height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 32, marginBottom: 24 }} />

          <div className="skeleton" style={{ width: 80, height: 14, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '100%', height: 30, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 30 }} />
        </aside>

        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
          </div>

          <div className="snippet-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="snippet-card" style={{ height: 220, opacity: 0.7 }}>
                <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '90%', height: 12, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: '100%', height: 90, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SnippetsPage() {
  return (
    <Suspense fallback={<SnippetsLoadingSkeleton />}>
      <SnippetsContent />
    </Suspense>
  );
}

async function SnippetsContent() {
  const [snippets, folders, tags] = await Promise.all([
    getSnippets(),
    getFolders(),
    getTags(),
  ]);

  return (
    <SnippetsClient
      initialSnippets={snippets}
      initialFolders={folders}
      initialTags={tags}
    />
  );
}
