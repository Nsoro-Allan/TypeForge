export type TestMode = "time" | "words";

export interface TestConfig {
  mode: TestMode;
  duration?: number; // seconds (for time mode)
  wordCount?: number; // for words mode
}

export interface CharacterStatus {
  char: string;
  status: "pending" | "correct" | "incorrect" | "extra";
}

export interface TestStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
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
}