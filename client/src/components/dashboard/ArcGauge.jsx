import React from "react";

// Converts polar coordinates to cartesian, used to plot points along the arc.
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Builds an SVG arc path between two angles.
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/**
 * A 270-degree progress arc with a deliberate open gap at the bottom —
 * a nod to the crescent in the ASTUMSJ logo. Track spans -225deg to 45deg.
 */
export default function ArcGauge({
  value = 0,
  label,
  sublabel,
  color = "#c89b7b",
  size = 168,
  strokeWidth = 12,
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth;
  const startAngle = -225;
  const endAngle = 45;
  const sweep = endAngle - startAngle; // 270
  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);
  const circumference = 2 * Math.PI * r * (sweep / 360);
  const progressLength = circumference * (clamped / 100);
  const tip = polarToCartesian(cx, cy, r, startAngle + sweep * (clamped / 100));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={trackPath}
          fill="none"
          stroke="#2d231d"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        {clamped > 2 && (
          <circle cx={tip.x} cy={tip.y} r={strokeWidth / 3.2} fill={color} />
        )}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.19}
          fontWeight="700"
          fill="#f5efe6"
        >
          {clamped}%
        </text>
        {sublabel && (
          <text
            x={cx}
            y={cy + size * 0.14}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={size * 0.062}
            fill="#a39081"
            letterSpacing="0.5"
          >
            {sublabel}
          </text>
        )}
      </svg>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-[#a39081]">
          {label}
        </p>
      )}
    </div>
  );
}