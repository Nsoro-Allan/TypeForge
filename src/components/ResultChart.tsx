import { useState } from "react";
import type { MouseEvent } from "react";
import type { Sample } from "../types";

const W = 720;
const H = 250;
const M = { l: 44, r: 40, t: 16, b: 30 };

export function ResultChart({ samples }: { samples: Sample[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (samples.length < 2) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-sub">
        not enough data for a chart — try a longer test
      </div>
    );
  }

  const tMin = samples[0].t;
  const tMax = Math.max(samples[samples.length - 1].t, tMin + 1);
  const yMax = Math.max(10, Math.ceil((Math.max(...samples.map((s) => Math.max(s.wpm, s.raw))) * 1.1) / 10) * 10);
  // multiple of 4 so every right-axis tick is a whole number of errors
  const eMax = Math.max(4, Math.ceil(Math.max(...samples.map((s) => s.errors)) / 4) * 4);

  const x = (t: number) => M.l + ((t - tMin) / (tMax - tMin)) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const ye = (v: number) => H - M.b - (v / eMax) * (H - M.t - M.b);
  const line = (key: "wpm" | "raw") => samples.map((s) => `${x(s.t).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    samples.forEach((s, i) => {
      if (Math.abs(x(s.t) - px) < Math.abs(x(samples[best].t) - px)) best = i;
    });
    setHover(best);
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const hs = hover !== null ? samples[hover] : null;
  const tipX = hs ? Math.min(x(hs.t) + 10, W - 150) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full select-none"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      role="img"
      aria-label="Words per minute over time"
    >
      {ticks.map((k) => (
        <g key={k}>
          <line x1={M.l} x2={W - M.r} y1={y(yMax * k)} y2={y(yMax * k)} style={{ stroke: "var(--tf-sub)", opacity: 0.18 }} />
          <text x={M.l - 8} y={y(yMax * k) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--tf-sub)" }}>
            {Math.round(yMax * k)}
          </text>
          <text x={W - M.r + 8} y={ye(eMax * k) + 4} fontSize="11" style={{ fill: "var(--tf-sub)", opacity: 0.7 }}>
            {Math.round(eMax * k)}
          </text>
        </g>
      ))}
      {samples.map((s) => (
        <text key={s.t} x={x(s.t)} y={H - 10} textAnchor="middle" fontSize="11" style={{ fill: "var(--tf-sub)" }}>
          {Number.isInteger(s.t) && (samples.length <= 20 || s.t % 5 === 0) ? s.t : ""}
        </text>
      ))}

      <polyline points={line("raw")} fill="none" strokeWidth="2" strokeLinejoin="round" style={{ stroke: "var(--tf-sub)" }} />
      <polyline points={line("wpm")} fill="none" strokeWidth="2.5" strokeLinejoin="round" style={{ stroke: "var(--tf-main)" }} />
      {samples.map(
        (s) =>
          s.errors > 0 && (
            <g key={`e${s.t}`} style={{ stroke: "var(--tf-error)" }} strokeWidth="2" strokeLinecap="round">
              <line x1={x(s.t) - 3.5} y1={ye(s.errors) - 3.5} x2={x(s.t) + 3.5} y2={ye(s.errors) + 3.5} />
              <line x1={x(s.t) - 3.5} y1={ye(s.errors) + 3.5} x2={x(s.t) + 3.5} y2={ye(s.errors) - 3.5} />
            </g>
          )
      )}

      {hs && (
        <g pointerEvents="none">
          <line x1={x(hs.t)} x2={x(hs.t)} y1={M.t} y2={H - M.b} style={{ stroke: "var(--tf-sub)", opacity: 0.5 }} strokeDasharray="3 3" />
          <circle cx={x(hs.t)} cy={y(hs.wpm)} r="4" style={{ fill: "var(--tf-main)" }} />
          <g transform={`translate(${tipX}, ${M.t + 4})`}>
            <rect width="140" height="64" rx="8" style={{ fill: "var(--tf-bg)", stroke: "var(--tf-sub)" }} strokeOpacity="0.4" />
            <text x="10" y="18" fontSize="11" style={{ fill: "var(--tf-sub)" }}>{hs.t}s</text>
            <text x="10" y="34" fontSize="12" style={{ fill: "var(--tf-main)" }}>wpm {Math.round(hs.wpm)}</text>
            <text x="10" y="48" fontSize="12" style={{ fill: "var(--tf-text)" }}>raw {Math.round(hs.raw)}</text>
            <text x="76" y="48" fontSize="12" style={{ fill: "var(--tf-error)" }}>err {hs.errors}</text>
          </g>
        </g>
      )}
    </svg>
  );
}
