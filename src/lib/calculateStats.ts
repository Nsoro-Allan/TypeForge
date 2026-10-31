import type { TestStats, CharacterStatus } from "../types";

export function calculateStats(params: {
  characterStatuses: CharacterStatus[][];
  timeElapsed: number;
  isFinished: boolean;
}): TestStats {
  const { characterStatuses, timeElapsed } = params;

  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (const word of characterStatuses) {
    for (const char of word) {
      switch (char.status) {
        case "correct":
          correct++;
          break;
        case "incorrect":
          incorrect++;
          break;
        case "extra":
          extra++;
          break;
        case "pending":
          // only count as missed if the test is finished and this word was reached
          break;
      }
    }
  }

  const totalTyped = correct + incorrect + extra;
  const minutes = Math.max(timeElapsed / 60, 1 / 60); // avoid div by zero

  const wpm = Math.round(correct / 5 / minutes);
  const rawWpm = Math.round(totalTyped / 5 / minutes);
  const accuracy = totalTyped === 0 ? 100 : Math.round((correct / totalTyped) * 100);

  return {
    wpm: Number.isFinite(wpm) ? Math.max(0, wpm) : 0,
    rawWpm: Number.isFinite(rawWpm) ? Math.max(0, rawWpm) : 0,
    accuracy: Number.isFinite(accuracy) ? accuracy : 100,
    correctChars: correct,
    incorrectChars: incorrect,
    extraChars: extra,
    missedChars: missed,
    timeElapsed,
  };
}
