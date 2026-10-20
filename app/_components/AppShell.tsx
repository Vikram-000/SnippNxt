'use client';

import { useState, Suspense } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'shell-collapsed' : ''} ${mobileOpen ? 'shell-mobile-open' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Suspense fallback={<aside className="sidebar" />}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </Suspense>

      <div className="shell-main">
        <Suspense fallback={<header className="topbar" />}>
          <TopBar onMobileMenu={() => setMobileOpen(true)} />
        </Suspense>
        <main className="shell-content">
          {children}
        </main>
      </div>
    </div>
  );
}
