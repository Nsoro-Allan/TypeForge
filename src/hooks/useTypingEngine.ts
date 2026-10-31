import { useState, useEffect, useCallback, useRef } from "react";
import { generateWords, getRandomQuote } from "../lib/words";
import { saveResult } from "../lib/storage";
import type {
  TestConfig,
  TestStats,
  CharacterStatus,
  TestResult,
  WordMode,
} from "../types";

export function useTypingEngine(config: TestConfig) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasSavedRef = useRef(false);

  const resetTest = useCallback(() => {
    let newWords: string[];

    if (config.mode === "quote") {
      const quote = getRandomQuote();
      newWords = quote.split(" ");
    } else if (config.mode === "zen") {
      // Generate a long stream for zen
      newWords = generateWords(200, (config.wordMode as WordMode) || "normal");
    } else {
      const count =
        config.mode === "words" ? config.wordCount || 25 : 100;
      newWords = generateWords(
        count,
        (config.wordMode as WordMode) || "normal"
      );
    }

    setWords(newWords);
    setCurrentWordIndex(0);
    setTypedWords([]);
    setIsFinished(false);
    setIsStarted(false);
    setTimeElapsed(0);
    startTimeRef.current = null;
    hasSavedRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeout(() => inputRef.current?.focus(), 20);
  }, [config]);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Timer
  useEffect(() => {
    if (!isStarted || isFinished) return;

    timerRef.current = window.setInterval(() => {
      if (!startTimeRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTimeElapsed(elapsed);

      if (
        config.mode === "time" &&
        config.duration &&
        elapsed >= config.duration
      ) {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, config]);

  // Save result once when finished
  useEffect(() => {
    if (isFinished && !hasSavedRef.current && isStarted) {
      hasSavedRef.current = true;
      const stats = getStats();

      const result: TestResult = {
        ...stats,
        mode: config.mode,
        config,
        timestamp: Date.now(),
        wordsTyped: currentWordIndex + (typedWords[currentWordIndex] ? 1 : 0),
        characters: {
          correct: stats.correctChars,
          incorrect: stats.incorrectChars,
          extra: stats.extraChars,
          missed: stats.missedChars,
        },
      };

      saveResult(result);
    }
  }, [isFinished]);

  const getStats = useCallback((): TestStats => {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;

    typedWords.forEach((typed, i) => {
      const original = words[i] || "";
      const len = Math.min(typed.length, original.length);

      for (let j = 0; j < len; j++) {
        if (typed[j] === original[j]) correct++;
        else incorrect++;
      }

      if (typed.length > original.length) {
        extra += typed.length - original.length;
      }
    });

    // Include the current word being typed (if not finished)
    if (!isFinished && currentWordIndex < words.length) {
      const typed = typedWords[currentWordIndex] || "";
      const original = words[currentWordIndex] || "";
      const len = Math.min(typed.length, original.length);

      for (let j = 0; j < len; j++) {
        if (typed[j] === original[j]) correct++;
        else incorrect++;
      }
      if (typed.length > original.length) {
        extra += typed.length - original.length;
      }
    }

    const totalTyped = correct + incorrect + extra;
    const minutes = Math.max(timeElapsed / 60, 1 / 60);

    const wpm = Math.round(correct / 5 / minutes);
    const rawWpm = Math.round(totalTyped / 5 / minutes);
    const accuracy =
      totalTyped === 0 ? 100 : Math.round((correct / totalTyped) * 100);

    return {
      wpm: Number.isFinite(wpm) ? Math.max(0, wpm) : 0,
      rawWpm: Number.isFinite(rawWpm) ? Math.max(0, rawWpm) : 0,
      accuracy: Number.isFinite(accuracy) ? accuracy : 100,
      correctChars: correct,
      incorrectChars: incorrect,
      extraChars: extra,
      missedChars: 0,
      timeElapsed,
    };
  }, [typedWords, words, currentWordIndex, timeElapsed, isFinished]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isFinished) {
        if (e.key === "Tab") {
          e.preventDefault();
          resetTest();
        }
        return;
      }

      // Start timer on first real key
      if (!isStarted && e.key.length === 1) {
        setIsStarted(true);
        startTimeRef.current = Date.now();
      }

      // Tab = restart
      if (e.key === "Tab") {
        e.preventDefault();
        resetTest();
        return;
      }

      // Escape can also restart in zen or finished
      if (e.key === "Escape") {
        e.preventDefault();
        resetTest();
        return;
      }

      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();

        setTypedWords((prev) => {
          const next = [...prev];
          const current = next[currentWordIndex] || "";

          if (current.length > 0) {
            next[currentWordIndex] = current.slice(0, -1);
            return next;
          }

          // Go back to previous word if current is empty
          if (currentWordIndex > 0) {
            setCurrentWordIndex((i) => i - 1);
          }
          return next;
        });
        return;
      }

      // Space → next word
      if (e.key === " ") {
        e.preventDefault();

        const currentTyped = typedWords[currentWordIndex] || "";
        if (currentTyped.length === 0) return;

        const nextIndex = currentWordIndex + 1;

        // Words mode completion
        if (
          config.mode === "words" &&
          nextIndex >= (config.wordCount || 25)
        ) {
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        // Quote mode completion
        if (config.mode === "quote" && nextIndex >= words.length) {
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        // Zen: keep going, generate more words if needed
        if (config.mode === "zen" && nextIndex >= words.length - 20) {
          setWords((prev) => [
            ...prev,
            ...generateWords(50, (config.wordMode as WordMode) || "normal"),
          ]);
        }

        setCurrentWordIndex(nextIndex);
        return;
      }

      // Normal character
      if (e.key.length === 1) {
        e.preventDefault();

        setTypedWords((prev) => {
          const next = [...prev];
          const current = next[currentWordIndex] || "";
          // Limit extra characters
          if (current.length < (words[currentWordIndex]?.length || 0) + 8) {
            next[currentWordIndex] = current + e.key;
          }
          return next;
        });
      }
    },
    [
      isFinished,
      isStarted,
      currentWordIndex,
      typedWords,
      words,
      config,
      resetTest,
    ]
  );

  // Build character statuses for rendering
  const getCharacterStatuses = useCallback((): CharacterStatus[][] => {
    return words.map((word, wordIdx) => {
      const typed = typedWords[wordIdx] || "";
      const result: CharacterStatus[] = [];
      const maxLen = Math.max(word.length, typed.length);

      for (let i = 0; i < maxLen; i++) {
        const originalChar = word[i];
        const typedChar = typed[i];

        if (typedChar === undefined) {
          result.push({ char: originalChar, status: "pending" });
        } else if (i >= word.length) {
          result.push({ char: typedChar, status: "extra" });
        } else if (typedChar === originalChar) {
          result.push({ char: originalChar, status: "correct" });
        } else {
          result.push({ char: originalChar, status: "incorrect" });
        }
      }

      return result;
    });
  }, [words, typedWords]);

  return {
    words,
    currentWordIndex,
    typedWords,
    isStarted,
    isFinished,
    timeElapsed,
    stats: getStats(),
    characterStatuses: getCharacterStatuses(),
    inputRef,
    handleKeyDown,
    resetTest,
  };
}
