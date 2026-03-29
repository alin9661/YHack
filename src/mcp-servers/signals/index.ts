#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const LAVA_SECRET_KEY = process.env.LAVA_SECRET_KEY!;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "claude-sonnet-4-20250514";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Inner LLM call — the signals MCP server calls Claude (via Lava) with a
 * specialized analysis prompt. This is separate from the outer orchestrator's
 * LLM calls, allowing independent prompt tuning for signal quality.
 */
async function callLLMForSignal(prompt: string): Promise<string> {
  const forwardUrl = `https://api.lava.so/v1/forward?u=${encodeURIComponent(ANTHROPIC_API_URL)}`;

  const response = await fetch(forwardUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LAVA_SECRET_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      system: `You are a quantitative prediction market analyst. You analyze market data and generate structured trading signals. Always respond with valid JSON matching this schema:
{
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "factors": ["<factor1>", "<factor2>", "<factor3>"]
}

Base your analysis on:
- Current price vs. fair value assessment
- Market liquidity and volume patterns
- Time to resolution
- Information asymmetry indicators
- Historical calibration of similar markets`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Signal LLM call failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content
    ?.filter((b: { type: string }) => b.type === "text")
    ?.map((b: { text: string }) => b.text)
    ?.join("");

  return text || "";
}

// Create MCP Server
const server = new McpServer({
  name: "prediction-signals",
  version: "1.0.0",
});

// Register the generate_signal tool
server.tool(
  "generate_signal",
  "Generate a prediction signal for a market with direction, confidence, and reasoning",
  {
    market_id: z.string().describe("Market identifier or slug"),
    market_title: z.string().describe("Market question/title"),
    current_price: z.number().describe("Current market price (0-1 probability)"),
    outcomes: z
      .array(
        z.object({
          name: z.string(),
          price: z.number(),
        })
      )
      .optional()
      .describe("Market outcomes with prices"),
  },
  async ({ market_id, market_title, current_price, outcomes }) => {
    const outcomesStr = outcomes
      ? outcomes.map((o) => `${o.name}: ${(o.price * 100).toFixed(1)}%`).join(", ")
      : `Yes: ${(current_price * 100).toFixed(1)}%, No: ${((1 - current_price) * 100).toFixed(1)}%`;

    const prompt = `Analyze this prediction market and generate a trading signal:

Market: "${market_title}"
Market ID: ${market_id}
Current Price: ${(current_price * 100).toFixed(1)}%
Outcomes: ${outcomesStr}

Consider:
1. Is the current price accurately reflecting true probabilities?
2. What factors might the market be underweighting or overweighting?
3. What's the expected edge if any?
4. How liquid is this market likely to be?

Respond with your structured signal JSON.`;

    try {
      const llmResponse = await callLLMForSignal(prompt);

      // Parse the JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                direction: "neutral",
                confidence: 30,
                reasoning: "Unable to parse structured signal from analysis.",
                factors: ["analysis_error"],
                raw_response: llmResponse.slice(0, 200),
              }),
            },
          ],
        };
      }

      const signal = JSON.parse(jsonMatch[0]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              market_id,
              market_title,
              current_price,
              ...signal,
              generated_at: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Signal generation failed: ${error instanceof Error ? error.message : "unknown"}`,
              market_id,
            }),
          },
        ],
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[signals-mcp] Server started");
}

main().catch(console.error);
