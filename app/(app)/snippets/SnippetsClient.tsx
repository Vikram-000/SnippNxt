'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  type SnippetItem,
  type FolderItem,
  type TagItem,
  getSnippets,
  getFolders,
  getTags,
  createSnippet,
  deleteSnippet,
  toggleFavoriteSnippet,
  createFolder,
  deleteFolder,
} from '@/app/actions/snippets';
import { highlightLine } from '@/lib/syntaxHighlight';

const LANGUAGE_OPTIONS = [
  { label: 'All Languages', value: 'all' },
  { label: 'Python', value: 'python', color: '#3572A5' },
  { label: 'TypeScript', value: 'typescript', color: '#3178C6' },
  { label: 'JavaScript', value: 'javascript', color: '#F7DF1E' },
  { label: 'SQL', value: 'sql', color: '#E38C00' },
  { label: 'Rust', value: 'rust', color: '#DEA584' },
  { label: 'Go', value: 'go', color: '#00ADD8' },
  { label: 'HTML/CSS', value: 'html', color: '#E34F26' },
];

const PRESET_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#22D3EE', '#6366F1'];
const PRESET_ICONS = ['📁', '📚', '💻', '⚡', '🧠', '🚀', '🎯', '🔬'];

export default function SnippetsClient({
  initialSnippets,
  initialFolders,
  initialTags,
}: {
  initialSnippets: SnippetItem[];
  initialFolders: FolderItem[];
  initialTags: TagItem[];
}) {
  const [snippets, setSnippets] = useState<SnippetItem[]>(initialSnippets);
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [tags, setTags] = useState<TagItem[]>(initialTags);

  // Filters
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isNewSnippetOpen, setIsNewSnippetOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [viewingSnippet, setViewingSnippet] = useState<SnippetItem | null>(null);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for New Snippet
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('python');
  const [newFolderId, setNewFolderId] = useState<string>('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [isSubmittingSnippet, setIsSubmittingSnippet] = useState(false);

  // Form states for New Folder
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderColor, setFolderColor] = useState(PRESET_COLORS[0]);
  const [folderIcon, setFolderIcon] = useState(PRESET_ICONS[0]);
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);

  // Filtered snippets calculation
  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      if (selectedFolderId === 'favorites' && !s.isFavorite) return false;
      if (selectedFolderId !== 'all' && selectedFolderId !== 'favorites' && s.folderId !== selectedFolderId) {
        return false;
      }
      if (selectedTag && !s.tags.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }
      if (selectedLanguage !== 'all' && s.language.toLowerCase() !== selectedLanguage.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesDesc = (s.description || '').toLowerCase().includes(q);
        const matchesCode = s.code.toLowerCase().includes(q);
        const matchesTag = s.tags.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesCode && !matchesTag) return false;
      }
      return true;
    });
  }, [snippets, selectedFolderId, selectedTag, selectedLanguage, searchQuery]);

  // Actions
  const handleCopy = (e: React.MouseEvent, id: string, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Optimistic update
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
    try {
      await toggleFavoriteSnippet(id);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      // Revert if error
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
      );
    }
  };

  const handleDeleteSnippet = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    const prev = [...snippets];
    setSnippets((curr) => curr.filter((s) => s.id !== id));
    if (viewingSnippet?.id === id) setViewingSnippet(null);
    try {
      await deleteSnippet(id);
      // Refresh folders/tags counts
      const [updatedFolders, updatedTags] = await Promise.all([getFolders(), getTags()]);
      setFolders(updatedFolders);
      setTags(updatedTags);
    } catch (err) {
      console.error('Failed to delete snippet', err);
      setSnippets(prev);
    }
  };

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    setIsSubmittingSnippet(true);
    try {
      const parsedTags = newTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createSnippet({
        title: newTitle,
        description: newDescription,
        code: newCode,
        language: newLang,
        folderId: newFolderId || null,
        tags: parsedTags,
      });

      setSnippets((prev) => [created, ...prev]);
      setIsNewSnippetOpen(false);
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCode('');
      setNewTagsStr('');
      setNewFolderId('');
      setEditorTab('write');

      // Refresh tags and folders counts
      const [updatedFolders, updatedTags] = await Promise.all([getFolders(), getTags()]);
      setFolders(updatedFolders);
      setTags(updatedTags);
    } catch (err) {
      console.error('Failed to create snippet', err);
      alert('Failed to create snippet. Please check your inputs.');
    } finally {
      setIsSubmittingSnippet(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmittingFolder(true);
    try {
      const created = await createFolder({
        name: folderName,
        description: folderDesc,
        color: folderColor,
        icon: folderIcon,
      });
      setFolders((prev) => [...prev, created]);
      setIsNewFolderOpen(false);
      setFolderName('');
      setFolderDesc('');
    } catch (err) {
      console.error('Failed to create folder', err);
      alert('Failed to create folder.');
    } finally {
      setIsSubmittingFolder(false);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this folder? Snippets inside it will be unassigned but not deleted.')) return;
    try {
      await deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId('all');
    } catch (err) {
      console.error('Failed to delete folder', err);
    }
  };

  const favoritesCount = snippets.filter((s) => s.isFavorite).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Code Snippets</h1>
          <p className="page-subtitle">
            Save, tag, and organize reusable algorithms, boilerplate, and coursework code.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsNewFolderOpen(true)}
            style={{ fontSize: 13 }}
          >
            <span>+ Folder</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsNewSnippetOpen(true)}
            style={{ fontSize: 13 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Snippet</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="snippet-workspace">
        {/* Left Sidebar Filters */}
        <aside className="snippet-sidebar-card">
          {/* Main quick filters */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Quick Filters
            </div>
            <div
              className={`snippet-nav-item ${selectedFolderId === 'all' && !selectedTag ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolderId('all');
                setSelectedTag(null);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📁</span>
                <span>All Snippets</span>
              </div>
              <span className="badge badge-muted" style={{ fontSize: 10 }}>{snippets.length}</span>
            </div>
            <div
              className={`snippet-nav-item ${selectedFolderId === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolderId('favorites');
                setSelectedTag(null);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#FBBF24' }}>★</span>
                <span>Favorites</span>
              </div>
              <span className="badge badge-muted" style={{ fontSize: 10 }}>{favoritesCount}</span>
            </div>
          </div>

          {/* Folders */}
          <div>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Folders
              </span>
              <button
                onClick={() => setIsNewFolderOpen(true)}
                className="btn btn-ghost"
                style={{ padding: '2px 6px', fontSize: 11, color: 'var(--accent-light)' }}
              >
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {folders.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '6px 8px' }}>
                  No folders yet.
                </div>
              ) : (
                folders.map((folder) => {
                  const isActive = selectedFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      className={`snippet-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSelectedTag(null);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 13 }}>{folder.icon || '📁'}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {folder.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>
                          {folder.snippetCount}
                        </span>
                        <button
                          onClick={(e) => handleDeleteFolder(e, folder.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '0 2px',
                          }}
                          title="Delete folder"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No tags yet.</div>
              ) : (
                tags.map((tag) => {
                  const isTagActive = selectedTag?.toLowerCase() === tag.name.toLowerCase();
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(isTagActive ? null : tag.name)}
                      style={{
                        background: isTagActive ? 'var(--accent)' : 'var(--surface-2)',
                        color: isTagActive ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${isTagActive ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 12,
                        padding: '3px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: tag.color || '#8B5CF6',
                        }}
                      />
                      <span>{tag.name}</span>
                      <span style={{ opacity: 0.6, fontSize: 10 }}>({tag.snippetCount})</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div>
          {/* Controls bar */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search snippets by title, description, code, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ width: '100%', height: 36, paddingLeft: 32, fontSize: 12 }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  pointerEvents: 'none',
                }}
              >
                ⌕
              </span>
            </div>

            {/* Language filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="select-field"
              style={{ height: 36, fontSize: 12, minWidth: 140 }}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'var(--surface-3)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? 'var(--text)' : 'var(--text-dim)',
                  padding: '6px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
                title="Grid View"
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--surface-3)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'list' ? 'var(--text)' : 'var(--text-dim)',
                  padding: '6px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
                title="List View"
              >
                ☰ List
              </button>
            </div>
          </div>

          {/* Active filter summary pill */}
          {(selectedFolderId !== 'all' || selectedTag || selectedLanguage !== 'all' || searchQuery) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <span>Filtering by:</span>
              {selectedFolderId !== 'all' && (
                <span className="badge badge-accent">
                  Folder: {selectedFolderId === 'favorites' ? 'Favorites' : folders.find((f) => f.id === selectedFolderId)?.name || 'Custom'}
                </span>
              )}
              {selectedTag && <span className="badge badge-accent">Tag: #{selectedTag}</span>}
              {selectedLanguage !== 'all' && <span className="badge badge-accent">Lang: {selectedLanguage}</span>}
              {searchQuery && <span className="badge badge-accent">Search: &quot;{searchQuery}&quot;</span>}
              <button
                onClick={() => {
                  setSelectedFolderId('all');
                  setSelectedTag(null);
                  setSelectedLanguage('all');
                  setSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-light)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 11,
                  marginLeft: 4,
                }}
              >
                Reset all
              </button>
            </div>
          )}

          {/* Snippet List/Grid */}
          {filteredSnippets.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                No snippets found
              </div>
              <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto 16px', color: 'var(--text-muted)' }}>
                {searchQuery || selectedTag || selectedFolderId !== 'all'
                  ? 'No snippets match your current search or filter criteria.'
                  : 'You have not created any code snippets yet. Save your first reusable snippet now!'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setIsNewSnippetOpen(true)}
                style={{ margin: '0 auto' }}
              >
                + Create Snippet
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'snippet-grid' : 'snippet-list'}>
              {filteredSnippets.map((snippet) => {
                const previewLines = snippet.code.split('\n').slice(0, 5);
                const hasMore = snippet.code.split('\n').length > 5;
                const isCopied = copiedId === snippet.id;

                return (
                  <div
                    key={snippet.id}
                    className="snippet-card"
                    onClick={() => setViewingSnippet(snippet)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Card Header */}
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span
                            className="badge badge-muted"
                            style={{
                              textTransform: 'uppercase',
                              fontSize: 10,
                              fontWeight: 600,
                              letterSpacing: 0.5,
                            }}
                          >
                            {snippet.language}
                          </span>
                          {snippet.folderName && (
                            <span
                              style={{
                                fontSize: 11,
                                color: snippet.folderColor || 'var(--accent-light)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              📁 {snippet.folderName}
                            </span>
                          )}
                        </div>
                        <h3
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {snippet.title}
                        </h3>
                      </div>

                      {/* Header Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={(e) => handleToggleFavorite(e, snippet.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 16,
                            color: snippet.isFavorite ? '#FBBF24' : 'var(--text-dim)',
                            padding: 2,
                            lineHeight: 1,
                          }}
                          title={snippet.isFavorite ? 'Favorited' : 'Add to favorites'}
                        >
                          ★
                        </button>
                        <button
                          onClick={(e) => handleCopy(e, snippet.id, snippet.code)}
                          style={{
                            background: isCopied ? 'rgba(52,211,153,0.15)' : 'var(--surface-2)',
                            color: isCopied ? 'var(--success)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: '3px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                          title="Copy snippet code"
                        >
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={(e) => handleDeleteSnippet(e, snippet.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: 'var(--text-dim)',
                            padding: 2,
                          }}
                          title="Delete snippet"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {snippet.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          margin: 0,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {snippet.description}
                      </p>
                    )}

                    {/* Code Preview with Syntax Highlighting */}
                    <div className="snippet-code-preview">
                      {previewLines.map((line, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10 }}>
                          <span
                            style={{
                              width: 20,
                              textAlign: 'right',
                              color: 'var(--text-dim)',
                              userSelect: 'none',
                              fontSize: 10,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span
                            style={{ flex: 1, whiteSpace: 'pre' }}
                            dangerouslySetInnerHTML={{
                              __html: highlightLine(line, snippet.language),
                            }}
                          />
                        </div>
                      ))}
                      {hasMore && (
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: 10,
                            color: 'var(--accent-light)',
                            marginTop: 4,
                            fontStyle: 'italic',
                          }}
                        >
                          + {snippet.code.split('\n').length - 5} more lines
                        </div>
                      )}
                    </div>

                    {/* Footer Tags & Metadata */}
                    <div
                      className="row-between"
                      style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {snippet.tags.map((t) => (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 10,
                              color: 'var(--text-dim)',
                              background: 'var(--surface-2)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {new Date(snippet.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL: NEW SNIPPET ==================== */}
      {isNewSnippetOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewSnippetOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            {/* Modal Header */}
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                  Create New Code Snippet
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Save reusable code with tags, language syntax, and notes.
                </p>
              </div>
              <button
                onClick={() => setIsNewSnippetOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: 16, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSnippet}>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: '72vh' }}>
                {/* Title & Language */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Iterative Binary Search"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: 36, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Language *
                    </label>
                    <select
                      value={newLang}
                      onChange={(e) => setNewLang(e.target.value)}
                      className="select-field"
                      style={{ width: '100%', height: 36, fontSize: 12 }}
                    >
                      {LANGUAGE_OPTIONS.filter((l) => l.value !== 'all').map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Folder & Tags */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Folder (Course / Project)
                    </label>
                    <select
                      value={newFolderId}
                      onChange={(e) => setNewFolderId(e.target.value)}
                      className="select-field"
                      style={{ width: '100%', height: 36, fontSize: 12 }}
                    >
                      <option value="">No Folder (General)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.icon || '📁'} {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. algorithms, python, search"
                      value={newTagsStr}
                      onChange={(e) => setNewTagsStr(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: 36, fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Description / Notes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Notes & Markdown Documentation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe how to use this snippet, edge cases, time/space complexity..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontSize: 12, padding: '8px 10px', resize: 'vertical' }}
                  />
                </div>

                {/* Code & Preview Tab */}
                <div>
                  <div className="row-between" style={{ marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                      Code Content *
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setEditorTab('write')}
                        style={{
                          background: editorTab === 'write' ? 'var(--surface-3)' : 'transparent',
                          color: editorTab === 'write' ? 'var(--text)' : 'var(--text-dim)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        style={{
                          background: editorTab === 'preview' ? 'var(--surface-3)' : 'transparent',
                          color: editorTab === 'preview' ? 'var(--text)' : 'var(--text-dim)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Highlight Preview
                      </button>
                    </div>
                  </div>

                  {editorTab === 'write' ? (
                    <textarea
                      rows={8}
                      required
                      placeholder="// Paste or write your code snippet here..."
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        fontFamily: 'var(--font-geist-mono, monospace)',
                        fontSize: 12,
                        padding: 10,
                        lineHeight: 1.5,
                        background: '#090B10',
                      }}
                    />
                  ) : (
                    <div
                      className="snippet-code-full"
                      style={{ minHeight: 180, background: '#090B10' }}
                    >
                      {newCode.trim() ? (
                        newCode.split('\n').map((line, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10 }}>
                            <span style={{ width: 24, textAlign: 'right', color: 'var(--text-dim)', fontSize: 11 }}>
                              {idx + 1}
                            </span>
                            <span
                              style={{ flex: 1, whiteSpace: 'pre' }}
                              dangerouslySetInnerHTML={{
                                __html: highlightLine(line, newLang),
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 12 }}>
                          No code entered yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  background: 'var(--surface-2)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNewSnippetOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingSnippet}
                >
                  {isSubmittingSnippet ? 'Saving...' : 'Save Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW FOLDER ==================== */}
      {isNewFolderOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewFolderOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                  Create New Folder
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Group snippets by class, assignment, or project.
                </p>
              </div>
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: 16, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS201: Web Architectures"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: 36, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={folderDesc}
                    onChange={(e) => setFolderDesc(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: 36, fontSize: 12 }}
                  />
                </div>

                {/* Color presets */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setFolderColor(c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: c,
                          border: folderColor === c ? '2px solid white' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon presets */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Folder Icon
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PRESET_ICONS.map((ico) => (
                      <button
                        type="button"
                        key={ico}
                        onClick={() => setFolderIcon(ico)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: folderIcon === ico ? 'var(--surface-3)' : 'var(--surface-2)',
                          border: folderIcon === ico ? '1px solid var(--accent)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: 'var(--surface-2)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNewFolderOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingFolder}
                >
                  {isSubmittingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FULL SNIPPET DETAIL ==================== */}
      {viewingSnippet && (
        <div className="modal-backdrop" onClick={() => setViewingSnippet(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            {/* Header */}
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="badge badge-accent" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                    {viewingSnippet.language}
                  </span>
                  {viewingSnippet.folderName && (
                    <span style={{ fontSize: 12, color: viewingSnippet.folderColor || 'var(--accent-light)' }}>
                      📁 {viewingSnippet.folderName}
                    </span>
                  )}
                  {viewingSnippet.isFavorite && (
                    <span style={{ color: '#FBBF24', fontSize: 14 }}>★ Favorite</span>
                  )}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                  {viewingSnippet.title}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => handleCopy(e, viewingSnippet.id, viewingSnippet.code)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  {copiedId === viewingSnippet.id ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
                <button
                  onClick={() => setViewingSnippet(null)}
                  className="btn btn-ghost"
                  style={{ fontSize: 16, padding: '4px 8px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              {viewingSnippet.description && (
                <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 6, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                  {viewingSnippet.description}
                </div>
              )}

              {/* Code */}
              <div className="snippet-code-full">
                {viewingSnippet.code.split('\n').map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ width: 28, textAlign: 'right', color: 'var(--text-dim)', fontSize: 11, userSelect: 'none' }}>
                      {idx + 1}
                    </span>
                    <span
                      style={{ flex: 1, whiteSpace: 'pre' }}
                      dangerouslySetInnerHTML={{
                        __html: highlightLine(line, viewingSnippet.language),
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Tags */}
              {viewingSnippet.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {viewingSnippet.tags.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        fontSize: 11,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: 12,
                      }}
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 20px',
                background: 'var(--surface-2)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Saved on {new Date(viewingSnippet.createdAt).toLocaleDateString()}
              </span>
              <button
                className="btn btn-ghost"
                onClick={(e) => handleDeleteSnippet(e, viewingSnippet.id)}
                style={{ color: 'var(--error)', fontSize: 12 }}
              >
                Delete Snippet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
