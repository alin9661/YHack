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
    <div className="flex justify-start mt-2 ml-2">
      <div className="space-y-1.5">
        {toolCalls.map((tc, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-xs bg-zinc-900/80 rounded-md px-3 py-2 border border-zinc-800"
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                tc.status === "pending"
                  ? "bg-amber-400 animate-pulse"
                  : tc.status === "complete"
                    ? "bg-emerald-400"
                    : "bg-red-400"
              }`}
            />
            <span className="font-mono text-zinc-300">
              {TOOL_LABELS[tc.name] || tc.name}
            </span>
            {tc.status === "pending" && (
              <span className="text-zinc-500">running...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
