import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CaretStyle } from "../types";

interface WordProps {
  word: string;
  typed: string | undefined;
  /** 0 = upcoming, 1 = active, 2 = already passed */
  status: 0 | 1 | 2;
}

/** Memoised so a keystroke only re-renders the word you're on (and the one you just left). */
const Word = memo(function Word({ word, typed, status }: WordProps) {
  const t = typed ?? "";
  const len = Math.max(word.length, t.length);
  const letters = [];
  for (let i = 0; i < len; i++) {
    let cls = "tf-l";
    if (i < t.length) cls += i >= word.length ? " x" : t[i] === word[i] ? " c" : " e";
    letters.push(
      <span key={i} className={cls}>
        {i < word.length ? word[i] : t[i]}
      </span>
    );
  }
  const wrong = status === 2 && t !== word;
  return <div className={wrong ? "tf-w err" : "tf-w"}>{letters}</div>;
});

interface Props {
  words: string[];
  typed: string[];
  active: number;
  caret: CaretStyle;
  smooth: boolean;
  fontSize: number;
}

export function WordsView({ words, typed, active, caret, smooth, fontSize }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const blinkTimer = useRef(0);
  const [ready, setReady] = useState(false);
  const current = typed[active] ?? "";

  // The caret and scroll position are written straight to the DOM: no React
  // state, so moving them never triggers another render of the words.
  const layout = useCallback(() => {
    const box = boxRef.current;
    const c = caretRef.current;
    const wordEl = box?.children[active] as HTMLElement | undefined;
    if (!box || !c || !wordEl) return;

    const lineH = wordEl.offsetHeight || 1;
    const line = Math.round(wordEl.offsetTop / lineH);
    const scroll = Math.max(0, line - 1) * lineH; // keep the active line on row 2 of 3
    if (scroll !== scrollRef.current) {
      scrollRef.current = scroll;
      box.style.transform = `translateY(${-scroll}px)`;
    }

    const fs = parseFloat(getComputedStyle(box).fontSize) || 28;
    const letters = wordEl.children;
    let x: number;
    let w = fs * 0.6;
    if (letters.length === 0) {
      x = wordEl.offsetLeft;
    } else if (current.length < letters.length) {
      const l = letters[current.length] as HTMLElement;
      x = l.offsetLeft;
      w = l.offsetWidth;
    } else {
      const l = letters[letters.length - 1] as HTMLElement;
      x = l.offsetLeft + l.offsetWidth;
      w = l.offsetWidth;
    }

    const y = wordEl.offsetTop;
    let cw = 2;
    let ch = fs * 1.3;
    let cx = x - 1;
    let cy = y + (lineH - ch) / 2;
    if (caret === "block" || caret === "outline") {
      cw = w;
      cx = x;
    } else if (caret === "underline") {
      cw = w;
      ch = 3;
      cx = x;
      cy = y + lineH / 2 + fs * 0.55;
    }
    c.style.width = `${cw}px`;
    c.style.height = `${ch}px`;
    c.style.transform = `translate(${cx}px, ${cy}px)`;
  }, [active, current.length, caret]);

  useLayoutEffect(layout, [layout, words.length, fontSize]);

  // Steady while you type, blinking once you pause.
  useEffect(() => {
    const c = caretRef.current;
    if (!c) return;
    c.classList.remove("blink");
    window.clearTimeout(blinkTimer.current);
    blinkTimer.current = window.setTimeout(() => c.classList.add("blink"), 700);
    return () => window.clearTimeout(blinkTimer.current);
  }, [active, current]);

  // Re-measure when the window resizes or webfonts finish loading.
  useEffect(() => {
    window.addEventListener("resize", layout);
    void document.fonts?.ready.then(layout);
    const raf = requestAnimationFrame(() => setReady(true)); // enable caret animation after first paint
    return () => {
      window.removeEventListener("resize", layout);
      cancelAnimationFrame(raf);
    };
  }, [layout]);

  return (
    <div className="tf-viewport">
      <div ref={boxRef} className="tf-words">
        {words.map((w, i) => (
          <Word key={i} word={w} typed={typed[i]} status={i < active ? 2 : i === active ? 1 : 0} />
        ))}
        <div
          ref={caretRef}
          className="tf-caret blink"
          data-style={caret}
          data-smooth={smooth && ready ? "1" : undefined}
        />
      </div>
    </div>
  );
}
