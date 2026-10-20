'use client';

import { useState, useEffect } from 'react';
import { getTestSuites, triggerRunTests, type TestSuiteItem } from '@/app/actions/testing';

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
  const [suites, setSuites] = useState<TestSuiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    getTestSuites()
      .then((data) => {
        if (mounted) {
          setSuites(data);
          if (data.length > 0) {
            setSelectedSuiteId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load test suites:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedSuite = suites.find(s => s.id === selectedSuiteId) ?? suites[0];
  const totalPassed = suites.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = suites.reduce((acc, s) => acc + s.failed, 0);
  const totalSkipped = suites.reduce((acc, s) => acc + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;

  const filteredTests = selectedSuite ? selectedSuite.tests.filter(t =>
    statusFilter === 'all' || t.status === statusFilter
  ) : [];

  const runTests = async () => {
    setRunning(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const updated = await triggerRunTests();
      setSuites(updated);
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setRunning(false);
    }
  };

  const toggleTest = (id: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header row-between" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Testing</h1>
            <p className="page-subtitle">Test suites and results · Loading suites from database...</p>
          </div>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card" style={{ opacity: 0.6 }}>
              <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 40, height: 24 }} />
            </div>
          ))}
        </div>
        <div className="two-col" style={{ gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ opacity: 0.6 }}>
                <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '100%', height: 8 }} />
              </div>
            ))}
          </div>
          <div className="card" style={{ opacity: 0.6, height: 260 }}>
            <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 40, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 40 }} />
          </div>
        </div>
      </div>
    );
  }

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
          <div className="stat-value">{totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%</div>
        </div>
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        {/* Suite list + test details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suites.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              No test suites found in the database.
            </div>
          ) : (
            suites.map(suite => {
              const passRate = suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0;
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
            })
          )}
        </div>

        {/* Selected suite details + coverage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Test cases */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="card-title">{selectedSuite?.name ?? 'No Suite Selected'}</div>
              </div>
              <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 28, fontSize: 11 }}>
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filteredTests.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No tests matching filter.
                </div>
              ) : (
                filteredTests.map((test, i) => (
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
                        {test.error || 'Test failed without additional error output.'}
                      </div>
                    )}
                  </div>
                ))
              )}
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
