import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Difficulty } from "../types";
import { getGameBests, getHistory, getPersonalBests } from "../lib/storage";
import { describeConfig } from "./Results";

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function labelOfKey(key: string): string {
  const [base, ...flags] = key.split("+");
  const [mode, val] = base.split("-");
  const extra = flags.map((f) => (f === "p" ? "punctuation" : f === "n" ? "numbers" : f)).join(" · ");
  return `${mode} ${val}${extra ? ` · ${extra}` : ""}`;
}

const MODE_ORDER: Record<string, number> = { time: 0, words: 1, quote: 2 };
const QUOTE_ORDER: Record<string, number> = { short: 1, medium: 2, long: 3 };

function sortKey(key: string): number {
  const [base] = key.split("+");
  const [mode, val] = base.split("-");
  const n = Number(val);
  return (MODE_ORDER[mode] ?? 9) * 1000 + (Number.isFinite(n) ? n : QUOTE_ORDER[val] ?? 0) + (key.length - base.length) * 0.001;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-subalt p-5">
      <h3 className="mb-4 text-xs uppercase tracking-widest text-sub">{title}</h3>
      {children}
    </section>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="py-6 text-sm text-sub">complete a few tests to see your progress</div>;
  const W = 600;
  const H = 120;
  const max = Math.max(...values, 10);
  const min = Math.min(...values, max - 1);
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 8 - ((v - min) / (max - min || 1)) * (H - 16);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="wpm over your last tests">
      <polyline points={`0,${H} ${pts} ${W},${H}`} style={{ fill: "var(--tf-main)", opacity: 0.1 }} />
      <polyline points={pts} fill="none" strokeWidth="2.5" strokeLinejoin="round" style={{ stroke: "var(--tf-main)" }} />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" style={{ fill: "var(--tf-main)" }} />
      ))}
    </svg>
  );
}

export function StatsPage() {
  const { history, pbs, games } = useMemo(
    () => ({
      history: getHistory(),
      pbs: getPersonalBests().sort((a, b) => sortKey(a.key) - sortKey(b.key)),
      games: getGameBests(),
    }),
    []
  );

  const avg = (f: (r: (typeof history)[number]) => number, list = history) =>
    list.length ? list.reduce((a, r) => a + f(r), 0) / list.length : 0;
  const last10 = history.slice(0, 10);
  const best = history.reduce((m, r) => Math.max(m, r.wpm), 0);
  const seconds = history.reduce((a, r) => a + r.time, 0);
  const trend = history.slice(0, 40).map((r) => r.wpm).reverse();

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 px-6 pb-16 tf-fade">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["tests completed", String(history.length)],
          ["time typing", seconds >= 3600 ? `${(seconds / 3600).toFixed(1)}h` : `${Math.round(seconds / 60)}m`],
          ["best wpm", String(Math.round(best))],
          ["avg wpm (last 10)", String(Math.round(avg((r) => r.wpm, last10)))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-subalt p-5">
            <div className="text-xs text-sub">{label}</div>
            <div className="mt-1 font-mono text-4xl text-main">{value}</div>
          </div>
        ))}
      </div>

      <Card title="progress · last 40 tests (wpm)">
        <Spark values={trend} />
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="personal bests">
          {pbs.length === 0 ? (
            <p className="text-sm text-sub">no personal bests yet — finish a test!</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-sub">
                <tr>
                  <th className="pb-2 font-normal">test</th>
                  <th className="pb-2 font-normal">wpm</th>
                  <th className="pb-2 font-normal">acc</th>
                  <th className="pb-2 font-normal">cons</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {pbs.map((p) => (
                  <tr key={p.key} className="border-t border-sub/15" title={fmtDate(p.timestamp)}>
                    <td className="py-1.5 font-sans text-fg">{labelOfKey(p.key)}</td>
                    <td className="text-main">{Math.round(p.wpm)}</td>
                    <td>{Math.round(p.acc)}%</td>
                    <td>{Math.round(p.consistency)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="arcade · void defender">
          <div className="space-y-3">
            {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
              const g = games[d];
              return (
                <div key={d} className="flex items-center justify-between rounded-lg bg-bg px-4 py-3">
                  <span className="text-sm capitalize text-fg">{d}</span>
                  {g ? (
                    <span className="font-mono text-sm text-sub">
                      <span className="text-main">{g.score.toLocaleString()}</span> · wave {g.wave} · {Math.round(g.wpm)} wpm
                    </span>
                  ) : (
                    <span className="text-sm text-sub">not played</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="recent tests">
        {history.length === 0 ? (
          <p className="text-sm text-sub">nothing here yet. Your results are saved on this device only.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-sub">
                <tr>
                  {["test", "wpm", "raw", "acc", "cons", "when"].map((h) => (
                    <th key={h} className="pb-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {history.slice(0, 15).map((r) => {
                  const d = describeConfig(r.config);
                  return (
                    <tr key={r.timestamp} className="border-t border-sub/15">
                      <td className="py-1.5 font-sans text-fg">
                        {d.title}
                        {d.sub && <span className="ml-2 text-xs text-sub">{d.sub}</span>}
                      </td>
                      <td className="text-main">{Math.round(r.wpm)}</td>
                      <td>{Math.round(r.raw)}</td>
                      <td>{Math.round(r.acc)}%</td>
                      <td>{Math.round(r.consistency)}%</td>
                      <td className="font-sans text-xs text-sub">{fmtDate(r.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
