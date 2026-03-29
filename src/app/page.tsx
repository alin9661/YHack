"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, AnthropicMessage, StreamEvent } from "@/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        // Build Anthropic messages from history (exclude the placeholder)
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
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950">
        <div>
          <h1 className="text-base font-semibold font-[family-name:var(--font-geist-sans)] text-zinc-100">
            Lava Gateway
          </h1>
          <p className="text-[11px] text-zinc-500">
            Prediction Market Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-zinc-500 font-mono">
            Claude via Lava
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
