/**
 * Company Research Assistant — multi-agent research chat UI.
 *
 * Layout:
 *  - BackgroundShapes fills the viewport behind everything (z -10)
 *  - Sidebar floats over the left edge (z 40), collapsible
 *  - Main pane is a vertically centered frosted card. In "welcome" mode
 *    (no messages yet) it shows the big title + composer + research-prompt
 *    chips. In "chat" mode the messages scroll above the composer, the
 *    chips disappear, and an End chat button appears in the header.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Apple,
  Car,
  Cpu,
  Loader as LoaderIcon,
  Send as SendIcon,
  TrendingUp,
} from 'lucide-react';
import BackgroundShapes from './components/BackgroundShapes';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import {
  submitQuery,
  submitClarification,
  listConversations,
  loadConversation,
  endConversation,
} from './api';
import { cn } from './lib/utils';
import './App.css';

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm your Company Research Assistant. Ask me about any company and I'll research it for you.",
  timestamp: new Date().toISOString(),
};

const PROMPT_CHIPS = [
  { icon: Apple, label: 'Try Apple', text: 'Tell me about Apple Inc.' },
  { icon: Car, label: 'Try Tesla', text: "What's the latest on Tesla?" },
  { icon: Cpu, label: 'Try Nvidia', text: 'Research Nvidia.' },
  { icon: TrendingUp, label: 'Recent IPOs', text: 'Tell me about recent IPOs.' },
];

export default function App() {
  // sidebar
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // chat
  const [conversationId, setConversationId] = useState(null);
  const [chatStatus, setChatStatus] = useState('active');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationPrompt, setClarificationPrompt] = useState('');

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasMessages = messages.length > 0;

  // Auto-resize textarea on input
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = '60px';
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
  }, [input]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await listConversations();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const startNewChat = () => {
    setConversationId(null);
    setChatStatus('active');
    setMessages([]);
    setNeedsClarification(false);
    setClarificationPrompt('');
    setInput('');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const openConversation = async (id) => {
    if (loading) return;
    try {
      setLoading(true);
      const data = await loadConversation(id);
      setConversationId(data.id);
      setChatStatus(data.chat_status || 'active');
      const loaded = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages(loaded.length ? loaded : [GREETING]);
      setNeedsClarification(false);
      setClarificationPrompt('');
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEndChat = async () => {
    if (!conversationId || chatStatus === 'ended') return;
    if (!window.confirm('End this chat? It will become read-only.')) return;
    try {
      await endConversation(conversationId);
      setChatStatus('ended');
      await refreshList();
    } catch (e) {
      console.error('Failed to end chat:', e);
    }
  };

  const sendCurrentInput = async () => {
    const text = input.trim();
    if (!text || loading || chatStatus === 'ended') return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = needsClarification
        ? await submitClarification(text, conversationId)
        : await submitQuery(text, conversationId);

      if (needsClarification) setNeedsClarification(false);
      if (result.conversation_id) setConversationId(result.conversation_id);

      if (result.status === 'clarification_needed') {
        setNeedsClarification(true);
        setClarificationPrompt(result.clarification_prompt);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.clarification_prompt,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      refreshList();
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Unable to process your request';
      if (error.status === 409) {
        errorMessage = 'This chat has ended and cannot be continued.';
        setChatStatus('ended');
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please try a different query.';
      } else if (error.status === 404) {
        errorMessage = 'Could not find information about that query.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, ${errorMessage}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendCurrentInput();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCurrentInput();
    }
  };

  const handleChipClick = (text) => {
    if (chatStatus === 'ended' || loading) return;
    setInput(text);
    textareaRef.current?.focus();
  };

  const inputDisabled = loading || chatStatus === 'ended';

  return (
    <>
      <BackgroundShapes />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={conversations}
        activeId={conversationId}
        loading={loadingList}
        onOpenConversation={openConversation}
        onNewChat={startNewChat}
      />

      {/* Top-right header pill + end-chat button */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-3">
        {conversationId && chatStatus === 'active' && (
          <button
            onClick={handleEndChat}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg',
              'backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]',
              'text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors'
            )}
          >
            End chat
          </button>
        )}
        <div
          className={cn(
            'px-3 py-1.5 rounded-full',
            'backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]',
            'text-xs text-white/60'
          )}
        >
          Company Research Assistant
        </div>
      </div>

      {/* Main content area.
          On desktop, when the sidebar is open we push everything right by the
          sidebar's width (18rem card + 1rem inset gap = ~19rem) so the chat
          centers in the *remaining* space instead of getting visually shoved
          off-center. Mobile keeps the sidebar as a true overlay. */}
      <main
        className={cn(
          'relative z-20 min-h-screen w-full',
          'flex items-center justify-center p-4 md:p-6',
          'transition-[padding] duration-300 ease-out',
          sidebarOpen && 'md:pl-[19rem]'
        )}
      >
        <div className="w-full max-w-3xl mx-auto relative">
          {/* Welcome state */}
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-10"
            >
              <div className="text-center space-y-3">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1"
                >
                  How can I help today?
                </motion.h1>
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
                <motion.p
                  className="text-sm text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ask about any company. News, financials, recent developments.
                </motion.p>
              </div>

              <Composer
                value={input}
                setValue={setInput}
                textareaRef={textareaRef}
                onKeyDown={handleKeyDown}
                onSubmit={handleSubmit}
                disabled={inputDisabled}
                loading={loading}
                ended={chatStatus === 'ended'}
                needsClarification={needsClarification}
                clarificationPrompt={clarificationPrompt}
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                {PROMPT_CHIPS.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <motion.button
                      key={chip.label}
                      onClick={() => handleChipClick(chip.text)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        'bg-white/[0.02] hover:bg-white/[0.05]',
                        'border border-white/[0.05]',
                        'text-sm text-white/60 hover:text-white/90 transition-colors'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Chat state */}
          {hasMessages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'flex flex-col w-full',
                'h-[85vh] max-h-[900px]',
                'backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05]',
                'rounded-2xl shadow-2xl overflow-hidden'
              )}
            >
              {chatStatus === 'ended' && (
                <div className="px-5 py-2 border-b border-amber-500/20 bg-amber-500/[0.06] text-amber-200/90 text-xs">
                  This chat has ended and cannot be continued. Start a new chat
                  to ask something else.
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    message={msg}
                    isUser={msg.role === 'user'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-white/[0.05] p-3 md:p-4">
                <Composer
                  variant="inline"
                  value={input}
                  setValue={setInput}
                  textareaRef={textareaRef}
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSubmit}
                  disabled={inputDisabled}
                  loading={loading}
                  ended={chatStatus === 'ended'}
                  needsClarification={needsClarification}
                  clarificationPrompt={clarificationPrompt}
                />
              </div>
            </motion.div>
          )}

          {/* Status pill — always visible, centered to the chat container so
              it stays aligned even when the sidebar pushes everything right.
              Default state is "Ready"; flips to "Researching" with dots while
              a request is in flight. */}
          {hasMessages && (
            <div className="mt-4 flex justify-center">
              <motion.div
                initial={false}
                animate={{ scale: loading ? 1.02 : 1 }}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  'backdrop-blur-2xl border shadow-lg',
                  loading
                    ? 'bg-white/[0.06] border-white/[0.12]'
                    : 'bg-white/[0.03] border-white/[0.06]'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    loading ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'
                  )}
                />
                <span className="text-sm text-white/80">
                  {loading ? 'Researching' : 'Ready'}
                </span>
                {loading && <TypingDots />}
              </motion.div>
            </div>
          )}
        </div>
      </main>

    </>
  );
}

function Composer({
  variant = 'card',
  value,
  setValue,
  textareaRef,
  onKeyDown,
  onSubmit,
  disabled,
  loading,
  ended,
  needsClarification,
  clarificationPrompt,
}) {
  const isInline = variant === 'inline';

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        !isInline &&
          'relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl'
      )}
    >
      <div className={cn('p-3 md:p-4')}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            ended
              ? 'This chat has ended'
              : needsClarification
              ? 'Please provide clarification...'
              : 'Ask about any company...'
          }
          className={cn(
            'w-full resize-none bg-transparent border-none',
            'text-white/90 text-sm leading-relaxed',
            'placeholder:text-white/25',
            'focus:outline-none',
            'min-h-[60px] max-h-[200px]',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
          style={{ overflow: 'hidden' }}
        />
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 md:px-4 pb-3',
          !isInline && 'pt-3 border-t border-white/[0.05]'
        )}
      >
        <div className="text-[11px] text-white/30">
          {ended
            ? 'Read only'
            : needsClarification
            ? 'Awaiting clarification'
            : 'Press Enter to send · Shift+Enter for a new line'}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={disabled || !value.trim()}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            'flex items-center gap-2 transition-all',
            value.trim() && !disabled
              ? 'bg-white text-[#0A0A0B] shadow-lg shadow-white/10 hover:shadow-white/20'
              : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
          )}
        >
          {loading ? (
            <LoaderIcon className="w-4 h-4 animate-spin" />
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
          <span>Send</span>
        </motion.button>
      </div>
    </form>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut',
          }}
          style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)' }}
        />
      ))}
    </div>
  );
}
