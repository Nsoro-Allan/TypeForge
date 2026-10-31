import type { TestStats, TestConfig } from "../types";

interface Props {
  stats: TestStats;
  config: TestConfig;
  timeElapsed: number;
  isStarted: boolean;
  isFinished: boolean;
}

export function StatsBar({
  stats,
  config,
  timeElapsed,
  isStarted,
  isFinished,
}: Props) {
  // Hide until the user starts typing (cleaner look)
  if (!isStarted && !isFinished) {
    return (
      <div className="flex justify-center gap-12 mb-14 font-mono h-[72px]" />
    );
  }

  const remaining =
    config.mode === "time" && config.duration
      ? Math.max(0, Math.ceil(config.duration - timeElapsed))
      : null;

  return (
    <div className="flex justify-center gap-10 sm:gap-14 mb-14 font-mono">
      <Stat value={stats.wpm} label="wpm" accent />
      <Stat value={`${stats.accuracy}%`} label="acc" />
      {remaining !== null && <Stat value={remaining} label="time" />}
      {config.mode === "words" && (
        <Stat
          value={Math.min(
            Math.floor(timeElapsed), // just show elapsed for now
            999
          )}
          label="sec"
        />
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center min-w-[64px]">
      <div
        className={`text-4xl font-bold tracking-tight ${
          accent ? "text-yellow-400" : "text-neutral-100"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-neutral-500 mt-1 tracking-widest uppercase">
        {label}
      </div>
    </div>
  );
}
