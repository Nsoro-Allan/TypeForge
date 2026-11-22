import { useEffect, useState } from "react";
import type { TestConfig } from "../types";
import { useSettings } from "../hooks/useSettings";
import { useTypingEngine } from "../hooks/useTypingEngine";
import { LiveStats } from "./LiveStats";
import { Results } from "./Results";
import { RestartIcon } from "./icons";
import { WordsView } from "./WordsView";

interface Props {
  config: TestConfig;
  enabled: boolean;
  onRunningChange: (running: boolean) => void;
}

export function TypingTest({ config, enabled, onRunningChange }: Props) {
  const { settings } = useSettings();
  const { state, pb, restart } = useTypingEngine(config, settings, enabled);
  const running = state.phase === "running";

  useEffect(() => {
    onRunningChange(running);
  }, [running, onRunningChange]);
  useEffect(() => () => onRunningChange(false), [onRunningChange]);

  // Like Monkeytype: dim the words and say so when the window loses focus.
  const [focused, setFocused] = useState(() => document.hasFocus());
  useEffect(() => {
    const on = () => setFocused(true);
    const off = () => setFocused(false);
    window.addEventListener("focus", on);
    window.addEventListener("blur", off);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", off);
    };
  }, []);

  if (state.phase === "finished" && state.result) {
    return (
      <Results
        stats={state.result}
        samples={state.samples}
        config={config}
        quote={state.quote}
        pb={pb}
        onNext={() => restart(false)}
        onRepeat={() => restart(true)}
      />
    );
  }

  const dim = enabled && !focused;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6">
      <LiveStats state={state} config={config} showAdvanced={settings.liveStats} />

      <div className="relative">
        <div className={`transition duration-150 ${dim ? "blur-[5px] opacity-50" : ""}`}>
          <WordsView
            key={state.testId}
            words={state.words}
            typed={state.typed}
            active={state.active}
            caret={settings.caretStyle}
            smooth={settings.smoothCaret}
            fontSize={settings.fontSize}
          />
        </div>
        {dim && (
          <div className="absolute inset-0 flex items-center justify-center text-fg" onMouseDown={() => window.focus()}>
            click here or press any key to focus
          </div>
        )}
      </div>

      <div className="mt-10 flex h-10 flex-col items-center gap-3 text-sm text-sub">
        <button
          onClick={() => restart(false)}
          title="restart test (tab)"
          aria-label="restart test"
          className={`rounded-lg p-2 text-sub transition hover:bg-subalt hover:text-fg ${running ? "opacity-0" : ""}`}
        >
          <RestartIcon />
        </button>
        {!running && state.phase === "idle" && <span className="sr-only">start typing to begin</span>}
      </div>
    </div>
  );
}
