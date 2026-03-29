"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, AnthropicMessage, StreamEvent } from "@/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { OracleSymbol } from "@/components/OracleSymbol";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const exchangeCount = messages.filter((m) => m.role === "assistant").length;

  const handleSubmit = useCallback(
    async (text: string) => {
      if (isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);
      setIsLoading(true);

      try {
        const anthropicMessages: AnthropicMessage[] = [
          ...messages,
          userMessage,
        ].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: anthropicMessages }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event: StreamEvent = JSON.parse(jsonStr);

              switch (event.type) {
                case "text":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: msg.content + event.content }
                        : msg
                    )
                  );
                  break;

                case "tool_call":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            toolCalls: [
                              ...(msg.toolCalls || []),
                              {
                                name: event.name,
                                input: event.input,
                                status: "pending" as const,
                              },
                            ],
                          }
                        : msg
                    )
                  );
                  break;

                case "tool_result":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            toolCalls: (msg.toolCalls || []).map((tc) =>
                              tc.name === event.name &&
                              tc.status === "pending"
                                ? {
                                    ...tc,
                                    result: event.result,
                                    status: "complete" as const,
                                  }
                                : tc
                            ),
                          }
                        : msg
                    )
                  );
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            content:
                              msg.content +
                              `\n\n⚠️ Error: ${event.message}`,
                          }
                        : msg
                    )
                  );
                  break;
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  return (
    <main className="flex flex-col h-screen bg-oracle-void">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-oracle-surface-light/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-oracle-text-dim hover:text-oracle-text transition-colors duration-300 text-lg"
            aria-label="Back to landing"
          >
            &larr;
          </button>
          <div className="flex items-center gap-2.5">
            <OracleSymbol size={22} className="text-oracle-gold" />
            <span className="font-display text-sm tracking-widest text-oracle-text-dim">
              POLYLAVA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim">
              SESSION ACTIVE
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim tabular-nums">
            {formatTime(sessionSeconds)}
          </span>
          <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim">
            {exchangeCount} {exchangeCount === 1 ? "exchange" : "exchanges"}
          </span>
        </div>
      </header>

      {/* Split view: Chat (55%) + Dashboard (45%) */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[55%] min-w-0">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
        <div className="w-[45%] min-w-0">
          <DashboardPanel messages={messages} />
        </div>
      </div>
    </main>
  );
}
