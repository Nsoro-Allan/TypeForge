import { useTypingEngine } from "../hooks/useTypingEngine";
import { StatsBar } from "./StatsBar";
import { Results } from "./Results";
import type { TestConfig } from "../types";

interface Props {
  config: TestConfig;
}

export function TypingTest({ config }: Props) {
  const {
    currentWordIndex,
    typedWords,
    isFinished,
    isStarted,
    timeElapsed,
    stats,
    characterStatuses,
    inputRef,
    handleKeyDown,
    resetTest,
  } = useTypingEngine(config);

  return (
    <div className="w-full max-w-3xl relative">
      {/* Hidden input that captures keystrokes */}
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Live stats */}
      <StatsBar
        stats={stats}
        config={config}
        timeElapsed={timeElapsed}
        isStarted={isStarted}
        isFinished={isFinished}
      />

      {/* Words area (hidden when finished) */}
      {!isFinished && (
        <div
          className="text-[1.7rem] leading-[2.6rem] font-mono tracking-wide select-none"
          onClick={() => inputRef.current?.focus()}
        >
          {characterStatuses.map((wordChars, wordIdx) => {
            const isCurrentWord = wordIdx === currentWordIndex;
            const typedLength = (typedWords[wordIdx] || "").length;

            // Only render words that are near the current position (performance + cleaner look)
            if (wordIdx < currentWordIndex - 2) return null;
            if (wordIdx > currentWordIndex + 40) return null;

            return (
              <span key={wordIdx} className="inline-block mr-3 relative">
                {wordChars.map((char, charIdx) => {
                  let color = "text-neutral-600";
                  if (char.status === "correct") color = "text-neutral-100";
                  if (char.status === "incorrect") color = "text-red-500";
                  if (char.status === "extra") color = "text-red-500/50";

                  const showCaret =
                    isCurrentWord &&
                    !isFinished &&
                    charIdx === typedLength;

                  return (
                    <span key={charIdx} className={`relative ${color}`}>
                      {char.char === " " ? "\u00A0" : char.char}

                      {showCaret && (
                        <span className="absolute left-0 top-[2px] bottom-[2px] w-[2.5px] bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </span>
                  );
                })}

                {/* Caret at the end of the word */}
                {isCurrentWord &&
                  !isFinished &&
                  typedLength >= wordChars.length && (
                    <span className="relative inline-block w-0">
                      <span className="absolute left-0 top-[2px] bottom-[2px] w-[2.5px] bg-yellow-400 rounded-full animate-pulse" />
                    </span>
                  )}
              </span>
            );
          })}
        </div>
      )}

      {/* Finished screen */}
      {isFinished && (
        <Results stats={stats} config={config} onRestart={resetTest} />
      )}

      {/* Prompt before starting */}
      {!isFinished && !isStarted && (
        <p className="mt-14 text-center text-neutral-600 text-sm">
          start typing to begin
        </p>
      )}
    </div>
  );
}
