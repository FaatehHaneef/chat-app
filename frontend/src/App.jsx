/**
 * Qur'an Chat App — AI-powered conversational interface for Qur'anic knowledge.
 *
 * Layout:
 *  - BackgroundShapes fills the viewport behind everything (z 0)
 *  - Sidebar floats over the left edge (z 40), showing conversations
 *  - Welcome mode: centered hero with a large composer and suggestion chips
 *  - Chat mode: scrolling message list with the composer docked at the bottom
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Lightbulb,
  Heart,
  Loader as LoaderIcon,
  Send as SendIcon,
  MessageCircle,
} from 'lucide-react';
import BackgroundShapes from './components/BackgroundShapes';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import {
  sendMessage,
  signInAnonymous,
  getCurrentUser,
  createConversation,
  loadConversationMessages,
  listConversations,
} from './api';
import { cn } from './lib/utils';
import './App.css';

const GREETING = {
  role: 'assistant',
  content:
    "As-salamu alaikum. How may I help you with the Qur'an today? Ask me about a surah, a verse, or a theme, and I'll answer with clear, cited references.",
  timestamp: new Date().toISOString(),
};

const PROMPT_CHIPS = [
  { icon: BookOpen, label: 'Surah Al-Fatiha', text: 'Tell me about Surah Al-Fatiha.' },
  { icon: Heart, label: 'On Mercy', text: "What does the Qur'an say about mercy?" },
  { icon: Lightbulb, label: 'On Wisdom', text: "What verses discuss wisdom in the Qur'an?" },
  { icon: MessageCircle, label: 'Ask Anything', text: '' },
];

/**
 * The shared composer: an auto-growing textarea with an Enter-to-send hint and
 * a labelled Send button. Used centered in welcome mode and docked in chat mode.
 */
function Composer({ value, onChange, onSend, isLoading, autoFocus }) {
  const textareaRef = useRef(null);

  // Auto-grow the textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl focus-within:border-white/20 transition-colors">
      <textarea
        ref={textareaRef}
        rows={1}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Ask about the Qur'an..."
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] text-white placeholder-white/40 focus:outline-none"
      />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <span className="text-xs text-white/35 select-none">
          Press <kbd className="font-sans">Enter</kbd> to send ·{' '}
          <kbd className="font-sans">Shift+Enter</kbd> for a new line
        </span>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            'bg-white/[0.06] border border-white/[0.10] text-white/90',
            'hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <LoaderIcon size={16} className="animate-spin" />
          ) : (
            <SendIcon size={16} />
          )}
          Send
        </motion.button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initError, setInitError] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize user and conversations
  useEffect(() => {
    async function initializeApp() {
      try {
        let currentUser = await getCurrentUser();
        if (!currentUser) {
          currentUser = await signInAnonymous();
        }
        setUser(currentUser);

        const convs = await listConversations(currentUser.id);
        setConversations(convs || []);

        if (!convs || convs.length === 0) {
          const newConv = await createConversation(currentUser.id, "Qur'an Questions");
          setCurrentConversationId(newConv.id);
        } else {
          setCurrentConversationId(convs[0].id);
        }
        setInitError('');
      } catch (error) {
        console.error('Failed to initialize:', error);
        setInitError(
          error?.message ||
            'Could not connect. Check Supabase auth (anonymous sign-ins) and env vars.'
        );
      }
    }
    initializeApp();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !currentConversationId || !user) return;

      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsLoading(true);

      try {
        const result = await sendMessage(currentConversationId, text, user.id);
        if (result.assistantMessage) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result.assistantMessage.content,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, user]
  );

  const handleChipClick = (chip) => {
    if (chip.text) {
      handleSendMessage(chip.text);
    } else {
      // "Ask Anything" — just focus the composer.
      document.querySelector('textarea')?.focus();
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;
    try {
      const newConv = await createConversation(user.id, 'New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([GREETING]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = async (convId) => {
    setCurrentConversationId(convId);
    try {
      const msgs = await loadConversationMessages(convId);
      setMessages(msgs.length > 0 ? msgs : [GREETING]);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
    setSidebarOpen(false);
  };

  const isWelcomeMode = messages.length === 1 && messages[0] === GREETING;

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      <BackgroundShapes />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations.map((conv) => ({
          id: conv.id,
          preview: conv.title || "Qur'an Questions",
          created_at: conv.created_at,
          status: conv.status,
        }))}
        activeId={currentConversationId}
        loading={false}
        onOpenConversation={handleSelectConversation}
        onNewChat={handleNewConversation}
      />

      {/* App name pill, top-right */}
      <div className="absolute top-4 right-4 z-30">
        <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-sm text-white/70 backdrop-blur-md">
          Qur'an Chat
        </span>
      </div>

      <div className="relative z-10 flex h-full flex-col items-center">
        {initError && (
          <div className="mt-16 w-full max-w-2xl px-4">
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              {initError}
            </div>
          </div>
        )}

        {isWelcomeMode ? (
          /* ---------- Welcome mode: centered hero ---------- */
          <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full text-center"
            >
              <div className="mb-4 text-5xl">📖</div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Qur'an Chat
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70">
                {GREETING.content}
              </p>

              <Composer
                value={inputValue}
                onChange={setInputValue}
                onSend={() => handleSendMessage(inputValue)}
                isLoading={isLoading}
                autoFocus
              />

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {PROMPT_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <motion.button
                      key={chip.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleChipClick(chip)}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <Icon size={16} />
                      <span>{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ---------- Chat mode: message list + docked composer ---------- */
          <div className="flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
            <div className="flex-1 space-y-4 overflow-y-auto py-6">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} isUser={msg.role === 'user'} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-white/50"
                >
                  <LoaderIcon size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="pb-6 pt-2">
              <Composer
                value={inputValue}
                onChange={setInputValue}
                onSend={() => handleSendMessage(inputValue)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
