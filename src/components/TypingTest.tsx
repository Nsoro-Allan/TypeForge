import { useTypingEngine } from "../hooks/useTypingEngine";
import type { TestConfig } from "../types";

interface Props {
  config: TestConfig;
}

export function TypingTest({ config }: Props) {
  const {
    currentWordIndex,
    isFinished,
    timeElapsed,
    stats,
    characterStatuses,
    inputRef,
    handleKeyDown,
    resetTest,
  } = useTypingEngine(config);

  return (
    <div className="w-full max-w-3xl">
      {/* Hidden input */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        onKeyDown={handleKeyDown}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Live Stats */}
      <div className="flex justify-center gap-10 mb-12 text-lg font-mono">
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400">{stats.wpm}</div>
          <div className="text-xs text-neutral-500 mt-1">wpm</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-neutral-200">{stats.accuracy}%</div>
          <div className="text-xs text-neutral-500 mt-1">acc</div>
        </div>
        {config.mode === "time" && (
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-200">
              {Math.max(0, Math.ceil((config.duration || 30) - timeElapsed))}
            </div>
            <div className="text-xs text-neutral-500 mt-1">time</div>
          </div>
        )}
      </div>

      {/* Words */}
      <div
        className="text-[1.65rem] leading-[2.4rem] font-mono tracking-wide select-none"
        onClick={() => inputRef.current?.focus()}
      >
        {characterStatuses.map((wordChars, wordIdx) => {
          const isCurrent = wordIdx === currentWordIndex;

          return (
            <span key={wordIdx} className="inline-block mr-3">
              {wordChars.map((char, charIdx) => {
                let className = "text-neutral-600"; // pending

                if (char.status === "correct") className = "text-neutral-100";
                if (char.status === "incorrect") className = "text-red-500";
                if (char.status === "extra") className = "text-red-500/60";

                // Caret position
                const isCaret =
                  isCurrent &&
                  !isFinished &&
                  charIdx ===
                    (wordChars.findIndex((c) => c.status === "pending") === -1
                      ? wordChars.length
                      : wordChars.findIndex((c) => c.status === "pending"));

                return (
                  <span key={charIdx} className={`relative ${className}`}>
                    {char.char === " " ? "\u00A0" : char.char}
                    {isCaret && (
                      <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-yellow-400 rounded-full" />
                    )}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      {/* Finished state */}
      {isFinished && (
        <div className="mt-16 text-center">
          <div className="text-5xl font-bold text-yellow-400 mb-2">{stats.wpm}</div>
          <div className="text-neutral-400 mb-8">
            {stats.accuracy}% accuracy
          </div>
          <button
            onClick={resetTest}
            className="px-8 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition text-sm"
          >
            Restart Test
          </button>
        </div>
      )}

      {!isFinished && (
        <div className="mt-12 text-center text-neutral-600 text-sm">
          click here or just start typing
        </div>
      )}
    </div>
  );
}