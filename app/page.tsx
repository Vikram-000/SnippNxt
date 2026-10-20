import Link from 'next/link';

const features = [
  {
    number: "01",
    icon: "✳",
    title: "Cross-File Intelligence",
    description:
      "Understand relationships between functions, classes, and files across your entire codebase — not just the file you have open.",
    tag: "AI ASSISTED",
    href: "/ai-assistant",
  },
  {
    number: "02",
    icon: "⌕",
    title: "Semantic Code Search",
    description:
      "Ask questions in plain English. Find functions, patterns, and logic across repositories without knowing exact names.",
    tag: "SEMANTIC SEARCH",
    href: "/code-search",
  },
  {
    number: "03",
    icon: "⌘",
    title: "Dependency Mapping",
    description:
      "Visualize and explore how files and modules depend on each other. Spot circular dependencies and coupling issues.",
    tag: "CODE GRAPH",
    href: "/dependencies",
  },
  {
    number: "04",
    icon: "⌁",
    title: "Error Detection",
    description:
      "Identify potential issues, anti-patterns, and risky code before they grow into production bugs.",
    tag: "CODE QUALITY",
    href: "/issues",
  },
  {
    number: "05",
    icon: "✓",
    title: "Test Workspace",
    description:
      "Manage and review test suites, inspect failures, visualize code coverage, and monitor test history.",
    tag: "TESTING",
    href: "/testing",
  },
  {
    number: "06",
    icon: "▸",
    title: "Performance Analytics",
    description:
      "Track analysis latency, token usage, and retrieval efficiency. Compare strategies and optimize your AI queries.",
    tag: "ANALYTICS",
    href: "/performance",
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="navbar">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>Snipp<span className="brand-accent">NXT</span></span>
        </Link>

        <div className="nav-links">
          <Link href="#features">Features</Link>
          <Link href="#workflow">How it works</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>

        <Link className="nav-button" href="/dashboard">
          Open Workspace <span>↗</span>
        </Link>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            REPOSITORY-LEVEL CODE INTELLIGENCE
          </div>

          <h1>
            Understand your codebase.
            <br />
            <span className="gradient-text">Not just your code.</span>
          </h1>

          <p className="hero-description">
            SnippNXT gives you AI-powered insights across your entire repository — connecting files, tracing dependencies, surfacing issues, and answering questions about your code in plain English.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" href="/dashboard">
              Explore Workspace <span>→</span>
            </Link>
            <Link className="secondary-button" href="#features">
              Discover Features
            </Link>
          </div>

          <div className="hero-note">
            <span className="note-icon">✦</span>
            Built for developers. Designed for clarity.
          </div>
        </div>

        <div className="code-card">
          <div className="code-topbar">
            <div className="window-dots">
              <span /><span /><span />
            </div>
            <span className="file-label">snippnxt-core / analyzer.py</span>
            <span className="live-label">
              <span className="status-dot" /> AI READY
            </span>
          </div>

          <div className="code-content">
            <div className="code-line">
              <span className="line-number">01</span>
              <span><span className="code-purple">import</span> {"{"} analyze {"}"}</span>
            </div>
            <div className="code-line">
              <span className="line-number">02</span>
              <span><span className="code-purple">from</span> <span className="code-green">&quot;@snippnxt/core&quot;</span>;</span>
            </div>
            <div className="code-line empty-line">
              <span className="line-number">03</span>
            </div>
            <div className="code-line">
              <span className="line-number">04</span>
              <span><span className="code-blue">async function</span> <span className="code-yellow">understandRepo</span>() {"{"}</span>
            </div>
            <div className="code-line indent">
              <span className="line-number">05</span>
              <span><span className="code-purple">const</span> context = <span className="code-purple">await</span> analyze({"{"}</span>
            </div>
            <div className="code-line indent-more">
              <span className="line-number">06</span>
              <span>repository: <span className="code-green">&quot;your-project&quot;</span>,</span>
            </div>
            <div className="code-line indent-more">
              <span className="line-number">07</span>
              <span>includeDependencies: <span className="code-orange">true</span>,</span>
            </div>
            <div className="code-line indent-more">
              <span className="line-number">08</span>
              <span>smartRetrieval: <span className="code-orange">true</span>,</span>
            </div>
            <div className="code-line indent">
              <span className="line-number">09</span>
              <span>{"}"});</span>
            </div>
            <div className="code-line empty-line">
              <span className="line-number">10</span>
            </div>
            <div className="code-line indent">
              <span className="line-number">11</span>
              <span><span className="code-purple">return</span> context.<span className="code-blue">insights</span>;</span>
            </div>
            <div className="code-line">
              <span className="line-number">12</span>
              <span>{"}"}</span>
            </div>
          </div>

          <div className="insight-panel">
            <div className="insight-icon">✦</div>
            <div className="insight-copy">
              <strong>Repository insight generated</strong>
              <span>Dependencies mapped · Context optimized</span>
            </div>
            <span className="insight-check">✓</span>
          </div>

          <div className="floating-chip chip-top">✧ AI-powered insights</div>
          <div className="floating-chip chip-bottom">↗ Cross-file context</div>
        </div>
      </section>

      <section className="trust-strip">
        <span>LESS GUESSWORK.</span>
        <span className="strip-line" />
        <span>MORE CONTEXT.</span>
        <span className="strip-line" />
        <span>BETTER CODE.</span>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div className="eyebrow">BUILT TO THINK BEYOND FILES</div>
          <h2>
            Meet your new
            <br />
            <span className="gradient-text">coding advantage.</span>
          </h2>
          <p>
            Go beyond isolated snippets. Understand the bigger picture behind
            every function, file, and dependency.
          </p>
        </div>

        <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <span className="feature-tag">{feature.tag}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <Link className="feature-link" href={feature.href}>
                Explore feature <span>↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-copy">
          <div className="eyebrow">A CLEARER WAY TO CODE</div>
          <h2>
            From code chaos
            <br />
            to <span className="gradient-text">code clarity.</span>
          </h2>
          <p>
            SnippNXT connects the dots across your repository to help you
            spend less time searching and more time creating.
          </p>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-number">01</span>
            <div>
              <h3>Connect your repository</h3>
              <p>Add a Git URL or upload local files. SnippNXT indexes your code and builds a semantic understanding of its structure.</p>
            </div>
            <Link href="/repositories" className="step-symbol" style={{ textDecoration: 'none' }}>↗</Link>
          </div>
          <div className="workflow-step">
            <span className="step-number">02</span>
            <div>
              <h3>Explore and search</h3>
              <p>Use natural-language search or the IDE-style explorer to navigate your codebase and trace how files relate.</p>
            </div>
            <Link href="/code-search" className="step-symbol" style={{ textDecoration: 'none' }}>⌕</Link>
          </div>
          <div className="workflow-step">
            <span className="step-number">03</span>
            <div>
              <h3>Ask your AI assistant</h3>
              <p>Ask questions, request explanations, and get refactoring suggestions grounded in your actual repository context.</p>
            </div>
            <Link href="/ai-assistant" className="step-symbol" style={{ textDecoration: 'none' }}>✦</Link>
          </div>
          <div className="workflow-step">
            <span className="step-number">04</span>
            <div>
              <h3>Build with confidence</h3>
              <p>Use insights about dependencies, issues, and test coverage to make informed, high-quality code changes.</p>
            </div>
            <Link href="/dashboard" className="step-symbol" style={{ textDecoration: 'none' }}>⌘</Link>
          </div>
        </div>
      </section>

      <section className="closing-section" id="about">
        <div className="closing-glow" />
        <div className="eyebrow">THE NEXT STEP IN CODE INTELLIGENCE</div>
        <h2>
          Understand more.
          <br />
          <span className="gradient-text">Build what&apos;s next.</span>
        </h2>
        <p>Your code has a story. SnippNXT helps you read between the lines.</p>
        <Link className="primary-button" href="/dashboard">
          Explore the Workspace <span>→</span>
        </Link>
      </section>

      <footer className="footer">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>Snipp<span className="brand-accent">NXT</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#858198' }}>
          <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/repositories" style={{ color: 'inherit', textDecoration: 'none' }}>Repositories</Link>
          <Link href="/ai-assistant" style={{ color: 'inherit', textDecoration: 'none' }}>AI Assistant</Link>
          <Link href="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>Settings</Link>
        </div>
        <span>© 2026 SnippNXT</span>
      </footer>
    </main>
  );
}
