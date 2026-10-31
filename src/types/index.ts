export type TestMode = "time" | "words" | "quote" | "zen";

export type WordMode = "normal" | "punctuation" | "numbers" | "both";

export interface TestConfig {
  mode: TestMode;
  duration?: number;       // seconds (for time mode)
  wordCount?: number;      // for words mode
  wordMode?: WordMode;     // punctuation / numbers
  language?: string;
}

export interface CharacterStatus {
  char: string;
  status: "pending" | "correct" | "incorrect" | "extra";
}

export interface TestStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency?: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  timeElapsed: number; // in seconds
}

export interface TestResult extends TestStats {
  mode: TestMode;
  config: TestConfig;
  timestamp: number;
  wordsTyped: number;
  characters: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
}

export interface PersonalBest {
  wpm: number;
  accuracy: number;
  mode: TestMode;
  duration?: number;
  wordCount?: number;
  date: number;
}
