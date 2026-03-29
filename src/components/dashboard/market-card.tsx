import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketOutcome {
  name: string;
  price: number;
}

interface MarketData {
  id?: string;
  title: string;
  slug?: string;
  outcomes: MarketOutcome[];
  volume?: number;
  liquidity?: number;
  endDate?: string;
  active?: boolean;
}

interface MarketCardProps {
  market: MarketData;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export function MarketCard({ market }: MarketCardProps) {
  return (
    <Card className="bg-oracle-deep/60 border-oracle-surface-light/40 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-display text-oracle-text leading-tight">
            {market.title}
          </CardTitle>
          {market.active !== false && (
            <Badge
              variant="outline"
              className="text-oracle-gold border-oracle-gold-dim/30 text-[10px] flex-shrink-0 font-mono"
            >
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Outcome bars */}
        <div className="space-y-2">
          {market.outcomes.map((outcome, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-oracle-text-dim">{outcome.name}</span>
                <span className="font-mono text-oracle-text">
                  {(outcome.price * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-oracle-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    i === 0 ? "bg-oracle-gold" : "bg-oracle-surface-light"
                  }`}
                  style={{ width: `${Math.min(outcome.price * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 font-mono text-[10px] text-oracle-text-dim pt-1 border-t border-oracle-surface-light/30">
          {market.volume != null && (
            <span>Vol: {formatVolume(market.volume)}</span>
          )}
          {market.liquidity != null && (
            <span>Liq: {formatVolume(market.liquidity)}</span>
          )}
          {market.endDate && (
            <span>
              Ends: {new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
