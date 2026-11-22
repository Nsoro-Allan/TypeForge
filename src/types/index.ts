export type TestMode = "time" | "words" | "quote" | "zen" | "custom";
export type QuoteLength = "short" | "medium" | "long";
export type Wordlist = "english" | "code";
export type CaretStyle = "line" | "block" | "underline" | "outline";
export type SoundMode = "off" | "click" | "thock" | "pop";
export type View = "test" | "arcade" | "stats";

export interface TestConfig {
  mode: TestMode;
  duration: number; // seconds (time mode)
  wordCount: number; // words mode
  punctuation: boolean;
  numbers: boolean;
  quoteLength: QuoteLength;
  wordlist: Wordlist;
  customText: string;
}

export interface Quote {
  text: string;
  source: string;
}

/** One data point per second, used for the results chart + consistency. */
export interface Sample {
  t: number;
  wpm: number; // cumulative net wpm at this point
  raw: number; // raw wpm during this second
  errors: number; // incorrect keystrokes during this second
}

export interface TestStats {
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  time: number; // seconds
}

export interface TestResult extends TestStats {
  config: TestConfig;
  timestamp: number;
}

export interface PersonalBest {
  key: string;
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  timestamp: number;
}

export interface Settings {
  theme: string;
  fontSize: number; // rem
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  sound: SoundMode;
  volume: number; // 0..1
  gameSound: boolean;
  liveStats: boolean;
  stopOnError: boolean;
  confidence: boolean;
}

export type Difficulty = "easy" | "normal" | "hard";

export interface GameSummary {
  score: number;
  wave: number;
  kills: number;
  accuracy: number;
  wpm: number;
  maxCombo: number;
  difficulty: Difficulty;
  seconds: number;
  timestamp: number;
}
