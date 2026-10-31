import type { TestMode, WordMode } from "../types";

interface Props {
  mode: TestMode;
  duration: number;
  wordCount: number;
  wordMode: WordMode;
  onModeChange: (mode: TestMode) => void;
  onDurationChange: (duration: number) => void;
  onWordCountChange: (count: number) => void;
  onWordModeChange: (wordMode: WordMode) => void;
}

export function ModeSelector({
  mode,
  duration,
  wordCount,
  wordMode,
  onModeChange,
  onDurationChange,
  onWordCountChange,
  onWordModeChange,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Primary mode: time / words / quote / zen */}
      <div className="flex bg-neutral-900 rounded-lg p-1">
        {(
          [
            { id: "time", label: "time" },
            { id: "words", label: "words" },
            { id: "quote", label: "quote" },
            { id: "zen", label: "zen" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-4 py-1.5 rounded-md text-sm transition ${
              mode === m.id
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Duration / Word count (only for time & words) */}
      {mode === "time" && (
        <div className="flex bg-neutral-900 rounded-lg p-1">
          {[15, 30, 60, 120].map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                duration === d
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {mode === "words" && (
        <div className="flex bg-neutral-900 rounded-lg p-1">
          {[10, 25, 50, 100].map((w) => (
            <button
              key={w}
              onClick={() => onWordCountChange(w)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                wordCount === w
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {/* Punctuation / Numbers toggles */}
      {(mode === "time" || mode === "words") && (
        <div className="flex bg-neutral-900 rounded-lg p-1">
          {(
            [
              { id: "normal", label: "abc" },
              { id: "punctuation", label: "!?" },
              { id: "numbers", label: "123" },
              { id: "both", label: "!23" },
            ] as const
          ).map((wm) => (
            <button
              key={wm.id}
              onClick={() => onWordModeChange(wm.id)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                wordMode === wm.id
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title={
                wm.id === "normal"
                  ? "Normal words"
                  : wm.id === "punctuation"
                  ? "Punctuation"
                  : wm.id === "numbers"
                  ? "Numbers"
                  : "Punctuation + Numbers"
              }
            >
              {wm.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
