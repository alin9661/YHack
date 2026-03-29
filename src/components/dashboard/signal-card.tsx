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
    color: "text-oracle-gold",
    bg: "bg-oracle-gold/10",
    border: "border-oracle-gold-dim/20",
    bar: "bg-oracle-gold",
    label: "BULLISH",
  },
  bearish: {
    icon: "↘",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    bar: "bg-red-500",
    label: "BEARISH",
  },
  neutral: {
    icon: "→",
    color: "text-oracle-amber",
    bg: "bg-oracle-amber/10",
    border: "border-oracle-amber/20",
    bar: "bg-oracle-amber",
    label: "NEUTRAL",
  },
};

export function SignalCard({ signal }: SignalCardProps) {
  const config = DIRECTION_CONFIG[signal.direction] || DIRECTION_CONFIG.neutral;

  return (
    <Card className="bg-oracle-deep/60 border-oracle-surface-light/40 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display text-oracle-text leading-tight max-w-[70%]">
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
            <span className="text-oracle-text-dim">Confidence</span>
            <span className={`font-mono ${config.color}`}>
              {signal.confidence}%
            </span>
          </div>
          <div className="h-2 bg-oracle-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${config.bar}`}
              style={{ width: `${Math.min(signal.confidence, 100)}%` }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-xs text-oracle-text-dim leading-relaxed">
          {signal.reasoning}
        </p>

        {/* Factors */}
        {signal.factors && signal.factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signal.factors.map((factor, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] text-oracle-text-dim border-oracle-surface-light/60 font-mono"
              >
                {factor}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {signal.generated_at && (
          <p className="font-mono text-[10px] text-oracle-text-dim/40 pt-1 border-t border-oracle-surface-light/30">
            Generated {new Date(signal.generated_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
