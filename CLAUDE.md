# MarketMind

AI-powered prediction market intelligence built for YHack. Chat with an agentic AI to search Polymarket, generate trading signals, and persist analyses.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-nova) + "Luminous Noir" design system (gold/dark theme)
- **Fonts**: Cormorant Garamond (display), DM Sans (body), JetBrains Mono (mono) — via next/font/google
- **LLM**: Claude via Lava Gateway proxy (`src/lib/lava-client.ts`)
- **Database**: Supabase (analyses table — see `supabase/schema.sql`)
- **Tools**: MCP protocol for signal generation (`src/mcp-servers/signals/`)
- **UI Components**: shadcn Card, Badge, Button, Separator + custom OracleSymbol SVG

## Architecture

```
Landing (/)          → src/app/page.tsx → LandingPage component
Chat    (/chat)      → src/app/chat/page.tsx → sidebar + chat panel + dashboard panel
API     (/api/chat)  → streaming SSE via agentic loop (orchestrator.ts)
Tools   (/api/tools) → Supabase persistence (store-analysis, query-analyses)
```

### Backend (src/lib/)
- `orchestrator.ts` — Agentic loop: calls Claude, dispatches tools in parallel, streams SSE events. Max 10 iterations. Structurally truncates large tool results to stay under 4000 chars.
- `lava-client.ts` — Lava Gateway proxy for Claude API calls
- `dispatcher.ts` — Routes tool calls by provider type (lava/mcp/http/local)
- `tool-registry.ts` — Central tool registration
- `mcp-manager.ts` — MCP server lifecycle management
- `cache.ts` — In-memory request cache with TTL
- `chat-cache.ts` — Client-side localStorage persistence for chat sessions (24h expiry)

### Tools (src/config/tools.ts)
- `polymarket_search` — Search prediction markets (via Lava proxy)
- `polymarket_market_detail` — Get single market data (via Lava proxy)
- `generate_signal` — AI signal generation (via MCP server)
- `store_analysis` / `query_analyses` — Supabase persistence
- `get_current_time` — Local utility

### Frontend Layout
- **Left sidebar** (64px): OracleSymbol logo (links home), new session button, session timer, exchange count
- **Chat panel** (flex-1): Scrollable messages with sticky input at bottom. Messages use react-markdown with Oracle-themed component overrides (gold bold, amber italic, gold-dim code). Thinking indicator uses animated dots.
- **Dashboard panel** (400px fixed): Independently scrollable. Accumulates market cards and signal cards from tool results across the conversation.
- **Chat persistence**: Messages cached to localStorage, survive refresh/navigation. Session timer accounts for elapsed time.

### Design System ("Luminous Noir")
- Gold palette: `oracle-gold` (#D4A84B), `oracle-gold-dim`, `oracle-amber`
- Dark backgrounds: `oracle-void` (#0A0C10), `oracle-deep`, `oracle-surface`, `oracle-surface-light`
- Text: `oracle-text` (#D4CFC0), `oracle-text-dim`
- Effects: Particle canvas, orbital orbs, film grain overlay, fade-up animations
- shadcn CSS vars remapped to Oracle palette in globals.css

## Environment Variables

```
LAVA_SECRET_KEY=...       # Lava Gateway API key
DEFAULT_MODEL=...         # Claude model ID
SUPABASE_URL=...          # Supabase project URL (optional)
SUPABASE_ANON_KEY=...     # Supabase anon key (optional)
```

## Development

```bash
pnpm install
pnpm dev        # starts Next.js dev server with Turbopack
```

@AGENTS.md
