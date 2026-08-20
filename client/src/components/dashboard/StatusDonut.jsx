import React from "react";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export default function StatusDonut({ segments, size = 160, strokeWidth = 22 }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth / 2 - 2;

  let cursor = 0;
  const arcs = segments.map((seg) => {
    const startAngle = (cursor / total) * 360;
    cursor += seg.value;
    const endAngle = (cursor / total) * 360;
    return { ...seg, startAngle, endAngle };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) =>
          arc.value > 0 ? (
            <path
              key={arc.label}
              d={describeArc(
                cx,
                cy,
                r,
                arc.startAngle + (segments.length > 1 ? 2 : 0),
                arc.endAngle - (segments.length > 1 ? 2 : 0)
              )}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ) : null
        )}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.18}
          fontWeight="700"
          fill="#f5efe6"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.07}
          fill="#a39081"
        >
          accounts
        </text>
      </svg>
      <div className="space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-[#a39081]">{seg.label}</span>
            <span className="font-mono text-xs font-bold text-[#f5efe6]">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}