import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { PersonalBest, Quote, Settings, TestConfig } from "../types";
import { initialState, reducer } from "../lib/engine";
import type { EngineState } from "../lib/engine";
import { generateWords } from "../lib/words";
import { pickQuote } from "../lib/quotes";
import { getBest, pbKey, saveResult } from "../lib/storage";
import { playKey } from "../lib/sound";

interface Generated {
  words: string[];
  quote: Quote | null;
}

function makeTest(cfg: TestConfig, avoidQuote?: string): Generated {
  switch (cfg.mode) {
    case "time":
      return { words: generateWords(80, cfg), quote: null };
    case "words":
      return { words: generateWords(cfg.wordCount, cfg), quote: null };
    case "quote": {
      const q = pickQuote(cfg.quoteLength, avoidQuote);
      return { words: q.text.split(" "), quote: q };
    }
    case "custom": {
      const words = cfg.customText.trim().split(/\s+/).filter(Boolean);
      return { words: words.length ? words : generateWords(25, cfg), quote: null };
    }
    case "zen":
      return { words: [], quote: null };
  }
}

/** Changing any of these should start a fresh test. */
const configKey = (c: TestConfig) =>
  [c.mode, c.duration, c.wordCount, c.punctuation, c.numbers, c.quoteLength, c.wordlist, c.mode === "custom" ? c.customText : ""].join("|");

export interface PbInfo {
  isPb: boolean;
  prev: PersonalBest | null;
}

export function useTypingEngine(config: TestConfig, settings: Settings, enabled: boolean) {
  const [state, dispatch] = useReducer(reducer, config, (cfg): EngineState => {
    const g = makeTest(cfg);
    return initialState(g.words, g.quote, cfg.mode);
  });
  const [pb, setPb] = useState<PbInfo | null>(null);

  // Latest values for the long-lived listeners below.
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  const configRef = useRef(config);
  stateRef.current = state;
  settingsRef.current = settings;
  configRef.current = config;

  const initialWords = useRef(state.words);
  const savedFor = useRef(-1);

  const restart = useCallback((repeat = false) => {
    const cfg = configRef.current;
    const prev = stateRef.current;
    const g: Generated = repeat
      ? { words: initialWords.current, quote: prev.quote }
      : makeTest(cfg, prev.quote?.text);
    initialWords.current = g.words;
    dispatch({ type: "reset", words: g.words, quote: g.quote, mode: cfg.mode });
    setPb(null);
  }, []);

  // New test whenever the mode / options change (skip the very first run).
  const key = configKey(config);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    restart();
  }, [key, restart]);

  // Time mode is endless: keep the word stream topped up well ahead of the caret.
  useEffect(() => {
    if (config.mode === "time" && state.phase !== "finished" && state.words.length - state.active < 40) {
      dispatch({ type: "append", words: generateWords(60, config) });
    }
  }, [config, state.mode, state.phase, state.active, state.words.length]);

  // Clock: one sample per second, exact cut-off for time mode.
  useEffect(() => {
    if (state.phase !== "running") return;
    const startedAt = state.startedAt;
    const limit = configRef.current.mode === "time" ? configRef.current.duration : Infinity;
    let lastSecond = 0;
    const id = window.setInterval(() => {
      const el = (performance.now() - startedAt) / 1000;
      if (el >= limit) {
        window.clearInterval(id);
        dispatch({ type: "finish", elapsed: limit });
      } else if (Math.floor(el) > lastSecond) {
        lastSecond = Math.floor(el);
        dispatch({ type: "tick", elapsed: el });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [state.phase, state.startedAt, state.testId]);

  // Persist the result exactly once per test and work out personal-best status.
  useEffect(() => {
    if (state.phase !== "finished" || !state.result || savedFor.current === state.testId) return;
    savedFor.current = state.testId;
    const cfg = configRef.current;
    const res = state.result;
    const prev = getBest(cfg);
    if (res.time >= 1 && res.correct > 0) saveResult({ ...res, config: cfg, timestamp: Date.now() });
    setPb({ prev, isPb: pbKey(cfg) !== null && res.wpm > 0 && res.wpm > (prev?.wpm ?? 0) });
  }, [state.phase, state.result, state.testId]);

  // Keyboard input. Listening on window (not a hidden <input>) means you can
  // just start typing, exactly like Monkeytype.
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const st = settingsRef.current;
      const cfg = configRef.current;
      const target = e.target as HTMLElement | null;
      const onControl = !!target && (target.tagName === "BUTTON" || target.tagName === "A");

      if (e.key === "Tab") {
        e.preventDefault();
        if (!e.repeat) restart();
        return;
      }
      if (e.key === "Enter") {
        if (e.shiftKey && cfg.mode === "zen" && s.phase === "running") {
          e.preventDefault();
          dispatch({ type: "finish", elapsed: (performance.now() - s.startedAt) / 1000 });
        } else if (s.phase === "finished" && !onControl && !e.repeat) {
          e.preventDefault();
          restart();
        }
        return;
      }
      if (s.phase === "finished") return;

      const wordDelete = e.key === "Backspace" && (e.ctrlKey || e.altKey || e.metaKey);
      if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "backspace", word: wordDelete, confidence: st.confidence });
        return;
      }
      if (e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState("AltGraph"))) return;

      const isSpace = e.key === " ";
      if (!isSpace && e.key.length !== 1) return;
      e.preventDefault();
      if (onControl && target) target.blur(); // so Space can't "click" a focused button

      if (isSpace) {
        if (s.phase === "running" && s.typed[s.active] !== "") playKey(st.sound, st.volume, "key");
        dispatch({ type: "space", now: performance.now() });
        return;
      }
      const word = s.words[s.active];
      const ok = cfg.mode === "zen" || (word !== undefined && word[s.typed[s.active].length] === e.key);
      playKey(st.sound, st.volume, ok ? "key" : "error");
      dispatch({ type: "char", key: e.key, now: performance.now(), stopOnError: st.stopOnError });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, restart]);

  return { state, pb, restart };
}
