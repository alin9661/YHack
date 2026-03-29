"use client";

import type { ChatMessage } from "@/types";
import { MarketCard } from "./market-card";
import { SignalCard } from "./signal-card";
import { OracleSymbol } from "@/components/OracleSymbol";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DashboardPanelProps {
  messages: ChatMessage[];
}

interface MarketOutcome {
  name: string;
  price: number;
}

interface MarketResult {
  id?: string;
  title: string;
  slug?: string;
  outcomes: MarketOutcome[];
  volume?: number;
  liquidity?: number;
  endDate?: string;
  active?: boolean;
}

interface SignalResult {
  market_id?: string;
  market_title: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  factors?: string[];
  generated_at?: string;
}

/**
 * Extract tool results from all messages and render as dashboard cards.
 * Market data and signals accumulate across the conversation.
 */
export function DashboardPanel({ messages }: DashboardPanelProps) {
  const markets: MarketResult[] = [];
  const signals: SignalResult[] = [];

  // Collect tool results from all messages
  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      if (tc.status !== "complete" || !tc.result) continue;

      const result = tc.result as Record<string, unknown>;

      if (tc.name === "polymarket_search" && result.markets) {
        const rawMarkets = result.markets as MarketResult[];
        for (const m of rawMarkets) {
          if (!markets.some((existing) => existing.id === m.id)) {
            markets.push(m);
          }
        }
      }

      if (tc.name === "polymarket_market_detail" && result.title) {
        const m = result as unknown as MarketResult;
        if (!markets.some((existing) => existing.id === m.id)) {
          markets.push(m);
        }
      }

      if (tc.name === "generate_signal" && result.direction) {
        signals.push(result as unknown as SignalResult);
      }
    }
  }

  const hasContent = markets.length > 0 || signals.length > 0;

  return (
    <div className="flex flex-col h-full border-l border-oracle-surface-light/30">
      <div className="p-4 border-b border-oracle-surface-light/30">
        <h2 className="text-sm font-display tracking-wider text-oracle-text">Dashboard</h2>
        <p className="font-mono text-[10px] tracking-wider text-oracle-text-dim mt-0.5">
          {hasContent
            ? `${markets.length} markets · ${signals.length} signals`
            : "Tool results appear here"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {!hasContent && (
            <div className="flex flex-col items-center text-center mt-20">
              <OracleSymbol size={48} className="text-oracle-gold opacity-40 mb-4" />
              <p className="font-mono text-[10px] tracking-wider text-oracle-text-dim">
                Search for markets or generate signals
                <br />
                to populate the dashboard
              </p>
            </div>
          )}

          {/* Signals section */}
          {signals.length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.25em] text-oracle-text-dim uppercase mb-3">
                Signals
              </h3>
              <div className="space-y-3">
                {signals.map((signal, i) => (
                  <SignalCard key={i} signal={signal} />
                ))}
              </div>
            </div>
          )}

          {signals.length > 0 && markets.length > 0 && (
            <Separator className="bg-oracle-surface-light/30" />
          )}

          {/* Markets section */}
          {markets.length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.25em] text-oracle-text-dim uppercase mb-3">
                Markets
              </h3>
              <div className="space-y-3">
                {markets.map((market, i) => (
                  <MarketCard key={market.id || i} market={market} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
