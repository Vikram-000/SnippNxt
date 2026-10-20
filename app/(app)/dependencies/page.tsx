'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { mockDependencies } from '../../_lib/mockData';
import Link from 'next/link';

type DepNode = typeof mockDependencies[0];

const EDGES = mockDependencies.flatMap(node =>
  node.imports.map(imp => ({ from: node.id, to: imp }))
);

function getSvgEdges(nodes: DepNode[], selected: string | null) {
  return EDGES.map((e, i) => {
    const from = nodes.find(n => n.id === e.from);
    const to = nodes.find(n => n.id === e.to);
    if (!from || !to) return null;
    const isHighlighted = selected && (e.from === selected || e.to === selected);
    return (
      <line
        key={i}
        x1={from.x} y1={from.y}
        x2={to.x} y2={to.y}
        stroke={isHighlighted ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}
        strokeWidth={isHighlighted ? 2 : 1}
        markerEnd="url(#arrow)"
      />
    );
  });
}

export default function DependenciesPage() {
  const [selected, setSelected] = useState<string | null>('core/analyzer.py');
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const selectedNode = mockDependencies.find(n => n.id === selected);
  const dependents = mockDependencies.filter(n => n.imports.includes(selected ?? ''));

  const filtered = mockDependencies.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    setPan(p => ({ x: p.x + (e.clientX - lastPos.current.x), y: p.y + (e.clientY - lastPos.current.y) }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const nodeSizeMap: Record<string, number> = { large: 1.2, medium: 1.0, small: 0.85 };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Dependency Analysis</h1>
          <p className="page-subtitle">Explore file relationships and module imports · <span className="badge badge-warning">Demo data</span></p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset View</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>Zoom In</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}>Zoom Out</button>
        </div>
      </div>

      <div className="dep-layout">
        {/* Graph */}
        <div className="dep-graph-area">
          {/* Toolbar */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>snippnxt-core</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{mockDependencies.length} modules · {EDGES.length} edges</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'inline-block' }} />
                Selected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                <span style={{ width: 10, height: 1, background: '#8B5CF6', display: 'inline-block' }} />
                Active edge
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div className="graph-canvas" onMouseDown={onMouseDown}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.2)" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {getSvgEdges(mockDependencies as DepNode[], selected)}
              </g>
            </svg>

            <div style={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
              {mockDependencies.map(node => {
                const scale = nodeSizeMap[node.size] ?? 1;
                const isSelected = node.id === selected;
                const isRelated = selected && (node.imports.includes(selected) || selectedNode?.imports.includes(node.id));
                return (
                  <div
                    key={node.id}
                    className={`graph-node ${isSelected ? 'graph-node-selected' : ''}`}
                    style={{
                      left: node.x,
                      top: node.y,
                      transform: `translate(-50%, -50%) scale(${scale})`,
                      pointerEvents: 'all',
                      borderColor: isRelated ? 'rgba(34,211,238,0.5)' : undefined,
                    }}
                    onClick={() => setSelected(node.id === selected ? null : node.id)}
                  >
                    <span style={{ fontSize: 10, color: isSelected ? 'var(--accent-light)' : 'var(--text-dim)' }}>🐍</span>
                    {node.label}
                    {node.imports.length > 0 && (
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 10 }}>
                        {node.imports.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="dep-sidebar">
          {/* Module list */}
          <div className="card" style={{ padding: 14 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Modules</div>
            <div className="search-field" style={{ marginBottom: 10 }}>
              <span className="search-field-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input className="input-field" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 30, fontSize: 11 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map(node => (
                <button key={node.id}
                  onClick={() => setSelected(node.id === selected ? null : node.id)}
                  className={`sidebar-item ${selected === node.id ? 'sidebar-item-active' : ''}`}
                  style={{ border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11 }}
                >
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>🐍</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>
                  {node.imports.length > 0 && <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{node.imports.length}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Details panel */}
          {selectedNode && (
            <div className="card" style={{ padding: 14 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>{selectedNode.label}</div>

              {dependents.length > 0 && (
                <div style={{ padding: '8px 10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>
                    ⚠ High coupling
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {dependents.length} modules depend on this file.
                  </div>
                </div>
              )}

              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: 6 }}>IMPORTS ({selectedNode.imports.length})</div>
              {selectedNode.imports.length === 0
                ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No imports</div>
                : selectedNode.imports.map(imp => (
                  <div key={imp} onClick={() => setSelected(imp)}
                    style={{ fontSize: 11, color: 'var(--cyan)', cursor: 'pointer', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>→</span> {imp.split('/').pop()}
                  </div>
                ))
              }

              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)', margin: '12px 0 6px' }}>DEPENDED ON BY ({dependents.length})</div>
              {dependents.length === 0
                ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Not imported by others</div>
                : dependents.map(d => (
                  <div key={d.id} onClick={() => setSelected(d.id)}
                    style={{ fontSize: 11, color: 'var(--accent-light)', cursor: 'pointer', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>←</span> {d.label}
                  </div>
                ))
              }

              <div style={{ marginTop: 12 }}>
                <Link href={`/repositories/repo-1`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                  Open in Explorer
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
