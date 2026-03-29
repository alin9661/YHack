interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "complete" | "error";
}

interface ToolActivityProps {
  toolCalls: ToolCall[];
}

const TOOL_LABELS: Record<string, string> = {
  polymarket_search: "Searching Polymarket",
  polymarket_market_detail: "Loading market data",
  generate_signal: "Generating signal",
  store_analysis: "Storing analysis",
  query_analyses: "Loading past analyses",
  get_current_time: "Checking time",
};

export function ToolActivity({ toolCalls }: ToolActivityProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="flex justify-start mt-2 ml-10">
      <div className="space-y-1.5">
        {toolCalls.map((tc, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 bg-oracle-deep/60 px-3 py-2 border border-oracle-surface-light/40"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                tc.status === "pending"
                  ? "bg-oracle-gold thinking-dot animate-thinking-dot"
                  : tc.status === "complete"
                    ? "bg-emerald-400"
                    : "bg-red-400"
              }`}
            />
            <span className="font-mono text-[10px] tracking-wider text-oracle-text-dim">
              {TOOL_LABELS[tc.name] || tc.name}
            </span>
            {tc.status === "pending" && (
              <span className="font-mono text-[10px] text-oracle-text-dim/40">
                contemplating...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
