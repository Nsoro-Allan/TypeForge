import { useTypingEngine } from "../hooks/useTypingEngine";
import type { TestConfig } from "../types";

interface Props {
  config: TestConfig;
}

export function TypingTest({ config }: Props) {
  const {
    currentWordIndex,
    typedWords,
    isFinished,
    timeElapsed,
    stats,
    characterStatuses,
    inputRef,
    handleKeyDown,
    resetTest,
  } = useTypingEngine(config);

  return (
    <div className="w-full max-w-3xl relative">
      {/* Hidden input */}
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

      {/* Stats */}
      <div className="flex justify-center gap-12 mb-14 font-mono">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-400">{stats.wpm}</div>
          <div className="text-xs text-neutral-500 mt-1 tracking-widest">wpm</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-neutral-100">{stats.accuracy}%</div>
          <div className="text-xs text-neutral-500 mt-1 tracking-widest">acc</div>
        </div>
        {config.mode === "time" && (
          <div className="text-center">
            <div className="text-4xl font-bold text-neutral-100">
              {Math.max(0, Math.ceil((config.duration || 30) - timeElapsed))}
            </div>
            <div className="text-xs text-neutral-500 mt-1 tracking-widest">time</div>
          </div>
        )}
      </div>

      {/* Words area */}
      <div
        className="text-[1.7rem] leading-[2.6rem] font-mono tracking-wide select-none"
        onClick={() => inputRef.current?.focus()}
      >
        {characterStatuses.map((wordChars, wordIdx) => {
          const isCurrentWord = wordIdx === currentWordIndex;
          const typedLength = (typedWords[wordIdx] || "").length;

          return (
            <span key={wordIdx} className="inline-block mr-3 relative">
              {wordChars.map((char, charIdx) => {
                let color = "text-neutral-600";
                if (char.status === "correct") color = "text-neutral-100";
                if (char.status === "incorrect") color = "text-red-500";
                if (char.status === "extra") color = "text-red-500/50";

                // Caret should appear at the current typing position
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

              {/* Caret at the end of the word if we finished typing it */}
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

      {/* Finished screen */}
      {isFinished && (
        <div className="mt-16 text-center animate-in fade-in">
          <div className="text-6xl font-bold text-yellow-400 mb-2">{stats.wpm}</div>
          <div className="text-neutral-400 text-lg mb-8">
            {stats.accuracy}% accuracy
          </div>
          <button
            onClick={resetTest}
            className="px-8 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition text-sm font-medium"
          >
            Restart (Tab)
          </button>
        </div>
      )}

      {!isFinished && !stats.wpm && (
        <p className="mt-14 text-center text-neutral-600 text-sm">
          start typing to begin
        </p>
      )}
    </div>
  );
}