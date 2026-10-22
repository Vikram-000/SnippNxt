'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getAIConversations, getProviderStatus, type AIConversationItem } from '@/app/actions/ai';
import { highlightLine } from '@/lib/syntaxHighlight';

type Role = 'user' | 'assistant';
interface Message {
  id: string;
  role: Role;
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: "Hello! I'm your SnippNXT Code Intelligence Assistant. I can help you understand architecture, debug performance and token issues, summarize repositories, and generate reusable snippets for your coursework.",
  },
];

const QUICK_ACTIONS = [
  { label: 'Explain a function', icon: '⊞', prompt: 'Explain the analyze() function in detail' },
  { label: 'Trace a bug', icon: '⌁', prompt: 'Why do tests fail with token count over budget?' },
  { label: 'Summarize repo', icon: '⬡', prompt: 'Give me a high-level architectural summary of snippnxt-core' },
  { label: 'Suggest refactor', icon: '⌕', prompt: 'How should I refactor _index_cache to avoid unbounded memory growth?' },
];

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="code-block" style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div className="code-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--surface-3)' }}>
        <span className="code-block-lang" style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase' }}>
          {lang || 'code'}
        </span>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 8px' }} onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="code-block-body" style={{ background: '#090B10', padding: '10px 14px', fontSize: 11, fontFamily: 'var(--font-geist-mono, monospace)', lineHeight: 1.6, overflowX: 'auto' }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 10 }}>
            <span style={{ width: 22, textAlign: 'right', color: 'var(--text-dim)', fontSize: 10, userSelect: 'none' }}>
              {idx + 1}
            </span>
            <span
              style={{ flex: 1, whiteSpace: 'pre' }}
              dangerouslySetInnerHTML={{ __html: highlightLine(line, lang) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderMessageContent(content: string) {
  // Regex to extract code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <div key={keyIndex++} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {content.slice(lastIndex, match.index)}
        </div>
      );
    }
    const lang = match[1] || 'typescript';
    const code = match[2];
    parts.push(<CodeBlock key={keyIndex++} code={code} lang={lang} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <div key={keyIndex++} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {content.slice(lastIndex)}
      </div>
    );
  }

  return parts;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`ai-message ${isUser ? 'ai-message-user' : ''}`}>
      <div
        className="ai-message-avatar"
        style={{
          background: isUser ? 'linear-gradient(135deg, var(--accent), var(--cyan))' : 'var(--surface-3)',
          border: '1px solid var(--border)',
          color: isUser ? 'white' : 'var(--accent-light)',
        }}
      >
        {isUser ? 'JD' : '✦'}
      </div>
      <div className={`ai-bubble ${isUser ? 'ai-bubble-user' : 'ai-bubble-assistant'}`}>
        {renderMessageContent(msg.content)}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [providerInfo, setProviderInfo] = useState({ provider: 'Local Engine', modelName: 'offline' });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [activeConv, setActiveConv] = useState('new');
  const [selectedRepo, setSelectedRepo] = useState('snippnxt-core');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    getAIConversations().then(setConversations).catch(console.error);
    getProviderStatus().then(setProviderInfo).catch(console.error);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userText = input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const assistantId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = { id: assistantId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput('');
    setStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          repositoryId: selectedRepo,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start chat stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }
      }
    } catch (err) {
      console.error('Chat stream failed:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Error communicating with AI assistant. Please check connection and try again.' }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    setMessages([INITIAL_MESSAGES[0]]);
    setActiveConv('new');
  };

  return (
    <div>
      <div className="page-header row-between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">
            Natural language code intelligence and codebase assistance ·{' '}
            <span className="badge badge-accent">
              {providerInfo.provider} ({providerInfo.modelName})
            </span>
          </p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <select className="select-field" value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
            <option value="snippnxt-core">snippnxt-core</option>
            <option value="snippnxt-ui">snippnxt-ui</option>
            <option value="auth-service">auth-service</option>
            <option value="vector-store">vector-store</option>
          </select>
        </div>
      </div>

      <div className="ai-layout">
        {/* Conversations sidebar */}
        <div className="ai-sidebar">
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 11 }}
              onClick={startNewConversation}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Conversation
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-dim)', padding: '4px 8px 8px' }}>
              RECENT CONVERSATIONS
            </div>
            {conversations.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '6px 8px' }}>
                No past conversations.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`sidebar-item ${activeConv === conv.id ? 'sidebar-item-active' : ''}`}
                  style={{
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'block',
                    padding: '8px 10px',
                    borderRadius: 6,
                    marginBottom: 2,
                  }}
                  onClick={() => {
                    setActiveConv(conv.id);
                    setMessages([
                      INITIAL_MESSAGES[0],
                      { id: `c-${conv.id}-q`, role: 'user', content: conv.title },
                      { id: `c-${conv.id}-a`, role: 'assistant', content: conv.lastMessage || 'Conversation loaded.' },
                    ]);
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: activeConv === conv.id ? 'var(--accent-light)' : 'var(--text)',
                      marginBottom: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.time}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div style={{ padding: '8px 8px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-dim)', padding: '4px 8px 8px' }}>
              QUICK PROMPTS
            </div>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="sidebar-item"
                style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => {
                  setInput(action.prompt);
                }}
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
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Repository:</span>
            <span className="badge badge-accent">{selectedRepo}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>· Live Code Context</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent-light)' }}>
              ✦ Streaming Enabled
            </span>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <div className="ai-message">
                <div className="ai-message-avatar" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--accent-light)' }}>
                  ✦
                </div>
                <div className="ai-bubble ai-bubble-assistant">
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent-light)',
                          animation: `bounce 1s ease ${i * 0.15}s infinite`,
                          display: 'inline-block',
                        }}
                      />
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
                placeholder="Ask about your code, debug issues, or request reusable snippets... (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                className="btn btn-primary"
                style={{ height: 40, flexShrink: 0 }}
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
