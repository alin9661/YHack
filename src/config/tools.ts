import type { ToolRegistryEntry } from "@/types";

export const TOOL_DEFINITIONS: ToolRegistryEntry[] = [
  // --- Lava-proxied tools (Polymarket via forward endpoint) ---
  {
    name: "polymarket_search",
    description:
      "Search for prediction markets on Polymarket by keyword. Returns a list of markets with titles, prices (probabilities), and volumes. Use this to find markets related to a topic.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query for prediction markets (e.g., 'AI regulation', 'election', 'crypto')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default 5)",
        },
      },
      required: ["query"],
    },
    provider: {
      type: "lava",
      lavaUrl: "https://gamma-api.polymarket.com/markets",
      lavaMethod: "GET",
    },
    cacheTtlSeconds: 60,
    costTier: "low",
  },
  {
    name: "polymarket_market_detail",
    description:
      "Get detailed information about a specific Polymarket prediction market by its slug or condition ID. Returns full market data including outcomes, prices, volume, and resolution details.",
    parameters: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The market slug (URL-friendly name) from Polymarket",
        },
      },
      required: ["slug"],
    },
    provider: {
      type: "lava",
      lavaUrl: "https://gamma-api.polymarket.com/markets",
      lavaMethod: "GET",
    },
    cacheTtlSeconds: 60,
    costTier: "low",
  },

  // --- MCP tools (custom signal generation) ---
  {
    name: "generate_signal",
    description:
      "Generate a prediction signal for a specific market. Analyzes current market data and returns a directional signal (bullish/bearish/neutral) with confidence score, reasoning, and key factors. Use this after retrieving market data to provide actionable analysis.",
    parameters: {
      type: "object",
      properties: {
        market_id: {
          type: "string",
          description: "The market identifier or slug",
        },
        market_title: {
          type: "string",
          description: "The market title/question",
        },
        current_price: {
          type: "number",
          description:
            "Current market price (0-1, representing probability)",
        },
        outcomes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
            },
          },
          description: "List of outcomes with their current prices",
        },
      },
      required: ["market_id", "market_title", "current_price"],
    },
    provider: {
      type: "mcp",
      mcpServer: "signals",
      mcpTool: "generate_signal",
    },
    costTier: "medium",
  },

  // --- HTTP tools (Supabase persistence) ---
  {
    name: "store_analysis",
    description:
      "Store a market analysis result in the database for later retrieval. Saves the market data, signal, and reasoning. Use this after generating a signal to persist the analysis.",
    parameters: {
      type: "object",
      properties: {
        market_id: { type: "string", description: "Market identifier" },
        market_title: { type: "string", description: "Market title/question" },
        signal: {
          type: "object",
          properties: {
            direction: {
              type: "string",
              enum: ["bullish", "bearish", "neutral"],
            },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            factors: { type: "array", items: { type: "string" } },
          },
          description: "The generated prediction signal",
        },
        market_data: {
          type: "object",
          description: "Snapshot of market data at analysis time",
        },
      },
      required: ["market_id", "market_title", "signal"],
    },
    provider: {
      type: "http",
      httpUrl: "/api/tools/store-analysis",
      httpMethod: "POST",
    },
    costTier: "free",
  },
  {
    name: "query_analyses",
    description:
      "Retrieve past market analyses from the database. Can filter by market ID or return recent analyses. Use this to show historical analysis data or compare current signals to past ones.",
    parameters: {
      type: "object",
      properties: {
        market_id: {
          type: "string",
          description: "Filter by specific market (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default 10)",
        },
      },
    },
    provider: {
      type: "http",
      httpUrl: "/api/tools/query-analyses",
      httpMethod: "POST",
    },
    costTier: "free",
  },

  // --- Local tools (for testing and utilities) ---
  {
    name: "get_current_time",
    description:
      "Get the current date and time. Useful for timestamping analyses or providing temporal context.",
    parameters: {
      type: "object",
      properties: {},
    },
    provider: {
      type: "local",
      handler: async () => ({
        timestamp: new Date().toISOString(),
        unix: Date.now(),
        formatted: new Date().toLocaleString("en-US", {
          timeZone: "America/New_York",
          dateStyle: "full",
          timeStyle: "long",
        }),
      }),
    },
    costTier: "free",
  },
];
