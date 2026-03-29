import type { ChatMessage } from "@/types";
import { ToolActivity } from "./tool-activity";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] rounded-xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-zinc-800/80 text-zinc-100 border border-zinc-700/50"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : message.content ? (
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 animate-pulse">Thinking...</p>
          )}
        </div>
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolActivity toolCalls={message.toolCalls} />
      )}
    </div>
  );
}
