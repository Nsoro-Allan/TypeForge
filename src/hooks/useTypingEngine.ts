import { useState, useEffect, useCallback, useRef } from "react";
import { generateWords } from "../lib/words";
import type { TestConfig, TestStats, CharacterStatus } from "../types";

export function useTypingEngine(config: TestConfig) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [typedHistory, setTypedHistory] = useState<string[]>([]); // what user typed per word
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Generate words on config change or restart
  const resetTest = useCallback(() => {
    const wordCount =
      config.mode === "words"
        ? config.wordCount || 25
        : 100; // generate enough words for time mode

    setWords(generateWords(wordCount));
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setTypedHistory([]);
    setIsFinished(false);
    setIsStarted(false);
    setStartTime(null);
    setTimeElapsed(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Focus the hidden input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [config]);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Timer for time mode
  useEffect(() => {
    if (!isStarted || isFinished || config.mode !== "time") return;

    timerRef.current = window.setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 0.1;
        if (config.duration && newTime >= config.duration) {
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return config.duration;
        }
        return newTime;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, config]);

  // Calculate live stats
  const getStats = useCallback((): TestStats => {
    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let totalTyped = 0;

    typedHistory.forEach((typedWord, wordIdx) => {
      const original = words[wordIdx] || "";
      const minLen = Math.min(typedWord.length, original.length);

      for (let i = 0; i < minLen; i++) {
        if (typedWord[i] === original[i]) correctChars++;
        else incorrectChars++;
      }

      if (typedWord.length > original.length) {
        extraChars += typedWord.length - original.length;
      }

      totalTyped += typedWord.length;
    });

    // Current word being typed
    if (!isFinished && currentWordIndex < words.length) {
      const currentTyped = typedHistory[currentWordIndex] || "";
      const original = words[currentWordIndex] || "";
      const minLen = Math.min(currentTyped.length, original.length);

      for (let i = 0; i < minLen; i++) {
        if (currentTyped[i] === original[i]) correctChars++;
        else incorrectChars++;
      }
      if (currentTyped.length > original.length) {
        extraChars += currentTyped.length - original.length;
      }
      totalTyped += currentTyped.length;
    }

    const timeInMinutes = Math.max(timeElapsed / 60, 0.001);
    const wpm = Math.round((correctChars / 5) / timeInMinutes);
    const rawWpm = Math.round((totalTyped / 5) / timeInMinutes);
    const accuracy =
      totalTyped === 0
        ? 100
        : Math.round((correctChars / (correctChars + incorrectChars + extraChars)) * 100);

    return {
      wpm: isNaN(wpm) ? 0 : wpm,
      rawWpm: isNaN(rawWpm) ? 0 : rawWpm,
      accuracy: isNaN(accuracy) ? 100 : accuracy,
      correctChars,
      incorrectChars,
      extraChars,
      missedChars: 0,
      timeElapsed,
    };
  }, [typedHistory, words, currentWordIndex, timeElapsed, isFinished]);

  // Handle key presses
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isFinished) return;

      // Start the test on first key
      if (!isStarted) {
        setIsStarted(true);
        setStartTime(Date.now());
      }

      // Tab = restart
      if (e.key === "Tab") {
        e.preventDefault();
        resetTest();
        return;
      }

      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        setTypedHistory((prev) => {
          const newHistory = [...prev];
          const current = newHistory[currentWordIndex] || "";

          if (current.length > 0) {
            newHistory[currentWordIndex] = current.slice(0, -1);
            setCurrentCharIndex(current.length - 1);
          } else if (currentWordIndex > 0) {
            // Go back to previous word
            setCurrentWordIndex((i) => i - 1);
            const prevWord = newHistory[currentWordIndex - 1] || "";
            setCurrentCharIndex(prevWord.length);
          }
          return newHistory;
        });
        return;
      }

      // Space = next word
      if (e.key === " ") {
        e.preventDefault();

        setTypedHistory((prev) => {
          const newHistory = [...prev];
          // Ensure current word exists
          if (!newHistory[currentWordIndex]) {
            newHistory[currentWordIndex] = "";
          }
          return newHistory;
        });

        const nextIndex = currentWordIndex + 1;

        // Words mode finished?
        if (config.mode === "words" && nextIndex >= (config.wordCount || 25)) {
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        setCurrentWordIndex(nextIndex);
        setCurrentCharIndex(0);
        return;
      }

      // Regular character
      if (e.key.length === 1) {
        e.preventDefault();

        setTypedHistory((prev) => {
          const newHistory = [...prev];
          const current = newHistory[currentWordIndex] || "";
          newHistory[currentWordIndex] = current + e.key;
          setCurrentCharIndex(current.length + 1);
          return newHistory;
        });
      }
    },
    [isFinished, isStarted, currentWordIndex, config, resetTest]
  );

  // Build character status for rendering
  const getCharacterStatuses = useCallback((): CharacterStatus[][] => {
    return words.map((word, wordIdx) => {
      const typed = typedHistory[wordIdx] || "";
      const chars: CharacterStatus[] = [];

      for (let i = 0; i < Math.max(word.length, typed.length); i++) {
        const originalChar = word[i] || "";
        const typedChar = typed[i];

        if (typedChar === undefined) {
          chars.push({ char: originalChar, status: "pending" });
        } else if (i >= word.length) {
          chars.push({ char: typedChar, status: "extra" });
        } else if (typedChar === originalChar) {
          chars.push({ char: originalChar, status: "correct" });
        } else {
          chars.push({ char: originalChar, status: "incorrect" });
        }
      }

      return chars;
    });
  }, [words, typedHistory]);

  return {
    words,
    currentWordIndex,
    currentCharIndex,
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