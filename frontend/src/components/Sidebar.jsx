/**
 * Collapsible floating chat-history sidebar.
 *
 * Frosted glass card, fixed to the left edge. Slides in/out via a chevron
 * toggle. Hidden by default on mobile. Doesn't take layout space — sits
 * over the chat content with a backdrop blur when open on mobile.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({
  open,
  onToggle,
  conversations,
  activeId,
  loading,
  onOpenConversation,
  onNewChat,
}) {
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar card */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className={cn(
              'fixed z-40 left-4 top-4 bottom-4 w-72',
              'backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08]',
              'rounded-2xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
              <button
                onClick={onNewChat}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg flex-1',
                  'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]',
                  'text-sm text-white/90 transition-colors'
                )}
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
              <button
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className={cn(
                  'p-2 rounded-lg',
                  'text-white/40 hover:text-white/90 hover:bg-white/[0.05]',
                  'transition-colors'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/40">
              History
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {loading && (
                <div className="text-sm text-white/40 px-3 py-2">Loading…</div>
              )}
              {!loading && conversations.length === 0 && (
                <div className="text-sm text-white/40 px-3 py-2">
                  No conversations yet. Start one!
                </div>
              )}
              {conversations.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenConversation(c.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      'text-white/80 hover:bg-white/[0.05]',
                      isActive && 'bg-white/[0.07] text-white'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-white/40 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1">
                            {c.preview || 'Untitled conversation'}
                          </span>
                          {c.status === 'ended' && (
                            <span className="text-[9px] uppercase text-white/40 border border-white/15 rounded px-1 py-px">
                              ended
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/30 mt-0.5">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString()
                            : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/[0.06] text-[11px] text-white/40">
              Chat history managed with Supabase
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating open-sidebar button when collapsed */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="open-sidebar"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={onToggle}
            aria-label="Open sidebar"
            className={cn(
              'fixed z-40 left-4 top-4',
              'p-2 rounded-lg',
              'backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08]',
              'text-white/60 hover:text-white/90 hover:bg-white/[0.08]',
              'transition-colors'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
