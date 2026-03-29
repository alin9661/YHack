"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

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
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 mt-32">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg font-medium">Prediction Market Intelligence</p>
              <p className="text-sm mt-2 max-w-sm mx-auto">
                Ask me to search markets, analyze trends, or generate trading
                signals from Polymarket data.
              </p>
              <div className="mt-6 space-y-2 text-xs text-zinc-600">
                <p>&quot;What are the top AI prediction markets?&quot;</p>
                <p>&quot;Analyze the US election markets&quot;</p>
                <p>&quot;Generate a signal for crypto regulation&quot;</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <ChatInput onSubmit={onSubmit} disabled={isLoading} />
    </div>
  );
}
