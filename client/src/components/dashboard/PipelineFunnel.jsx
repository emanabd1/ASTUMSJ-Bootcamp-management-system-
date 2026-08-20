import React from "react";

export default function PipelineFunnel({ stages }) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.value / max) * 100, stage.value > 0 ? 8 : 3);
        return (
          <div key={stage.label} className="flex items-center gap-4">
            <div className="w-28 shrink-0 text-right">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#a39081]">
                {stage.label}
              </span>
            </div>
            <div className="relative h-8 flex-1">
              <div
                className="flex h-full items-center justify-end rounded-md pr-3 transition-all duration-700 ease-out"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color,
                  boxShadow: i === 0 ? "none" : `-3px 0 0 0 #16110e`,
                }}
              >
                <span className="font-mono text-xs font-bold text-[#1e1713]">
                  {stage.value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}