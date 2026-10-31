import type { TestStats, TestConfig } from "../types";
import { getBestForConfig } from "../lib/storage";

interface Props {
  stats: TestStats;
  config: TestConfig;
  onRestart: () => void;
}

export function Results({ stats, config, onRestart }: Props) {
  const pb = getBestForConfig(config.mode, config.duration, config.wordCount);
  const isNewPb = pb ? stats.wpm > pb.wpm : stats.wpm > 0;

  return (
    <div className="mt-12 text-center animate-in fade-in duration-300">
      {/* Big WPM */}
      <div className="text-7xl font-bold text-yellow-400 tracking-tighter mb-1">
        {stats.wpm}
      </div>
      <div className="text-neutral-500 text-sm tracking-widest uppercase mb-2">
        words per minute
      </div>

      {isNewPb && (
        <div className="inline-block mb-6 px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-medium tracking-wide">
          New personal best
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-md mx-auto mb-10 mt-6">
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Raw" value={`${stats.rawWpm}`} />
        <Stat label="Correct" value={String(stats.correctChars)} />
        <Stat
          label="Errors"
          value={String(stats.incorrectChars + stats.extraChars)}
        />
      </div>

      {/* Personal best comparison */}
      {pb && (
        <div className="text-sm text-neutral-500 mb-8">
          Previous best:{" "}
          <span className="text-neutral-300 font-medium">{pb.wpm} wpm</span>
          <span className="mx-1.5 text-neutral-600">·</span>
          {pb.accuracy}% accuracy
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRestart}
          className="px-8 py-2.5 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 rounded-lg transition text-sm font-medium border border-yellow-500/25"
        >
          Restart (Tab)
        </button>
      </div>

      <p className="mt-8 text-neutral-600 text-xs">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
          Tab
        </kbd>{" "}
        or click Restart
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-neutral-100 font-mono">
        {value}
      </div>
      <div className="text-[11px] text-neutral-500 tracking-widest uppercase mt-1">
        {label}
      </div>
    </div>
  );
}
