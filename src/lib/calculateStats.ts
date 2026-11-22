import type { Sample, TestMode, TestStats } from "../types";

export interface CharCounts {
  correctWordChars: number; // chars in words that are 100% correct
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  spaces: number;
  correctSpaces: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Same accounting Monkeytype uses: only fully-correct words (plus the
 * in-progress last word, in time mode, if it is correct so far) count toward
 * net WPM, so mashing wrong letters can never inflate your score.
 *
 * Invariant: typed.length === active + 1 (typed[active] is the word in progress).
 */
export function countChars(
  words: string[],
  typed: string[],
  active: number,
  mode: TestMode
): CharCounts {
  let correctWordChars = 0;
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;
  let spaces = 0;
  let correctSpaces = 0;

  const upto = typed[active] === "" ? active : active + 1;

  for (let i = 0; i < upto; i++) {
    const input = typed[i] ?? "";
    const target = words[i] ?? "";
    const open = i === active; // no space typed after it yet

    if (input === target) {
      correctWordChars += target.length;
      correct += target.length;
    } else if (input.length >= target.length) {
      for (let c = 0; c < input.length; c++) {
        if (c < target.length) {
          if (input[c] === target[c]) correct++;
          else incorrect++;
        } else extra++;
      }
    } else {
      let ok = 0;
      let bad = 0;
      for (let c = 0; c < input.length; c++) {
        if (input[c] === target[c]) ok++;
        else bad++;
      }
      correct += ok;
      incorrect += bad;
      if (open && mode === "time") {
        if (bad === 0) correctWordChars += ok;
      } else {
        missed += target.length - input.length;
      }
    }

    if (!open) {
      spaces++;
      if (input === target) correctSpaces++;
    }
  }

  return { correctWordChars, correct, incorrect, extra, missed, spaces, correctSpaces };
}

/** Monkeytype's consistency: 100 means perfectly even speed, lower = more erratic. */
export function consistency(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 0;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const cov = Math.sqrt(variance) / mean;
  const k = 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
  return round2(Math.max(0, Math.min(100, k)));
}

export function computeStats(
  c: CharCounts,
  correctKeys: number,
  incorrectKeys: number,
  elapsed: number,
  samples: Sample[]
): TestStats {
  const minutes = Math.max(elapsed, 0.5) / 60;
  const wpm = (c.correctWordChars + c.correctSpaces) / 5 / minutes;
  const raw = (c.correct + c.incorrect + c.extra + c.spaces) / 5 / minutes;
  const keys = correctKeys + incorrectKeys;
  const acc = keys === 0 ? 100 : (correctKeys / keys) * 100;

  return {
    wpm: round2(wpm),
    raw: round2(raw),
    acc: round2(acc),
    consistency: consistency(samples.map((s) => s.raw)),
    correct: c.correct,
    incorrect: c.incorrect,
    extra: c.extra,
    missed: c.missed,
    time: round2(elapsed),
  };
}
