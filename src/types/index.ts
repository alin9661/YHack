// Tool Registry types (per spec §3.1)
export interface ToolRegistryEntry {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  provider: {
    type: "lava" | "mcp" | "http" | "local";
    lavaUrl?: string;
    lavaMethod?: string;
    mcpServer?: string;
    mcpTool?: string;
    httpUrl?: string;
    httpMethod?: string;
    httpHeaders?: Record<string, string>;
    handler?: (input: Record<string, unknown>) => Promise<unknown>;
  };
  rateLimit?: { rpm: number; burst: number };
  cacheTtlSeconds?: number;
  costTier?: "free" | "low" | "medium" | "high";
}

// Anthropic Messages API types
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextBlock | ToolUseBlock;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ContentBlock[];
  model: string;
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
  usage: { input_tokens: number; output_tokens: number };
}

// Streaming events from orchestrator to frontend
export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "error"; message: string }
  | { type: "done" };

// Chat message for frontend state
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: {
    name: string;
    input: Record<string, unknown>;
    result?: unknown;
    status: "pending" | "complete" | "error";
  }[];
}
