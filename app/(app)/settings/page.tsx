'use client';

import { useState, useEffect } from 'react';

type Section = 'profile' | 'appearance' | 'workspace' | 'editor' | 'notifications' | 'privacy';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'editor', label: 'Editor' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Data' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

function SettingRow({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <h4>{title}</h4>
        {desc && <p>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function useLocalSetting<T>(key: string, defaultVal: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultVal;
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultVal; }
    catch { return defaultVal; }
  });
  const update = (v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  };
  return [val, update];
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const [saved, setSaved] = useState(false);

  // Profile
  const [name, setName] = useState('Jane Dev');
  const [email, setEmail] = useState('jane@example.com');

  // Appearance
  const [theme, setTheme] = useLocalSetting('sn-theme', 'dark');
  const [compactMode, setCompactMode] = useLocalSetting('sn-compact', false);
  const [accentColor, setAccentColor] = useLocalSetting('sn-accent', 'violet');

  // Workspace
  const [defaultRepo, setDefaultRepo] = useState('snippnxt-core');
  const [autoIndex, setAutoIndex] = useLocalSetting('sn-autoindex', true);

  // Editor
  const [fontSize, setFontSize] = useLocalSetting('sn-fontsize', 13);
  const [lineNumbers, setLineNumbers] = useLocalSetting('sn-linenums', true);
  const [wordWrap, setWordWrap] = useLocalSetting('sn-wordwrap', false);
  const [minimap, setMinimap] = useLocalSetting('sn-minimap', false);

  // Notifications
  const [issueAlerts, setIssueAlerts] = useLocalSetting('sn-issue-alerts', true);
  const [indexComplete, setIndexComplete] = useLocalSetting('sn-index-notif', true);
  const [testResults, setTestResults] = useLocalSetting('sn-test-notif', false);

  // Privacy
  const [analytics, setAnalytics] = useLocalSetting('sn-analytics', false);
  const [crashReports, setCrashReports] = useLocalSetting('sn-crashes', false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Preferences are saved locally in your browser.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-layout">
        {/* Nav */}
        <div className="settings-nav">
          {SECTIONS.map(s => (
            <button key={s.id}
              className={`settings-nav-item ${section === s.id ? 'settings-nav-item-active' : ''}`}
              onClick={() => setSection(s.id)}
            >{s.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {section === 'profile' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Display Name</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} type="email" />
                </div>
                <div>
                  <label className="form-label">Plan</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span className="badge badge-accent">Pro Plan</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlimited repositories, 5 workspace members</span>
                  </div>
                </div>
                <div className="demo-notice">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  Demo — profile changes are not saved to a server.
                </div>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>Appearance</div>
              <div className="card-subtitle" style={{ marginBottom: 20 }}>Saved to browser local storage.</div>

              <SettingRow title="Theme" desc="Choose a color theme for the interface.">
                <select className="select-field" value={theme} onChange={e => setTheme(e.target.value)}>
                  <option value="dark">Dark (Default)</option>
                  <option value="darker">Darker</option>
                  <option value="light" disabled>Light (Coming soon)</option>
                </select>
              </SettingRow>

              <SettingRow title="Compact Mode" desc="Reduce padding and spacing for a denser layout.">
                <Toggle checked={compactMode} onChange={setCompactMode} />
              </SettingRow>

              <SettingRow title="Accent Color" desc="Primary accent used for active states and highlights.">
                <select className="select-field" value={accentColor} onChange={e => setAccentColor(e.target.value)}>
                  <option value="violet">Electric Violet</option>
                  <option value="cyan">Cyan</option>
                  <option value="emerald">Emerald</option>
                  <option value="rose">Rose</option>
                </select>
              </SettingRow>
            </div>
          )}

          {section === 'workspace' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Workspace</div>
              <SettingRow title="Default Repository" desc="Repository opened by default in the explorer.">
                <select className="select-field" value={defaultRepo} onChange={e => setDefaultRepo(e.target.value)}>
                  <option value="snippnxt-core">snippnxt-core</option>
                  <option value="snippnxt-ui">snippnxt-ui</option>
                  <option value="auth-service">auth-service</option>
                </select>
              </SettingRow>
              <SettingRow title="Auto-index on connect" desc="Automatically start indexing when a repository is added.">
                <Toggle checked={autoIndex} onChange={setAutoIndex} />
              </SettingRow>
              <SettingRow title="Include dependencies in context" desc="When analyzing, include imported files in the context window.">
                <Toggle checked={true} onChange={() => {}} />
              </SettingRow>
            </div>
          )}

          {section === 'editor' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Editor Preferences</div>
              <SettingRow title="Font Size" desc="Code viewer font size in pixels.">
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setFontSize(Math.max(10, fontSize - 1))}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{fontSize}</span>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setFontSize(Math.min(18, fontSize + 1))}>+</button>
                </div>
              </SettingRow>
              <SettingRow title="Line Numbers" desc="Show line numbers in the code viewer.">
                <Toggle checked={lineNumbers} onChange={setLineNumbers} />
              </SettingRow>
              <SettingRow title="Word Wrap" desc="Wrap long lines in the code viewer.">
                <Toggle checked={wordWrap} onChange={setWordWrap} />
              </SettingRow>
              <SettingRow title="Minimap" desc="Show a minimap overview panel in the code viewer.">
                <Toggle checked={minimap} onChange={setMinimap} />
              </SettingRow>
            </div>
          )}

          {section === 'notifications' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Notifications</div>
              <SettingRow title="Issue Alerts" desc="Notify when new code quality issues are detected.">
                <Toggle checked={issueAlerts} onChange={setIssueAlerts} />
              </SettingRow>
              <SettingRow title="Index Complete" desc="Notify when repository indexing finishes.">
                <Toggle checked={indexComplete} onChange={setIndexComplete} />
              </SettingRow>
              <SettingRow title="Test Results" desc="Notify when a test run completes.">
                <Toggle checked={testResults} onChange={setTestResults} />
              </SettingRow>
            </div>
          )}

          {section === 'privacy' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>Privacy & Data</div>
              <div className="card-subtitle" style={{ marginBottom: 20 }}>No data is currently sent anywhere in this demo.</div>

              <SettingRow title="Usage Analytics" desc="Help improve SnippNXT by sending anonymous usage data.">
                <Toggle checked={analytics} onChange={setAnalytics} />
              </SettingRow>
              <SettingRow title="Crash Reports" desc="Automatically send crash reports to help fix bugs.">
                <Toggle checked={crashReports} onChange={setCrashReports} />
              </SettingRow>

              <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.15)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--error)', marginBottom: 8 }}>Danger Zone</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Delete all workspace data and repository indexes</div>
                  <button className="btn btn-danger btn-sm" disabled>Delete Data (Demo)</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
