/**
 * Qur'an Chat App — AI-powered conversational interface for Qur'anic knowledge.
 *
 * Layout:
 *  - BackgroundShapes fills the viewport behind everything (z -10)
 *  - Sidebar floats over the left edge (z 40), showing conversations
 *  - Main pane shows chat messages with an input composer at the bottom
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
    "As-salamu alaikum! I'm your Qur'an Chat Assistant. Ask me anything about the Qur'an and I'll provide clear, respectful answers grounded in Islamic scholarship.",
  timestamp: new Date().toISOString(),
};

const PROMPT_CHIPS = [
  { icon: BookOpen, label: 'Surah Al-Fatiha', text: 'Tell me about Surah Al-Fatiha.' },
  { icon: Heart, label: 'On Mercy', text: 'What does the Qur\'an say about mercy?' },
  { icon: Lightbulb, label: 'On Wisdom', text: 'What verses discuss wisdom in the Qur\'an?' },
  { icon: MessageCircle, label: 'Ask Anything', text: 'Start your question...' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

        // Load conversations
        const convs = await listConversations(currentUser.id);
        setConversations(convs || []);

        // Create initial conversation if none exists
        if (!convs || convs.length === 0) {
          const newConv = await createConversation(currentUser.id, 'Qur\'an Questions');
          setCurrentConversationId(newConv.id);
        } else {
          setCurrentConversationId(convs[0].id);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
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

      // Add user message immediately
      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsLoading(true);

      try {
        // Send to backend
        const result = await sendMessage(currentConversationId, text, user.id);

        // Add assistant response
        if (result.assistantMessage) {
          const assistantMsg = {
            role: 'assistant',
            content: result.assistantMessage.content,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMsg = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, user]
  );

  const handleChipClick = (text) => {
    if (text !== 'Ask Anything...') {
      handleSendMessage(text);
    } else {
      // Focus input for custom question
      document.querySelector('input[type="text"]')?.focus();
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
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <BackgroundShapes />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations.map((conv) => ({
          id: conv.id,
          preview: conv.title || 'Qur\'an Questions',
          created_at: conv.created_at,
          status: conv.status,
        }))}
        activeId={currentConversationId}
        loading={false}
        onOpenConversation={handleSelectConversation}
        onNewChat={handleNewConversation}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl h-full md:h-auto md:max-h-[80vh] flex flex-col bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
        >
          {/* Messages area */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-4 md:p-6 space-y-4',
              isWelcomeMode ? 'flex flex-col items-center justify-center' : ''
            )}
          >
            {isWelcomeMode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 max-w-md"
              >
                <div className="text-5xl mb-4">📖</div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Qur'an Chat
                </h1>
                <p className="text-lg text-white/70">
                  Ask me anything about the Qur'an
                </p>
                <div className="space-y-2">
                  {PROMPT_CHIPS.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <motion.button
                        key={chip.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChipClick(chip.text)}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                      >
                        <Icon size={18} />
                        <span>{chip.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    isUser={msg.role === 'user'}
                  />
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-white/60"
                  >
                    <LoaderIcon size={16} className="animate-spin" />
                    <span>Thinking...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input composer */}
          <div className="border-t border-white/10 bg-white/5 p-3 md:p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
                placeholder="Ask about the Qur'an..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-all"
              >
                <SendIcon size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
