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

const SYSTEM_PROMPT = `You are an AI prediction market analyst powered by Lava Gateway. You help users understand prediction markets, analyze data from Polymarket, and provide actionable insights.

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
          const resultStr = JSON.stringify(result);
          const truncated =
            resultStr.length > 4000
              ? resultStr.slice(0, 4000) + "...[truncated]"
              : resultStr;

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: truncated,
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
      yield {
        type: "tool_result",
        name: toolUseBlocks[i].name,
        result: JSON.parse(toolResults[i].content),
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
