'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Crumb {
  label: string;
  href?: string;
}

function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    repositories: 'Repositories',
    'code-search': 'Code Search',
    'ai-assistant': 'AI Assistant',
    dependencies: 'Dependencies',
    issues: 'Issues',
    testing: 'Testing',
    performance: 'Performance',
    settings: 'Settings',
  };

  const crumbs: Crumb[] = [{ label: 'SnippNXT', href: '/dashboard' }];
  let path = '';
  for (const seg of segments) {
    path += '/' + seg;
    crumbs.push({
      label: labels[seg] ?? seg.replace(/-/g, ' '),
      href: path,
    });
  }
  return crumbs;
}

interface TopBarProps {
  onMobileMenu: () => void;
}

export default function TopBar({ onMobileMenu }: TopBarProps) {
  const crumbs = useBreadcrumbs();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-mobile-menu" onClick={onMobileMenu} aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={i} className="breadcrumb-item">
              {i > 0 && <span className="breadcrumb-sep">/</span>}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="breadcrumb-link">{crumb.label}</Link>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <Link href="/code-search" className="topbar-search-btn" aria-label="Search code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Search code...</span>
          <kbd>⌘K</kbd>
        </Link>

        <button className="topbar-icon-btn" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="topbar-badge">3</span>
        </button>

        <Link href="/settings" className="topbar-avatar" aria-label="Profile settings">JD</Link>
      </div>
    </header>
  );
}
