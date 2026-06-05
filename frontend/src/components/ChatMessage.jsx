/**
 * Chat bubble for the frosted dark theme.
 *
 * Assistant messages render through react-markdown so headings, lists, bold,
 * and inline code come out formatted instead of as raw `##`/`**`/`*`.
 * User messages render as plain text (they don't author markdown).
 *
 * Assistant messages may end with a sources footer formatted as:
 *   <main text>
 *   ---
 *   _Sourced from N web results, M news articles..._
 * That tail is stripped and rendered as a muted caption under the bubble.
 */

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

function splitFooter(content) {
  if (!content) return { body: '', footer: '' };
  const marker = '\n---\n';
  const idx = content.lastIndexOf(marker);
  if (idx === -1) return { body: content, footer: '' };
  const tail = content.slice(idx + marker.length).trim();
  if (tail.startsWith('_') && tail.endsWith('_')) {
    return {
      body: content.slice(0, idx).trimEnd(),
      footer: tail.slice(1, -1),
    };
  }
  return { body: content, footer: '' };
}

// Tailwind classes for each markdown element type, so the rendered output
// matches the frosted dark theme without leaning on a global prose stylesheet.
const markdownComponents = {
  h1: (props) => <h1 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-base font-semibold text-white mt-4 mb-2 first:mt-0" {...props} />,
  h3: (props) => <h3 className="text-sm font-semibold text-white/95 mt-3 mb-1.5 first:mt-0" {...props} />,
  h4: (props) => <h4 className="text-sm font-semibold text-white/90 mt-3 mb-1 first:mt-0" {...props} />,
  p: (props) => <p className="text-sm leading-relaxed text-white/85 my-2 first:mt-0 last:mb-0" {...props} />,
  ul: (props) => <ul className="list-disc list-outside pl-5 my-2 space-y-1 text-sm text-white/85" {...props} />,
  ol: (props) => <ol className="list-decimal list-outside pl-5 my-2 space-y-1 text-sm text-white/85" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-white" {...props} />,
  em: (props) => <em className="italic text-white/90" {...props} />,
  a: (props) => (
    <a
      className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: ({ inline, ...props }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[0.85em] font-mono text-white/95" {...props} />
    ) : (
      <code className="block px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs font-mono text-white/90 overflow-x-auto" {...props} />
    ),
  pre: (props) => <pre className="my-2" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-2 border-white/20 pl-3 my-2 text-white/70 italic" {...props} />
  ),
  hr: () => <hr className="border-white/10 my-3" />,
};

export default function ChatMessage({ message, isUser }) {
  const { body, footer } = splitFooter(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'flex flex-col max-w-[85%] md:max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-3 rounded-2xl border backdrop-blur-xl',
            isUser
              ? 'bg-white/[0.10] border-white/[0.15] text-white/95'
              : 'bg-white/[0.03] border-white/[0.06] text-white/85'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
          ) : (
            <div className="text-sm leading-relaxed">
              <ReactMarkdown components={markdownComponents}>{body}</ReactMarkdown>
            </div>
          )}
        </div>
        {message.timestamp && (
          <p className="text-[10px] text-white/30 mt-1 px-2">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {footer && (
          <p className="text-[11px] text-white/40 italic mt-0.5 px-2 max-w-full">
            {footer}
          </p>
        )}
      </div>
    </motion.div>
  );
}
