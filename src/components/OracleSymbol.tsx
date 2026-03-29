interface OracleSymbolProps {
  size?: number;
  className?: string;
}

export function OracleSymbol({ size = 32, className = "" }: OracleSymbolProps) {
  const lines = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x1: 60 + Math.cos(angle) * 44,
      y1: 60 + Math.sin(angle) * 44,
      x2: 60 + Math.cos(angle) * 53,
      y2: 60 + Math.sin(angle) * 53,
    };
  });

  const dots = [0, 90, 180, 270].map((deg) => {
    const angle = (deg * Math.PI) / 180;
    return {
      cx: 60 + Math.cos(angle) * 48,
      cy: 60 + Math.sin(angle) * 48,
    };
  });

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {/* Concentric circles */}
      <circle cx="60" cy="60" r="55" strokeWidth="0.5" opacity="0.3" />
      <circle cx="60" cy="60" r="42" strokeWidth="0.5" opacity="0.5" />
      <circle cx="60" cy="60" r="28" strokeWidth="0.8" opacity="0.7" />

      {/* Radial lines */}
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}

      {/* Cardinal dots */}
      {dots.map((d, i) => (
        <circle
          key={`dot-${i}`}
          cx={d.cx}
          cy={d.cy}
          r="1.5"
          fill="currentColor"
          stroke="none"
          opacity="0.6"
        />
      ))}

      {/* Eye ellipse */}
      <ellipse cx="60" cy="60" rx="18" ry="10" strokeWidth="1" opacity="0.8" />

      {/* Pupil */}
      <circle cx="60" cy="60" r="4" fill="currentColor" stroke="none" opacity="0.9" />
    </svg>
  );
}
