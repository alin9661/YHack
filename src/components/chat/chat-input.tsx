"use client";

import { useState, useRef } from "react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSubmit(input.trim());
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex-shrink-0 border-t border-oracle-surface-light/30 px-6 py-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Speak your question into the void..."
              rows={1}
              className="w-full bg-oracle-deep/60 border border-oracle-surface-light/40 px-5 py-3.5 text-sm text-oracle-text placeholder:text-oracle-text-dim/40 resize-none focus:outline-none focus:border-oracle-gold-dim/60 transition-colors duration-300 disabled:opacity-40"
              style={{ maxHeight: 160 }}
              disabled={disabled}
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              input.trim() && !disabled
                ? "bg-oracle-gold text-oracle-void"
                : "bg-oracle-surface text-oracle-text-dim/30"
            }`}
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="font-mono text-[9px] text-oracle-text-dim/30 tracking-wider">
            shift + enter for new line
          </span>
          <span className="font-mono text-[9px] text-oracle-text-dim/30 tracking-wider">
            polylava v1.0
          </span>
        </div>
      </form>
    </div>
  );
}
