import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SignalData {
  market_id?: string;
  market_title: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  factors?: string[];
  generated_at?: string;
}

interface SignalCardProps {
  signal: SignalData;
}

const DIRECTION_CONFIG = {
  bullish: {
    icon: "↗",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    label: "BULLISH",
  },
  bearish: {
    icon: "↘",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    label: "BEARISH",
  },
  neutral: {
    icon: "→",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    label: "NEUTRAL",
  },
};

export function SignalCard({ signal }: SignalCardProps) {
  const config = DIRECTION_CONFIG[signal.direction] || DIRECTION_CONFIG.neutral;

  return (
    <Card className={`bg-zinc-900/50 border-zinc-800 overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-100 leading-tight max-w-[70%]">
            {signal.market_title}
          </CardTitle>
          <Badge className={`${config.bg} ${config.color} ${config.border} text-[10px] font-mono`}>
            {config.icon} {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Confidence bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">Confidence</span>
            <span className={`font-mono ${config.color}`}>
              {signal.confidence}%
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                signal.direction === "bullish"
                  ? "bg-emerald-500"
                  : signal.direction === "bearish"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(signal.confidence, 100)}%` }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          {signal.reasoning}
        </p>

        {/* Factors */}
        {signal.factors && signal.factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signal.factors.map((factor, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] text-zinc-400 border-zinc-700"
              >
                {factor}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {signal.generated_at && (
          <p className="text-[10px] text-zinc-600 pt-1 border-t border-zinc-800/50">
            Generated {new Date(signal.generated_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
