import type { Quote, Sample, TestMode, TestStats } from "../types";
import { computeStats, countChars } from "./calculateStats";

/**
 * Pure typing-test state machine. No timers, no randomness, no DOM: the hook
 * feeds it keystrokes and clock ticks, which keeps it easy to test and means
 * a re-render can never double-apply an input (the old engine skipped two
 * words on Backspace under StrictMode because it set state inside an updater).
 *
 * Invariant: typed.length === active + 1.
 */

export const MAX_EXTRA = 10;
const ZEN_WORD_LIMIT = 40;

export interface EngineState {
  testId: number;
  mode: TestMode;
  words: string[];
  typed: string[];
  active: number;
  quote: Quote | null;
  phase: "idle" | "running" | "finished";
  startedAt: number; // performance.now() of first keystroke
  elapsed: number; // seconds, refreshed once per second while running
  correctKeys: number;
  incorrectKeys: number;
  samples: Sample[];
  mark: { t: number; keys: number; errors: number };
  live: { wpm: number; acc: number };
  result: TestStats | null;
}

export type Action =
  | { type: "reset"; words: string[]; quote: Quote | null; mode: TestMode }
  | { type: "char"; key: string; now: number; stopOnError: boolean }
  | { type: "space"; now: number }
  | { type: "backspace"; word: boolean; confidence: boolean }
  | { type: "tick"; elapsed: number }
  | { type: "finish"; elapsed: number }
  | { type: "append"; words: string[] };

export function initialState(words: string[], quote: Quote | null, mode: TestMode, testId = 0): EngineState {
  return {
    testId,
    mode,
    words: mode === "zen" ? [""] : words,
    typed: [""],
    active: 0,
    quote,
    phase: "idle",
    startedAt: 0,
    elapsed: 0,
    correctKeys: 0,
    incorrectKeys: 0,
    samples: [],
    mark: { t: 0, keys: 0, errors: 0 },
    live: { wpm: 0, acc: 100 },
    result: null,
  };
}

const isFinite = (m: TestMode) => m === "words" || m === "quote" || m === "custom";

function buildSample(s: EngineState, elapsed: number, t: number): Sample {
  const c = countChars(s.words, s.typed, s.active, s.mode);
  const st = computeStats(c, s.correctKeys, s.incorrectKeys, elapsed, []);
  const dt = Math.max(elapsed - s.mark.t, 0.001);
  const keys = s.correctKeys + s.incorrectKeys;
  return {
    t,
    wpm: st.wpm,
    raw: Math.round(((keys - s.mark.keys) / dt) * 12 * 100) / 100,
    errors: s.incorrectKeys - s.mark.errors,
  };
}

function finish(s: EngineState, elapsed: number): EngineState {
  if (s.phase === "finished") return s;
  const samples =
    elapsed - s.mark.t >= 0.25 ? [...s.samples, buildSample(s, elapsed, Math.round(elapsed * 10) / 10)] : s.samples;
  const counts = countChars(s.words, s.typed, s.active, s.mode);
  const result = computeStats(counts, s.correctKeys, s.incorrectKeys, elapsed, samples);
  return {
    ...s,
    phase: "finished",
    elapsed,
    samples,
    result,
    live: { wpm: result.wpm, acc: result.acc },
  };
}

export function reducer(s: EngineState, a: Action): EngineState {
  switch (a.type) {
    case "reset":
      return initialState(a.words, a.quote, a.mode, s.testId + 1);

    case "append":
      return s.mode === "zen" ? s : { ...s, words: [...s.words, ...a.words] };

    case "tick": {
      if (s.phase !== "running") return s;
      const sample = buildSample(s, a.elapsed, Math.round(a.elapsed));
      const keys = s.correctKeys + s.incorrectKeys;
      return {
        ...s,
        elapsed: a.elapsed,
        samples: [...s.samples, sample],
        mark: { t: a.elapsed, keys, errors: s.incorrectKeys },
        live: { wpm: sample.wpm, acc: keys === 0 ? 100 : Math.round((s.correctKeys / keys) * 100) },
      };
    }

    case "finish":
      return s.phase === "running" ? finish(s, a.elapsed) : s;

    case "char": {
      if (s.phase === "finished") return s;
      const st: EngineState = s.phase === "idle" ? { ...s, phase: "running", startedAt: a.now } : s;
      const zen = st.mode === "zen";
      const cur = st.typed[st.active];
      const target = zen ? undefined : st.words[st.active];
      const limit = zen ? ZEN_WORD_LIMIT : (target?.length ?? 0) + MAX_EXTRA;
      if (cur.length >= limit) return st;

      const ok = zen || (target !== undefined && cur.length < target.length && target[cur.length] === a.key);
      if (!ok && a.stopOnError) return { ...st, incorrectKeys: st.incorrectKeys + 1 };

      const nextCur = cur + a.key;
      const typed = st.typed.slice();
      typed[st.active] = nextCur;
      let words = st.words;
      if (zen) {
        words = st.words.slice();
        words[st.active] = nextCur;
      }
      const next: EngineState = {
        ...st,
        typed,
        words,
        correctKeys: st.correctKeys + (ok ? 1 : 0),
        incorrectKeys: st.incorrectKeys + (ok ? 0 : 1),
      };
      // Finishing the last word correctly ends the test instantly, no trailing space needed.
      if (isFinite(st.mode) && st.active === st.words.length - 1 && nextCur === target) {
        return finish(next, (a.now - st.startedAt) / 1000);
      }
      return next;
    }

    case "space": {
      if (s.phase !== "running") return s;
      const cur = s.typed[s.active];
      if (cur === "") return s;
      const zen = s.mode === "zen";
      const ok = zen || cur === s.words[s.active];
      const base: EngineState = {
        ...s,
        correctKeys: s.correctKeys + (ok ? 1 : 0),
        incorrectKeys: s.incorrectKeys + (ok ? 0 : 1),
      };
      if (isFinite(s.mode) && s.active === s.words.length - 1) {
        return finish(base, (a.now - s.startedAt) / 1000);
      }
      return {
        ...base,
        active: s.active + 1,
        typed: [...s.typed, ""],
        words: zen ? [...s.words, ""] : s.words,
      };
    }

    case "backspace": {
      if (s.phase !== "running") return s;
      const cur = s.typed[s.active];
      const zen = s.mode === "zen";
      if (cur.length > 0) {
        const nextCur = a.word ? "" : cur.slice(0, -1);
        const typed = s.typed.slice();
        typed[s.active] = nextCur;
        let words = s.words;
        if (zen) {
          words = s.words.slice();
          words[s.active] = nextCur;
        }
        return { ...s, typed, words };
      }
      // Empty word: step back, but (like Monkeytype) only into a word you got wrong.
      if (s.active === 0 || a.confidence) return s;
      if (!zen && s.typed[s.active - 1] === s.words[s.active - 1]) return s;
      return {
        ...s,
        active: s.active - 1,
        typed: s.typed.slice(0, s.active),
        words: zen ? s.words.slice(0, s.active) : s.words,
      };
    }
  }
}
