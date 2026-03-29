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
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-zinc-100 leading-tight">
            {market.title}
          </CardTitle>
          {market.active !== false && (
            <Badge
              variant="outline"
              className="text-emerald-400 border-emerald-400/30 text-[10px] flex-shrink-0"
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
                <span className="text-zinc-400">{outcome.name}</span>
                <span className="font-mono text-zinc-200">
                  {(outcome.price * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    i === 0 ? "bg-blue-500" : "bg-zinc-600"
                  }`}
                  style={{ width: `${Math.min(outcome.price * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/50">
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
