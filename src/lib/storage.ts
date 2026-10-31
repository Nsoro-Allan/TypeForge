import type { TestResult, PersonalBest, TestMode } from "../types";

const HISTORY_KEY = "typeforge_history";
const PBS_KEY = "typeforge_personal_bests";
const MAX_HISTORY = 100;

export function saveResult(result: TestResult): void {
  try {
    const history = getHistory();
    history.unshift(result);
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    updatePersonalBests(result);
  } catch (e) {
    console.warn("Failed to save result", e);
  }
}

export function getHistory(): TestResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(PBS_KEY);
}

export function getPersonalBests(): PersonalBest[] {
  try {
    const raw = localStorage.getItem(PBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function updatePersonalBests(result: TestResult): void {
  const pbs = getPersonalBests();
  const key = makePbKey(result.mode, result.config);

  const existingIdx = pbs.findIndex(
    (pb) => makePbKey(pb.mode, { duration: pb.duration, wordCount: pb.wordCount }) === key
  );

  const candidate: PersonalBest = {
    wpm: result.wpm,
    accuracy: result.accuracy,
    mode: result.mode,
    duration: result.config.duration,
    wordCount: result.config.wordCount,
    date: result.timestamp,
  };

  if (existingIdx === -1) {
    pbs.push(candidate);
  } else if (result.wpm > pbs[existingIdx].wpm) {
    pbs[existingIdx] = candidate;
  }

  localStorage.setItem(PBS_KEY, JSON.stringify(pbs));
}

function makePbKey(mode: TestMode, config: { duration?: number; wordCount?: number }): string {
  if (mode === "time") return `time-${config.duration ?? 30}`;
  if (mode === "words") return `words-${config.wordCount ?? 25}`;
  return mode;
}

export function getBestForConfig(mode: TestMode, duration?: number, wordCount?: number): PersonalBest | null {
  const pbs = getPersonalBests();
  const key = makePbKey(mode, { duration, wordCount });
  return pbs.find((pb) => makePbKey(pb.mode, { duration: pb.duration, wordCount: pb.wordCount }) === key) ?? null;
}
