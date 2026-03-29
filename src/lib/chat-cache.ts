import type { ChatMessage } from "@/types";

const STORAGE_KEY = "marketmind-session";

interface CachedSession {
  messages: ChatMessage[];
  sessionSeconds: number;
  savedAt: number; // epoch ms
}

export function loadSession(): { messages: ChatMessage[]; sessionSeconds: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const cached: CachedSession = JSON.parse(raw);

    // Expire sessions older than 24 hours
    if (Date.now() - cached.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Account for time elapsed since last save
    const elapsedSinceLastSave = Math.floor((Date.now() - cached.savedAt) / 1000);

    return {
      messages: cached.messages,
      sessionSeconds: cached.sessionSeconds + elapsedSinceLastSave,
    };
  } catch {
    return null;
  }
}

export function saveSession(messages: ChatMessage[], sessionSeconds: number): void {
  try {
    // Strip pending tool calls (they won't complete after reload)
    const cleaned = messages.map((msg) => ({
      ...msg,
      toolCalls: msg.toolCalls?.map((tc) =>
        tc.status === "pending" ? { ...tc, status: "error" as const } : tc
      ),
    }));

    const session: CachedSession = {
      messages: cleaned,
      sessionSeconds,
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
