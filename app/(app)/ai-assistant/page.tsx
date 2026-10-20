'use client';

import { useState, useRef, useEffect } from 'react';
import { mockAIConversations } from '../../_lib/mockData';
import Link from 'next/link';

type Role = 'user' | 'assistant';
interface Message {
  id: string;
  role: Role;
  content: string;
  code?: string;
  codeLang?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: 'Hello! I\'m your SnippNXT AI assistant. I can help you understand code, trace bugs, summarize repositories, and suggest refactors.\n\n**Note:** This is a demo. Responses are pre-written examples — connect a real AI backend to enable live assistance.',
  },
  {
    id: 'm2',
    role: 'user',
    content: 'Can you explain what the RepositoryAnalyzer class does?',
  },
  {
    id: 'm3',
    role: 'assistant',
    content: '**`RepositoryAnalyzer`** (in `src/core/analyzer.py`) is the central orchestration class for SnippNXT\'s analysis pipeline. Here\'s what it does:\n\n1. **Configuration** — accepts an `AnalysisConfig` with repository name, dependency settings, and token budget\n2. **Index Management** — builds a semantic index of repository files on first use, then caches it\n3. **Query Analysis** — retrieves relevant code snippets for a natural-language query via `SmartRetriever`\n4. **Insight Generation** — detects patterns like circular dependencies and complexity hotspots\n\nThe cached index (`_index_cache`) means repeated queries to the same repo are fast — but the cache is never evicted, which is flagged as a known issue.',
    code: `class RepositoryAnalyzer:
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.embedder = EmbeddingModel()
        self.retriever = SmartRetriever(
            max_tokens=config.max_context_tokens
        )
        self._index_cache: dict = {}  # ⚠ Unbounded growth`,
    codeLang: 'python',
  },
];

const QUICK_ACTIONS = [
  { label: 'Explain a function', icon: '⊞', prompt: 'Explain the analyze() function in detail' },
  { label: 'Trace a bug', icon: '⌁', prompt: 'Why do tests fail with token count over budget?' },
  { label: 'Summarize repo', icon: '⬡', prompt: 'Give me a high-level summary of snippnxt-core' },
  { label: 'Suggest refactor', icon: '⌕', prompt: 'How should I refactor _index_cache to avoid unbounded growth?' },
];

const DEMO_RESPONSES: Record<string, Message> = {
  default: {
    id: '',
    role: 'assistant',
    content: 'That\'s a great question about your codebase! Based on the repository context, here\'s what I can tell you:\n\nThe snippnxt-core repository follows a clean layered architecture with clear separation between the embedding layer, retrieval layer, and API layer. The main challenge is the balance between retrieval quality and token budget — a core research goal of SnippNXT.\n\n**Demo note:** In production, this response would be grounded in your actual repository files.',
  },
  bug: {
    id: '',
    role: 'assistant',
    content: 'Looking at the test failure `AssertionError: Token count 8421 exceeds budget 8000`, the issue is in `SmartRetriever._fit_to_budget()`.\n\nThe token estimator uses `len(text.split()) * 1.3` which is inaccurate — real tokenizers split differently. The fix is to either:\n1. Use a real tokenizer (e.g., `tiktoken`) for accurate counts\n2. Add a safety margin (e.g., multiply budget by 0.95)\n\n**Recommended fix:**',
    code: `# In retrieval.py
SAFETY_MARGIN = 0.95

def _fit_to_budget(self, candidates):
    budget = int(self.max_tokens * SAFETY_MARGIN)
    selected, total = [], 0
    for c in candidates:
        tokens = int(self._token_estimator(c.get("content", "")))
        if total + tokens > budget:
            break
        selected.append(c)
        total += tokens
    return selected`,
    codeLang: 'python',
  },
};

function CodeBlock({ code, lang, onCopy }: { code: string; lang: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };
  return (
    <div className="code-block" style={{ marginTop: 12 }}>
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="code-block-body" style={{ fontSize: 11 }}>{code}</div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`ai-message ${isUser ? 'ai-message-user' : ''}`}>
      <div className="ai-message-avatar" style={{ background: isUser ? 'linear-gradient(135deg, var(--accent), var(--cyan))' : 'var(--surface-3)', border: '1px solid var(--border)', color: isUser ? 'white' : 'var(--accent-light)' }}>
        {isUser ? 'JD' : '✦'}
      </div>
      <div className={`ai-bubble ${isUser ? 'ai-bubble-user' : 'ai-bubble-assistant'}`}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        {msg.code && <CodeBlock code={msg.code} lang={msg.codeLang ?? 'code'} onCopy={() => {}} />}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [activeConv, setActiveConv] = useState('conv-1');
  const [selectedRepo, setSelectedRepo] = useState('snippnxt-core');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!input.trim() || typing) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const lowerInput = input.toLowerCase();
    const response: Message = {
      ...(lowerInput.includes('bug') || lowerInput.includes('fail') || lowerInput.includes('token')
        ? DEMO_RESPONSES.bug
        : DEMO_RESPONSES.default),
      id: (Date.now() + 1).toString(),
    };

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, response]);
    }, 1400);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Ask questions about your code · <span className="badge badge-warning">Demo mode</span></p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <select className="select-field" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
            <option value="snippnxt-core">snippnxt-core</option>
            <option value="snippnxt-ui">snippnxt-ui</option>
            <option value="auth-service">auth-service</option>
          </select>
        </div>
      </div>

      <div className="ai-layout">
        {/* Conversations sidebar */}
        <div className="ai-sidebar">
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
            <button className="btn btn-primary" style={{ width: '100%', fontSize: 11 }}
              onClick={() => { setMessages([INITIAL_MESSAGES[0]]); setActiveConv('new'); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Conversation
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-dim)', padding: '4px 8px 8px' }}>RECENT</div>
            {mockAIConversations.map(conv => (
              <button key={conv.id}
                className={`sidebar-item ${activeConv === conv.id ? 'sidebar-item-active' : ''}`}
                style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block', padding: '8px 10px', borderRadius: 6, marginBottom: 2 }}
                onClick={() => setActiveConv(conv.id)}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: activeConv === conv.id ? 'var(--accent-light)' : 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.time}</div>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ padding: '8px 8px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-dim)', padding: '4px 8px 8px' }}>QUICK ACTIONS</div>
            {QUICK_ACTIONS.map(action => (
              <button key={action.label}
                className="sidebar-item"
                style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => { setInput(action.prompt); }}
              >
                <span style={{ fontSize: 13 }}>{action.icon}</span>
                <span style={{ fontSize: 11 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="ai-main">
          {/* Context bar */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Context:</span>
            <span className="badge badge-accent">{selectedRepo}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>· All files · 142 indexed</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)' }}>Demo — responses are simulated</span>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {typing && (
              <div className="ai-message">
                <div className="ai-message-avatar" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--accent-light)' }}>✦</div>
                <div className="ai-bubble ai-bubble-assistant">
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-light)', animation: `bounce 1s ease ${i * 0.15}s infinite`, display: 'inline-block' }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="ai-composer">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                className="ai-textarea"
                rows={2}
                placeholder="Ask about your code... (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="btn btn-primary" style={{ height: 40, flexShrink: 0 }} onClick={sendMessage} disabled={typing || !input.trim()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
