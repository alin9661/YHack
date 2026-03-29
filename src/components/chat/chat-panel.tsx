"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { OracleSymbol } from "@/components/OracleSymbol";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

const suggestions = [
  { icon: "\u25C8", text: "What are the top AI prediction markets?" },
  { icon: "\u25C7", text: "Analyze the US election markets" },
  { icon: "\u25CB", text: "Generate a signal for crypto regulation" },
  { icon: "\u25B3", text: "Show recent analyses" },
];

export function ChatPanel({ messages, isLoading, onSubmit }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6">
              <div className="animate-float mb-8">
                <OracleSymbol size={80} className="text-oracle-gold opacity-60" />
              </div>
              <h2 className="font-display text-3xl font-light text-oracle-text mb-3">
                What shall we explore?
              </h2>
              <p className="text-oracle-text-dim text-sm mb-12">
                Search markets, generate signals, or analyze trends.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => onSubmit(s.text)}
                    className="text-left border border-oracle-surface-light/50 bg-oracle-deep/30 px-5 py-4 hover:bg-oracle-surface/40 hover:border-oracle-gold-dim/30 transition-all duration-400 group"
                  >
                    <span className="text-oracle-gold-dim/60 mr-2 text-sm group-hover:text-oracle-gold transition-colors duration-300">
                      {s.icon}
                    </span>
                    <span className="text-oracle-text-dim text-sm group-hover:text-oracle-text transition-colors duration-300">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatInput onSubmit={onSubmit} disabled={isLoading} />
    </div>
  );
}
