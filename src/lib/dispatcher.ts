import type { ToolRegistryEntry } from "@/types";
import { callLavaDataAPI } from "@/lib/lava-client";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";
import { getMCPManager } from "@/lib/mcp-manager";

/**
 * Dispatch a tool call to the correct provider based on registry entry.
 * This is the routing layer — it inspects the provider type and delegates.
 */
export async function dispatch(
  entry: ToolRegistryEntry,
  input: Record<string, unknown>
): Promise<unknown> {
  // Check cache first
  if (entry.cacheTtlSeconds) {
    const key = cacheKey(entry.name, input);
    const cached = cacheGet(key);
    if (cached) {
      console.log(`[dispatch] cache hit: ${entry.name}`);
      return cached;
    }
  }

  let result: unknown;

  switch (entry.provider.type) {
    case "lava":
      result = await dispatchLava(entry, input);
      break;
    case "mcp":
      result = await dispatchMCP(entry, input);
      break;
    case "http":
      result = await dispatchHTTP(entry, input);
      break;
    case "local":
      result = await entry.provider.handler!(input);
      break;
    default:
      throw new Error(`Unknown provider type: ${entry.provider.type}`);
  }

  // Cache if configured
  if (entry.cacheTtlSeconds) {
    const key = cacheKey(entry.name, input);
    cacheSet(key, result, entry.cacheTtlSeconds);
  }

  return result;
}

/**
 * Dispatch to a Lava-proxied data API.
 * Builds the forward URL and maps tool input to query params or body.
 * Includes tool-specific result normalization to keep token usage low.
 */
async function dispatchLava(
  entry: ToolRegistryEntry,
  input: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = entry.provider.lavaUrl!;
  const method = entry.provider.lavaMethod || "POST";

  let raw: unknown;

  if (method === "GET") {
    // Tool-specific query param mapping
    const params = new URLSearchParams();

    if (entry.name === "polymarket_search") {
      // Polymarket search uses _q for text search
      params.set("_q", String(input.query));
      params.set("_limit", String(input.limit || 5));
      params.set("active", "true");
      params.set("closed", "false");
    } else if (entry.name === "polymarket_market_detail") {
      params.set("slug", String(input.slug));
    } else {
      // Generic param mapping
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
    }

    const url = `${baseUrl}?${params.toString()}`;
    raw = await callLavaDataAPI(url, "GET");
  } else {
    raw = await callLavaDataAPI(baseUrl, method, input);
  }

  // Normalize Polymarket responses to save tokens (spec §8.5)
  if (entry.name === "polymarket_search") {
    return normalizePolymarketSearch(raw);
  }
  if (entry.name === "polymarket_market_detail") {
    return normalizePolymarketDetail(raw);
  }

  return raw;
}

interface PolymarketRawMarket {
  id?: string;
  question?: string;
  slug?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: number;
  liquidity?: number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  description?: string;
  category?: string;
}

function normalizePolymarketSearch(raw: unknown): unknown {
  const markets = Array.isArray(raw) ? raw : [];
  return {
    count: markets.length,
    markets: markets.map((m: PolymarketRawMarket) => ({
      id: m.id,
      title: m.question,
      slug: m.slug,
      outcomes: parseOutcomes(m.outcomes, m.outcomePrices),
      volume: m.volume,
      liquidity: m.liquidity,
      endDate: m.endDate,
      active: m.active,
    })),
  };
}

function normalizePolymarketDetail(raw: unknown): unknown {
  // Detail endpoint may return array with one item or single object
  const markets = Array.isArray(raw) ? raw : [raw];
  const m = markets[0] as PolymarketRawMarket | undefined;
  if (!m) return { error: "Market not found" };

  return {
    id: m.id,
    title: m.question,
    slug: m.slug,
    description: m.description?.slice(0, 500),
    outcomes: parseOutcomes(m.outcomes, m.outcomePrices),
    volume: m.volume,
    liquidity: m.liquidity,
    endDate: m.endDate,
    active: m.active,
    closed: m.closed,
    category: m.category,
  };
}

function parseOutcomes(
  outcomes?: string,
  prices?: string
): { name: string; price: number }[] {
  try {
    const names: string[] = outcomes ? JSON.parse(outcomes) : [];
    const priceValues: string[] = prices ? JSON.parse(prices) : [];
    return names.map((name, i) => ({
      name,
      price: parseFloat(priceValues[i] || "0"),
    }));
  } catch {
    return [];
  }
}

/**
 * Dispatch to a custom MCP server via the MCP Manager.
 */
async function dispatchMCP(
  entry: ToolRegistryEntry,
  input: Record<string, unknown>
): Promise<unknown> {
  const serverName = entry.provider.mcpServer!;
  const toolName = entry.provider.mcpTool!;
  const manager = getMCPManager();

  if (!manager.isConnected(serverName)) {
    throw new Error(
      `MCP server "${serverName}" is not connected. Ensure it is initialized.`
    );
  }

  return manager.executeTool(serverName, toolName, input);
}

/**
 * Dispatch to a direct HTTP endpoint.
 * Used for internal APIs like Supabase tool endpoints.
 */
async function dispatchHTTP(
  entry: ToolRegistryEntry,
  input: Record<string, unknown>
): Promise<unknown> {
  const url = entry.provider.httpUrl!;
  const method = entry.provider.httpMethod || "POST";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...entry.provider.httpHeaders,
  };

  // For relative URLs (internal API routes), prepend the base URL
  const fullUrl = url.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${url}`
    : url;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: method !== "GET" ? JSON.stringify(input) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP tool call failed (${response.status}): ${errorText}`);
  }

  return response.json();
}
