import type {
  Difficulty,
  GameSummary,
  PersonalBest,
  Settings,
  TestConfig,
  TestResult,
} from "../types";
import { DEFAULT_THEME } from "./themes";

const K = {
  history: "typeforge_v2_history",
  pbs: "typeforge_v2_personal_bests",
  settings: "typeforge_v2_settings",
  config: "typeforge_v2_config",
  game: "typeforge_v2_game_scores",
};
const MAX_HISTORY = 200;
const MAX_GAME_SCORES = 50;

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME,
  fontSize: 1.75,
  caretStyle: "line",
  smoothCaret: true,
  sound: "off",
  volume: 0.5,
  gameSound: true,
  liveStats: true,
  stopOnError: false,
  confidence: false,
};

export const DEFAULT_CONFIG: TestConfig = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
  quoteLength: "short",
  wordlist: "english",
  customText: "",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("TypeForge: could not persist", key, e);
  }
}

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(K.settings, {}) });
export const saveSettings = (s: Settings) => write(K.settings, s);
export const loadConfig = (): TestConfig => ({ ...DEFAULT_CONFIG, ...read<Partial<TestConfig>>(K.config, {}) });
export const saveConfig = (c: TestConfig) => write(K.config, c);

// --- typing history & personal bests ------------------------------------------------

/** Zen and custom text have no fair baseline, so they don't get personal bests. */
export function pbKey(c: TestConfig): string | null {
  let base: string;
  if (c.mode === "time") base = `time-${c.duration}`;
  else if (c.mode === "words") base = `words-${c.wordCount}`;
  else if (c.mode === "quote") return `quote-${c.quoteLength}`;
  else return null;
  if (c.punctuation) base += "+p";
  if (c.numbers) base += "+n";
  if (c.wordlist !== "english") base += `+${c.wordlist}`;
  return base;
}

export const getHistory = (): TestResult[] => read<TestResult[]>(K.history, []);
export const getPersonalBests = (): PersonalBest[] => read<PersonalBest[]>(K.pbs, []);

export function getBest(c: TestConfig): PersonalBest | null {
  const key = pbKey(c);
  return key ? getPersonalBests().find((p) => p.key === key) ?? null : null;
}

export function saveResult(r: TestResult): void {
  const history = getHistory();
  history.unshift(r);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  write(K.history, history);

  const key = pbKey(r.config);
  if (!key) return;
  const pbs = getPersonalBests();
  const idx = pbs.findIndex((p) => p.key === key);
  const candidate: PersonalBest = {
    key,
    wpm: r.wpm,
    raw: r.raw,
    acc: r.acc,
    consistency: r.consistency,
    timestamp: r.timestamp,
  };
  if (idx === -1) pbs.push(candidate);
  else if (r.wpm > pbs[idx].wpm) pbs[idx] = candidate;
  write(K.pbs, pbs);
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(K.history);
    localStorage.removeItem(K.pbs);
    localStorage.removeItem(K.game);
  } catch {
    /* ignore */
  }
}

// --- arcade ----------------------------------------------------------------------------

export const getGameScores = (): GameSummary[] => read<GameSummary[]>(K.game, []);

/** Stores a run and reports whether it beat the previous best for that difficulty. */
export function saveGameScore(s: GameSummary): boolean {
  const all = getGameScores();
  const prevBest = all.filter((g) => g.difficulty === s.difficulty).reduce((m, g) => Math.max(m, g.score), 0);
  all.unshift(s);
  if (all.length > MAX_GAME_SCORES) all.length = MAX_GAME_SCORES;
  write(K.game, all);
  return s.score > prevBest;
}

export function getGameBests(): Record<Difficulty, GameSummary | null> {
  const all = getGameScores();
  const best = (d: Difficulty) =>
    all.filter((g) => g.difficulty === d).sort((a, b) => b.score - a.score)[0] ?? null;
  return { easy: best("easy"), normal: best("normal"), hard: best("hard") };
}
