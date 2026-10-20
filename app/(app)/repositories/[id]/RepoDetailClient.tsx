'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockRepositories, mockFiles } from '../../../_lib/mockData';

const FILE_TREE = [
  { id: 'src', label: 'src', type: 'folder', depth: 0, open: true },
  { id: 'src/core', label: 'core', type: 'folder', depth: 1, open: true },
  { id: 'src/core/analyzer.py', label: 'analyzer.py', type: 'file', depth: 2, fileId: 'f1', lang: 'python' },
  { id: 'src/core/embeddings.py', label: 'embeddings.py', type: 'file', depth: 2, fileId: 'f2', lang: 'python' },
  { id: 'src/core/retrieval.py', label: 'retrieval.py', type: 'file', depth: 2, fileId: 'f3', lang: 'python' },
  { id: 'src/main.py', label: 'main.py', type: 'file', depth: 1, fileId: 'f4', lang: 'python' },
  { id: 'src/api.py', label: 'api.py', type: 'file', depth: 1, fileId: 'f5', lang: 'python' },
  { id: 'tests', label: 'tests', type: 'folder', depth: 0, open: false },
  { id: 'tests/test_analyzer.py', label: 'test_analyzer.py', type: 'file', depth: 1, lang: 'python' },
  { id: 'requirements.txt', label: 'requirements.txt', type: 'file', depth: 0, lang: 'text' },
  { id: 'README.md', label: 'README.md', type: 'file', depth: 0, lang: 'markdown' },
];

function syntaxHighlight(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 16 }}>
      <span style={{ width: 32, textAlign: 'right', color: '#4A5568', userSelect: 'none', flexShrink: 0, fontSize: 11 }}>{idx + 1}</span>
      <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: highlightLine(line, lang) }} />
    </div>
  ));
}

function highlightLine(line: string, lang: string): string {
  if (lang !== 'python') return escapeHtml(line);
  const keywords = ['import', 'from', 'async', 'def', 'class', 'return', 'await', 'if', 'for', 'in', 'not', 'and', 'or', 'self', 'True', 'False', 'None', 'raise', 'with', 'yield', 'as', 'try', 'except'];
  let result = escapeHtml(line);
  // String literals
  result = result.replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#039;&#039;&#039;[\s\S]*?&#039;&#039;&#039;)/g, '<span style="color:#86EFAC">$1</span>');
  result = result.replace(/("""[\s\S]*?""")/g, '<span style="color:#86EFAC">$1</span>');
  // Comments
  result = result.replace(/(#[^<]*)$/, '<span style="color:#6B7280;font-style:italic">$1</span>');
  // Decorators
  result = result.replace(/(@\w+)/, '<span style="color:#F9A8D4">$1</span>');
  // Builtins / keywords
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span style="color:#C084FC">$1</span>');
  });
  // Function defs
  result = result.replace(/(<span[^>]*>def<\/span>) (\w+)/, '$1 <span style="color:#60A5FA">$2</span>');
  result = result.replace(/(<span[^>]*>class<\/span>) (\w+)/, '$1 <span style="color:#FBBF24">$2</span>');
  return result;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const INSIGHTS = [
  { label: 'Functions', value: '7', icon: '⊞' },
  { label: 'Classes', value: '2', icon: '⬡' },
  { label: 'Imports', value: '4', icon: '⌕' },
  { label: 'Complexity', value: 'Medium', icon: '⌁' },
];

export default function RepoDetailClient({ repoId }: { repoId: string }) {
  const repo = mockRepositories.find(r => r.id === repoId) ?? mockRepositories[0];
  const [selectedFileId, setSelectedFileId] = useState('f1');
  const [activeTab, setActiveTab] = useState<'code' | 'insights' | 'history'>('code');
  const [showInsights, setShowInsights] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'src/core']));
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedFile = mockFiles.find(f => f.id === selectedFileId) ?? mockFiles[0];

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAiExplain = () => {
    setAiExplaining(true);
    setAiExplanation('');
    const explanation = `**${selectedFile.name}** is the core analysis module for SnippNXT.\n\nThe \`RepositoryAnalyzer\` class orchestrates the full pipeline:\n1. **Index building** — loads and embeds all repository files.\n2. **Semantic retrieval** — uses \`SmartRetriever\` to find relevant code given a natural-language query.\n3. **Insight generation** — detects patterns like circular dependencies and high-complexity zones.\n\nThe class uses a dictionary cache (\`_index_cache\`) to avoid re-indexing on repeated calls. This is efficient but can cause unbounded memory growth in long-lived processes — see the related issue in the Issues panel.`;
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setAiExplanation(explanation.slice(0, i));
      if (i >= explanation.length) clearInterval(interval);
    }, 20);
    setTimeout(() => setAiExplaining(false), 100);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleTree = FILE_TREE.filter(node => {
    if (node.depth === 0) return true;
    const parentPath = node.id.split('/').slice(0, -1).join('/');
    return openFolders.has(parentPath);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px - 48px)', gap: 0 }}>
      {/* Repo header */}
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 4 }}>
            <span className="lang-dot" style={{ background: repo.langColor }} />
            <h1 className="page-title">{repo.name}</h1>
            <span className="badge badge-success">{repo.status}</span>
          </div>
          <p className="page-subtitle">{repo.description} · {repo.branch} · {repo.fileCount} files</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/dependencies" className="btn btn-secondary btn-sm">
            Dependencies
          </Link>
          <Link href="/issues" className="btn btn-secondary btn-sm">
            Issues
          </Link>
        </div>
      </div>

      {/* IDE Layout */}
      <div className="ide-layout">
        {/* File Tree */}
        <div className="file-tree">
          <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>
            FILES
          </div>
          <div style={{ overflow: 'auto', flex: 1, padding: '6px 4px' }}>
            {visibleTree.map(node => (
              <div
                key={node.id}
                className={`tree-item ${node.type === 'file' && selectedFileId === (node as any).fileId ? 'tree-item-active' : ''}`}
                style={{ paddingLeft: 8 + node.depth * 14 }}
                onClick={() => {
                  if (node.type === 'folder') toggleFolder(node.id);
                  else if ((node as any).fileId) setSelectedFileId((node as any).fileId);
                }}
              >
                <span style={{ fontSize: 11, color: node.type === 'folder' ? 'var(--warning)' : 'var(--text-muted)', marginRight: 6, flexShrink: 0 }}>
                  {node.type === 'folder' ? (openFolders.has(node.id) ? '▾' : '▸') : getFileIcon((node as any).lang)}
                </span>
                <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="code-panel">
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'var(--surface)', gap: 0 }}>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid var(--accent)', fontSize: 12, color: 'var(--accent-light)', background: 'var(--surface-2)', flexShrink: 0 }}>
                <span style={{ fontSize: 11 }}>{getFileIcon('python')}</span>
                <span>{selectedFile.name}</span>
              </div>
            </div>
            <div className="row" style={{ padding: '0 10px', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAiExplain}
                disabled={aiExplaining}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {aiExplaining ? 'Explaining...' : 'Explain with AI'}
              </button>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setShowInsights(!showInsights)}
                title={showInsights ? 'Hide insights' : 'Show insights'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Code body */}
          <div style={{ flex: 1, overflow: 'auto', background: '#0D1117', fontFamily: 'var(--font-geist-mono, Consolas, monospace)', fontSize: 12, lineHeight: '20px', padding: 16 }}>
            {syntaxHighlight(selectedFile.content, selectedFile.language)}
          </div>

          {/* AI explanation */}
          {aiExplanation && (
            <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border-accent)', maxHeight: 160, overflow: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-light)', marginBottom: 8 }}>AI EXPLANATION (DEMO)</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiExplanation}</div>
            </div>
          )}
        </div>

        {/* Insights Panel */}
        {showInsights && (
          <div className="insights-panel">
            <div className="tab-list" style={{ marginBottom: 0, padding: '0 12px' }}>
              {(['code', 'insights', 'history'] as const).map(t => (
                <button key={t} className={`tab-btn ${activeTab === t ? 'tab-btn-active' : ''}`} onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              {activeTab === 'code' && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{selectedFile.path}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {INSIGHTS.map(ins => (
                      <div key={ins.label} style={{ padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>{ins.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{ins.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>File Info</div>
                  {[['Size', selectedFile.size], ['Lines', selectedFile.lines], ['Modified', selectedFile.lastModified], ['Language', selectedFile.language]].map(([k, v]) => (
                    <div key={k} className="row-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'insights' && (
                <div>
                  <div style={{ padding: '10px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Unbounded cache growth</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>_index_cache is never evicted. Consider using lru_cache.</div>
                    <Link href="/issues" style={{ fontSize: 10, color: 'var(--warning)', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>View issue →</Link>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Well-structured async patterns</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>Proper use of async/await throughout the module.</div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { msg: 'Updated token budget handling', time: '2h ago', author: 'Jane Dev' },
                    { msg: 'Added _generate_insights method', time: '1d ago', author: 'Jane Dev' },
                    { msg: 'Initial analyzer implementation', time: '3d ago', author: 'Jane Dev' },
                  ].map((c, i) => (
                    <div key={i} style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4 }}>{c.msg}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{c.author} · {c.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getFileIcon(lang?: string) {
  const icons: Record<string, string> = {
    python: '🐍',
    typescript: '📘',
    javascript: '📜',
    markdown: '📄',
    text: '📃',
  };
  return icons[lang ?? ''] ?? '📄';
}
