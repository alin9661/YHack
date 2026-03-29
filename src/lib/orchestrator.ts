import type {
  AnthropicMessage,
  AnthropicResponse,
  ContentBlock,
  StreamEvent,
  ToolUseBlock,
} from "@/types";
import { callLLM } from "@/lib/lava-client";
import { getRegistry } from "@/lib/tool-registry";
import { dispatch } from "@/lib/dispatcher";
import { initMCPServers } from "@/lib/mcp-manager";

const MAX_ITERATIONS = 10;
let mcpInitialized = false;

const SYSTEM_PROMPT = `You are MarketMind, an AI prediction market analyst. You help users understand prediction markets, analyze data from Polymarket, and provide actionable insights.

Available capabilities:
- Search Polymarket for prediction markets by topic
- Get detailed market data (prices, volumes, outcomes)
- Generate prediction signals with confidence scores
- Store and retrieve past analyses

When analyzing markets:
1. Search for relevant markets first
2. Get detailed data on the most interesting ones
3. Generate signals when the user wants actionable analysis
4. Store important analyses for future reference

Present data clearly with market names, probabilities, volumes, and your reasoning. Be concise but thorough.`;

/**
 * The core agentic loop. Sends messages to Claude via Lava, handles tool calls,
 * and yields stream events for the frontend.
 *
 * This is the heart of the orchestration layer described in spec §6.
 */
export async function* agenticLoop(
  messages: AnthropicMessage[]
): AsyncGenerator<StreamEvent> {
  // Initialize MCP servers on first call
  if (!mcpInitialized) {
    try {
      await initMCPServers();
      mcpInitialized = true;
    } catch (error) {
      console.error("[orchestrator] MCP init failed:", error);
      // Continue without MCP — Lava and local tools still work
    }
  }

  const registry = getRegistry();
  const tools = registry.buildManifest();
  const conversationHistory: AnthropicMessage[] = [...messages];

  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`[orchestrator] iteration ${iteration}/${MAX_ITERATIONS}`);

    // Call LLM via Lava forward
    let response: AnthropicResponse;
    try {
      response = await callLLM(conversationHistory, tools, {
        system: SYSTEM_PROMPT,
      });
    } catch (error) {
      yield {
        type: "error",
        message: error instanceof Error ? error.message : "LLM call failed",
      };
      yield { type: "done" };
      return;
    }

    console.log(
      `[orchestrator] stop_reason=${response.stop_reason} blocks=${response.content.length} usage=${JSON.stringify(response.usage)}`
    );

    // Extract text blocks and yield them
    for (const block of response.content) {
      if (block.type === "text" && block.text) {
        yield { type: "text", content: block.text };
      }
    }

    // If no tool calls, we're done
    if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
      yield { type: "done" };
      return;
    }

    // Extract tool_use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      yield { type: "done" };
      return;
    }

    // Yield tool call events for the frontend
    for (const block of toolUseBlocks) {
      yield {
        type: "tool_call",
        name: block.name,
        input: block.input,
      };
    }

    // Dispatch all tool calls in parallel (spec §6.1 design decision)
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const entry = registry.get(block.name);
        if (!entry) {
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify({
              error: `Unknown tool: ${block.name}`,
            }),
          };
        }

        try {
          const result = await dispatch(entry, block.input);

          // Truncate large results to save tokens (spec §8.2)
          // Truncate the object structurally to keep valid JSON
          const truncated = truncateResult(result, 4000);

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(truncated),
          };
        } catch (error) {
          console.error(`[orchestrator] tool error (${block.name}):`, error);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify({
              error:
                error instanceof Error ? error.message : "Tool execution failed",
            }),
            is_error: true,
          };
        }
      })
    );

    // Yield tool results to the frontend
    for (let i = 0; i < toolUseBlocks.length; i++) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(toolResults[i].content);
      } catch {
        parsed = { error: "Failed to parse tool result" };
      }
      yield {
        type: "tool_result",
        name: toolUseBlocks[i].name,
        result: parsed,
      };
    }

    // Append assistant message (with tool_use blocks) to conversation
    conversationHistory.push({
      role: "assistant",
      content: response.content,
    });

    // Append tool results to conversation (Anthropic format)
    conversationHistory.push({
      role: "user",
      content: toolResults as unknown as ContentBlock[],
    });
  }

  // Hit max iterations
  yield {
    type: "error",
    message: `Reached maximum iterations (${MAX_ITERATIONS}). The analysis may be incomplete.`,
  };
  yield { type: "done" };
}

/**
 * Structurally truncate a tool result to fit within a character budget.
 * Unlike string slicing, this preserves valid JSON by trimming arrays
 * and long string values rather than cutting the serialized output.
 */
function truncateResult(data: unknown, maxChars: number): unknown {
  const str = JSON.stringify(data);
  if (str.length <= maxChars) return data;

  // For arrays, progressively remove items from the end
  if (Array.isArray(data)) {
    const trimmed = [...data];
    while (trimmed.length > 1 && JSON.stringify(trimmed).length > maxChars) {
      trimmed.pop();
    }
    return trimmed;
  }

  // For objects, truncate long string values and trim array fields
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.length > 500) {
        result[key] = value.slice(0, 500) + "...";
      } else if (Array.isArray(value)) {
        result[key] = truncateResult(value, Math.floor(maxChars / 2));
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // Primitives pass through
  return data;
}
