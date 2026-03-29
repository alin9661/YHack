import type { ChatMessage } from "@/types";
import type { Components } from "react-markdown";
import { ToolActivity } from "./tool-activity";
import { OracleSymbol } from "@/components/OracleSymbol";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessage;
}

const markdownComponents: Components = {
  strong: ({ children }) => (
    <strong className="text-oracle-gold font-medium">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="font-display italic text-oracle-amber">{children}</em>
  ),
  code: ({ children, className }) => {
    // Block code (has language className)
    if (className) {
      return <code className={className}>{children}</code>;
    }
    // Inline code
    return (
      <code className="font-mono text-xs bg-oracle-surface px-1.5 py-0.5 rounded text-oracle-gold-dim">
        {children}
      </code>
    );
  },
  hr: () => (
    <hr
      className="border-0 h-px my-4"
      style={{
        background:
          "linear-gradient(to right, transparent, rgba(212,168,75,0.3), transparent)",
      }}
    />
  ),
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className="mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="font-mono text-[9px] tracking-wider text-oracle-text-dim">
                You
              </span>
            </div>
          ) : (
            <OracleSymbol size={24} className="text-oracle-gold opacity-70" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim uppercase">
              {isUser ? "You" : "PolyLava"}
            </span>
          </div>

          {isUser ? (
            <p className="text-oracle-text/80 text-sm whitespace-pre-wrap">
              {message.content}
            </p>
          ) : message.content ? (
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-headings:text-oracle-gold prose-p:text-oracle-text prose-ul:my-1 prose-li:my-0.5 prose-a:text-oracle-amber prose-strong:text-oracle-gold prose-code:text-oracle-gold-dim">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-oracle-gold thinking-dot animate-thinking-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-oracle-gold thinking-dot animate-thinking-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-oracle-gold thinking-dot animate-thinking-dot" />
              </div>
              <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim/50">
                contemplating
              </span>
            </div>
          )}
        </div>
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolActivity toolCalls={message.toolCalls} />
      )}
    </div>
  );
}
