'use client';

import { useState } from 'react';
import { mockPerformanceData } from '../../_lib/mockData';

function MiniBarChart({ data, valueKey, color = '#8B5CF6', maxVal }: {
  data: typeof mockPerformanceData.weekly;
  valueKey: keyof typeof mockPerformanceData.weekly[0];
  color?: string;
  maxVal?: number;
}) {
  const vals = data.map(d => Number(d[valueKey]));
  const max = maxVal ?? Math.max(...vals);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%',
            height: `${(Number(d[valueKey]) / max) * 52}px`,
            minHeight: 4,
            background: color,
            opacity: 0.8,
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.3s',
          }} />
          <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function MetricTooltip({ label, help }: { label: string; help: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{ fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px dashed var(--border)', cursor: 'help' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >{label}</span>
      {show && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, padding: '8px 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', width: 220, zIndex: 10, lineHeight: 1.6 }}>
          {help}
        </div>
      )}
    </div>
  );
}

export default function PerformancePage() {
  const [selectedRepo, setSelectedRepo] = useState('snippnxt-core');
  const [timeRange, setTimeRange] = useState('7d');
  const data = mockPerformanceData;

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Analysis latency, token usage, and retrieval efficiency · <span className="badge badge-warning">Simulated values</span></p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <select className="select-field" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
            <option value="snippnxt-core">snippnxt-core</option>
            <option value="snippnxt-ui">snippnxt-ui</option>
          </select>
          <select className="select-field" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Key metrics */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <MetricTooltip label="Avg. Analysis Duration" help="Time from query submission to first token returned, including indexing and retrieval." />
          <div className="stat-value">{data.avgAnalysisDuration}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>ms</span></div>
        </div>
        <div className="stat-card">
          <MetricTooltip label="Avg. Response Latency" help="End-to-end latency for a full AI response, including model generation time." />
          <div className="stat-value">{data.avgResponseLatency}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>ms</span></div>
        </div>
        <div className="stat-card">
          <MetricTooltip label="Avg. Tokens / Query" help="Estimated number of tokens sent to the LLM context window per analysis query." />
          <div className="stat-value">{data.estimatedTokensPerQuery.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <MetricTooltip label="Retrieval Efficiency" help="Ratio of relevant snippets to total retrieved. Higher = less context noise." />
          <div className="stat-value">{Math.round(data.retrievalEfficiency * 100)}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>%</span></div>
        </div>
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Daily Queries (This Week)</div>
          <MiniBarChart data={data.weekly} valueKey="queries" color="#8B5CF6" />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            Total: {data.weekly.reduce((a, d) => a + d.queries, 0)} queries
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Daily Token Usage</div>
          <MiniBarChart data={data.weekly} valueKey="tokens" color="#22D3EE" />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            Total: {(data.weekly.reduce((a, d) => a + d.tokens, 0) / 1000).toFixed(0)}K tokens
          </div>
        </div>
      </div>

      {/* Retrieval strategy comparison */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Retrieval Strategy Comparison</div>
            <div className="card-subtitle">How different retrieval approaches compare on quality, speed, and token cost</div>
          </div>
          <span className="badge badge-info">Research Direction</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Strategy', 'Precision', 'Recall', 'Avg. Tokens', 'Latency (ms)'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.strategies.map((s, i) => {
                const isBest = i === 2;
                return (
                  <tr key={s.name} style={{ background: isBest ? 'var(--accent-glow)' : 'transparent' }}>
                    <td style={{ padding: '12px', color: isBest ? 'var(--accent-light)' : 'var(--text)', fontWeight: isBest ? 600 : 400 }}>
                      {s.name} {isBest && <span className="badge badge-accent" style={{ marginLeft: 6 }}>Current</span>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.precision * 100}%`, background: 'var(--success)', borderRadius: 3 }} />
                        </div>
                        {Math.round(s.precision * 100)}%
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.recall * 100}%`, background: 'var(--cyan)', borderRadius: 3 }} />
                        </div>
                        {Math.round(s.recall * 100)}%
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text)' }}>{s.tokens.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: 'var(--text)' }}>{s.latency}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="demo-notice" style={{ marginTop: 16 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          These are illustrative values. SnippNXT&apos;s research goal is improving retrieval quality while reducing token consumption and latency. Real measurements require controlled experiments.
        </div>
      </div>

      {/* Latency trend */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Response Latency Trend</div>
        <MiniBarChart data={data.weekly} valueKey="latency" color="#34D399" maxVal={500} />
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Average: {data.avgResponseLatency}ms · Target: &lt;400ms
        </div>
      </div>
    </div>
  );
}
