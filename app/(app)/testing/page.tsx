'use client';

import { useState } from 'react';
import { mockTestSuites } from '../../_lib/mockData';

type TestStatus = 'passed' | 'failed' | 'skipped';
type SuiteStatus = { passed: number; failed: number; skipped: number };

function StatusDot({ status }: { status: TestStatus }) {
  const c = { passed: 'var(--success)', failed: 'var(--error)', skipped: 'var(--text-dim)' }[status];
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />;
}

function CoverageMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TestingPage() {
  const [suites, setSuites] = useState(mockTestSuites);
  const [selectedSuiteId, setSelectedSuiteId] = useState(suites[0].id);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const selectedSuite = suites.find(s => s.id === selectedSuiteId) ?? suites[0];
  const totalPassed = suites.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = suites.reduce((acc, s) => acc + s.failed, 0);
  const totalSkipped = suites.reduce((acc, s) => acc + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;

  const filteredTests = selectedSuite.tests.filter(t =>
    statusFilter === 'all' || t.status === statusFilter
  );

  const runTests = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      // Simulate a test result update
      setSuites(prev => prev.map(s => ({ ...s, lastRun: 'just now' })));
    }, 2500);
  };

  const toggleTest = (id: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Testing</h1>
          <p className="page-subtitle">Test suites and results · <span className="badge badge-warning">Demo data — no real tests run</span></p>
        </div>
        <button className="btn btn-primary" onClick={runTests} disabled={running}>
          {running ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              Running...
            </span>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Tests</div>
          <div className="stat-value">{totalTests}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value sev-success">{totalPassed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value sev-error">{totalFailed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pass Rate</div>
          <div className="stat-value">{Math.round((totalPassed / totalTests) * 100)}%</div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Suite list + test details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suites.map(suite => {
            const passRate = Math.round((suite.passed / suite.total) * 100);
            return (
              <div key={suite.id}
                className="card"
                style={{ cursor: 'pointer', borderColor: selectedSuiteId === suite.id ? 'var(--border-accent)' : undefined }}
                onClick={() => setSelectedSuiteId(suite.id)}
              >
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{suite.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-geist-mono, monospace)' }}>{suite.file}</div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    {suite.failed > 0
                      ? <span className="badge badge-error">{suite.failed} failed</span>
                      : <span className="badge badge-success">All passing</span>
                    }
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{suite.duration}s</span>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${passRate}%`, background: suite.failed > 0 ? 'var(--warning)' : 'var(--success)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {suite.passed} passed · {suite.failed} failed · {suite.skipped} skipped · last run {suite.lastRun}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected suite details + coverage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Test cases */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="card-title">{selectedSuite.name}</div>
              </div>
              <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 28, fontSize: 11 }}>
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filteredTests.map((test, i) => (
                <div key={test.id} style={{ borderBottom: i < filteredTests.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    className="row"
                    style={{ padding: '9px 0', cursor: test.status === 'failed' ? 'pointer' : 'default', gap: 10 }}
                    onClick={() => test.status === 'failed' && toggleTest(test.id)}
                  >
                    <StatusDot status={test.status} />
                    <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--text)' }}>{test.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{test.duration > 0 ? `${test.duration}s` : '—'}</span>
                    {test.status === 'failed' && (
                      <span style={{ fontSize: 10, color: 'var(--error)' }}>{expandedTests.has(test.id) ? '▲' : '▼'}</span>
                    )}
                  </div>
                  {test.status === 'failed' && expandedTests.has(test.id) && (
                    <div style={{ padding: '8px 12px', margin: '0 0 8px', background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--error)', fontFamily: 'var(--font-geist-mono, monospace)', lineHeight: 1.6 }}>
                      {(test as any).error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coverage */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Code Coverage <span className="badge badge-warning" style={{ marginLeft: 8 }}>Demo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <CoverageMeter label="Statements" value={82} color="var(--success)" />
              <CoverageMeter label="Branches" value={68} color="var(--warning)" />
              <CoverageMeter label="Functions" value={91} color="var(--success)" />
              <CoverageMeter label="Lines" value={84} color="var(--success)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
