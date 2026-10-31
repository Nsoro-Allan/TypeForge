import { useState } from "react";
import { TypingTest } from "./components/TypingTest";
import { ModeSelector } from "./components/ModeSelector";
import type { TestConfig, TestMode, WordMode } from "./types";

function App() {
  const [mode, setMode] = useState<TestMode>("time");
  const [duration, setDuration] = useState(30);
  const [wordCount, setWordCount] = useState(25);
  const [wordMode, setWordMode] = useState<WordMode>("normal");

  const config: TestConfig = {
    mode,
    duration: mode === "time" ? duration : undefined,
    wordCount: mode === "words" ? wordCount : undefined,
    wordMode: mode === "time" || mode === "words" ? wordMode : "normal",
  };

  return (
    <div className="min-h-screen bg-[#111111] text-neutral-200 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-800">
        <h1 className="text-2xl font-semibold tracking-tight">
          Type<span className="text-yellow-400">Forge</span>
        </h1>

        <div className="text-sm text-neutral-500 hidden sm:block">
          Tab to restart · Esc to reset
        </div>
      </header>

      {/* Mode Selector */}
      <div className="flex justify-center mt-8 mb-6 px-4">
        <ModeSelector
          mode={mode}
          duration={duration}
          wordCount={wordCount}
          wordMode={wordMode}
          onModeChange={setMode}
          onDurationChange={setDuration}
          onWordCountChange={setWordCount}
          onWordModeChange={setWordMode}
        />
      </div>

      {/* Main typing area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-20">
        <TypingTest
          config={config}
          key={`${mode}-${duration}-${wordCount}-${wordMode}`}
        />
      </main>
    </div>
  );
}

export default App;
