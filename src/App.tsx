import { useState } from "react";
import { TypingTest } from "./components/TypingTest";
import type { TestConfig, TestMode } from "./types";

function App() {
  const [mode, setMode] = useState<TestMode>("time");
  const [duration, setDuration] = useState(30);
  const [wordCount, setWordCount] = useState(25);

  const config: TestConfig = {
    mode,
    duration: mode === "time" ? duration : undefined,
    wordCount: mode === "words" ? wordCount : undefined,
  };

  return (
    <div className="min-h-screen bg-[#111111] text-neutral-200 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-neutral-800">
        <h1 className="text-2xl font-semibold tracking-tight">
          Type<span className="text-yellow-400">Forge</span>
        </h1>

        <div className="text-sm text-neutral-500">
          Tab to restart
        </div>
      </header>

      {/* Mode Selector */}
      <div className="flex justify-center gap-6 mt-10 mb-8">
        {/* Mode switch */}
        <div className="flex bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => setMode("time")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${
              mode === "time"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            time
          </button>
          <button
            onClick={() => setMode("words")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${
              mode === "words"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            words
          </button>
        </div>

        {/* Duration / Word count options */}
        {mode === "time" ? (
          <div className="flex bg-neutral-900 rounded-lg p-1">
            {[15, 30, 60, 120].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
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
        ) : (
          <div className="flex bg-neutral-900 rounded-lg p-1">
            {[10, 25, 50, 100].map((w) => (
              <button
                key={w}
                onClick={() => setWordCount(w)}
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
      </div>

      {/* Main typing area */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <TypingTest config={config} key={`${mode}-${duration}-${wordCount}`} />
      </main>
    </div>
  );
}

export default App;