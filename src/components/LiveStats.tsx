import type { TestConfig } from "../types";
import type { EngineState } from "../lib/engine";

interface Props {
  state: EngineState;
  config: TestConfig;
  showAdvanced: boolean;
}

/** Countdown / progress above the words, plus the thin progress bar. */
export function LiveStats({ state, config, showAdvanced }: Props) {
  const running = state.phase === "running";
  const finite = config.mode === "words" || config.mode === "quote" || config.mode === "custom";

  let primary: string;
  let pct = 0;
  if (config.mode === "time") {
    const left = running ? Math.max(0, Math.ceil(config.duration - state.elapsed)) : config.duration;
    primary = String(left);
    pct = running ? Math.min(100, (state.elapsed / config.duration) * 100) : 0;
  } else if (finite) {
    primary = `${state.active}/${state.words.length}`;
    pct = (state.active / Math.max(1, state.words.length)) * 100;
  } else {
    primary = `${Math.floor(state.elapsed)}s`;
  }

  return (
    <div className="mb-3">
      <div className={`flex h-12 items-baseline gap-6 font-mono transition-opacity duration-200 ${running ? "opacity-100" : "opacity-0"}`}>
        <span className="text-3xl text-main tabular-nums">{primary}</span>
        {showAdvanced && (
          <span className="text-xl text-sub tabular-nums">
            {Math.round(state.live.wpm)} wpm <span className="mx-1 opacity-50">·</span> {state.live.acc}%
          </span>
        )}
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-subalt">
        <div
          className="h-full bg-main"
          style={{
            width: `${pct}%`,
            transition: config.mode === "time" ? "width 1s linear" : "width 150ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
