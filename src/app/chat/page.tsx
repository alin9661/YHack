"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, AnthropicMessage, StreamEvent } from "@/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { OracleSymbol } from "@/components/OracleSymbol";
import { loadSession, saveSession, clearSession } from "@/lib/chat-cache";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const sessionSecondsRef = useRef(0);

  // Load cached session on mount
  useEffect(() => {
    const cached = loadSession();
    if (cached) {
      setMessages(cached.messages);
      setSessionSeconds(cached.sessionSeconds);
      sessionSecondsRef.current = cached.sessionSeconds;
    }
    setHydrated(true);
  }, []);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((s) => {
        sessionSecondsRef.current = s + 1;
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist after each completed interaction (not during streaming)
  useEffect(() => {
    if (!hydrated || isLoading) return;
    saveSession(messages, sessionSecondsRef.current);
  }, [messages, isLoading, hydrated]);

  // Save on unmount / navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession(messages, sessionSecondsRef.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [messages]);

  const handleNewSession = useCallback(() => {
    clearSession();
    setMessages([]);
    setSessionSeconds(0);
    sessionSecondsRef.current = 0;
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
    <main className="flex h-screen bg-oracle-void">
      {/* Sidebar */}
      <aside className="flex-shrink-0 w-16 flex flex-col items-center py-5 border-r border-oracle-surface-light/30 bg-oracle-deep/40">
        {/* Logo — links home */}
        <button
          onClick={() => router.push("/")}
          className="mb-8 hover:opacity-100 opacity-70 transition-opacity duration-300"
          aria-label="Home"
        >
          <OracleSymbol size={32} className="text-oracle-gold" />
        </button>

        {/* New session */}
        <button
          onClick={handleNewSession}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-oracle-surface-light/40 text-oracle-text-dim/50 hover:text-oracle-gold hover:border-oracle-gold-dim/40 transition-all duration-300 mb-6"
          aria-label="New session"
          title="New session"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Session stats */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[8px] tracking-wider text-oracle-text-dim/50 leading-none">
              LIVE
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-wider text-oracle-text-dim/60 tabular-nums">
            {formatTime(sessionSeconds)}
          </span>
          <span className="font-mono text-[9px] text-oracle-text-dim/40">
            {exchangeCount}
          </span>
        </div>
      </aside>

      {/* Chat panel — messages scroll, input sticks to bottom */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Dashboard — independently scrollable */}
      <div className="w-[400px] flex-shrink-0 min-w-0">
        <DashboardPanel messages={messages} />
      </div>
    </main>
  );
}
