import type {
  AnthropicMessage,
  AnthropicResponse,
  AnthropicTool,
} from "@/types";

const LAVA_SECRET_KEY = process.env.LAVA_SECRET_KEY!;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "claude-sonnet-4-20250514";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Call an LLM via Lava's forward endpoint.
 * Lava proxies the request to Anthropic and handles billing/logging.
 */
export async function callLLM(
  messages: AnthropicMessage[],
  tools?: AnthropicTool[],
  options?: { model?: string; maxTokens?: number; system?: string }
): Promise<AnthropicResponse> {
  const forwardUrl = `https://api.lava.so/v1/forward?u=${encodeURIComponent(ANTHROPIC_API_URL)}`;

  const body: Record<string, unknown> = {
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || 4096,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  if (options?.system) {
    body.system = options.system;
  }

  const response = await fetch(forwardUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LAVA_SECRET_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  // Log Lava request ID for debugging
  const lavaRequestId = response.headers.get("x-lava-request-id");
  if (lavaRequestId) {
    console.log(`[lava] request_id=${lavaRequestId}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Lava LLM call failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Call a data API through Lava's forward endpoint.
 * Used for Polymarket and other Lava-managed API services.
 */
export async function callLavaDataAPI(
  targetUrl: string,
  method: string = "GET",
  body?: unknown
): Promise<unknown> {
  const forwardUrl = `https://api.lava.so/v1/forward?u=${encodeURIComponent(targetUrl)}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LAVA_SECRET_KEY}`,
  };

  const options: RequestInit = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(forwardUrl, options);

  const lavaRequestId = response.headers.get("x-lava-request-id");
  if (lavaRequestId) {
    console.log(`[lava:data] request_id=${lavaRequestId} url=${targetUrl}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Lava data API call failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}
