import React from "react";

/**
 * items: [{ label, value, color }]
 * Renders horizontal bars scaled against the largest value in the set.
 */
export default function BarCompare({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#a39081]">
              {item.label}
            </span>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#2d231d]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}