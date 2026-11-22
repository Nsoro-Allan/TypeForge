import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Difficulty, GameSummary } from "../types";
import { useSettings } from "../hooks/useSettings";
import { getGameBests, saveGameScore } from "../lib/storage";
import { playSfx } from "../lib/sound";
import { VoidDefender, H, W } from "./engine";
import type { Palette, Phase } from "./engine";

const DIFFS: { id: Difficulty; label: string; hint: string }[] = [
  { id: "easy", label: "easy", hint: "slower ships, tougher hull" },
  { id: "normal", label: "normal", hint: "the intended experience" },
  { id: "hard", label: "hard", hint: "fast ships, fragile hull" },
];

/** The game is always drawn on a dark field, so a dark theme accent (e.g. "paper") would vanish. */
function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  let accent = cs.getPropertyValue("--tf-main").trim() || "#facc15";
  const m = /^#([0-9a-f]{6})$/i.exec(accent);
  if (m) {
    const n = parseInt(m[1], 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    if (lum < 0.35) accent = "#facc15";
  }
  return { accent, error: cs.getPropertyValue("--tf-error").trim() || "#ef4444" };
}

export function GameView({ active }: { active: boolean }) {
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<VoidDefender | null>(null);

  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [result, setResult] = useState<{ s: GameSummary; best: boolean } | null>(null);
  const [bests, setBests] = useState(getGameBests);
  const accent = useMemo(() => readPalette().accent, [settings.theme]);

  // Latest values for listeners that live for the lifetime of the view.
  const settingsRef = useRef(settings);
  const activeRef = useRef(active);
  const phaseRef = useRef(phase);
  const diffRef = useRef(difficulty);
  settingsRef.current = settings;
  activeRef.current = active;
  phaseRef.current = phase;
  diffRef.current = difficulty;

  const start = useCallback(() => {
    setResult(null);
    gameRef.current?.start(diffRef.current, readPalette());
  }, []);

  // Game loop + canvas sizing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const game = new VoidDefender(
      {
        onPhase: (p, summary) => {
          setPhase(p);
          if (p === "over" && summary) {
            const best = summary.score > 0 && saveGameScore(summary); // 0-point runs aren't worth recording
            setResult({ s: summary, best });
            setBests(getGameBests());
          }
        },
        onSfx: (kind, param) => {
          const st = settingsRef.current;
          if (st.gameSound) playSfx(kind, st.volume, param);
        },
      },
      readPalette()
    );
    gameRef.current = game;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.getBoundingClientRect().width * dpr));
      const h = Math.round((w * H) / W);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      game.update((now - last) / 1000);
      last = now;
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      game.render(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onBlur = () => game.pause();
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("blur", onBlur);
      gameRef.current = null;
    };
  }, []);

  // Pause whenever a dialog opens on top of the game.
  useEffect(() => {
    if (!active) gameRef.current?.pause();
  }, [active]);

  // Keep the in-game colours in sync with the theme.
  useEffect(() => {
    gameRef.current?.setPalette(readPalette());
  }, [settings.theme]);

  // Keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g || !activeRef.current || e.ctrlKey || e.metaKey || e.altKey) return;
      const ph = phaseRef.current;

      if (ph === "playing") {
        if (e.key === "Escape") {
          e.preventDefault();
          g.pause();
        } else {
          if (e.key === " " || e.key === "Tab" || e.key === "'" || e.key === "/") e.preventDefault();
          g.key(e.key);
        }
      } else if (ph === "paused") {
        if (e.key === "Escape" || e.key === "Enter") {
          e.preventDefault();
          g.resume();
        } else if (e.key.toLowerCase() === "q") g.toMenu();
      } else {
        if (e.key === "1") setDifficulty("easy");
        else if (e.key === "2") setDifficulty("normal");
        else if (e.key === "3") setDifficulty("hard");
        else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const order: Difficulty[] = ["easy", "normal", "hard"];
          const i = order.indexOf(diffRef.current) + (e.key === "ArrowRight" ? 1 : -1);
          setDifficulty(order[Math.max(0, Math.min(2, i))]);
        } else if (e.key === "Enter") {
          e.preventDefault();
          start();
        } else if (e.key.toLowerCase() === "m" && ph === "over") g.toMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  return (
    <div className="flex w-full flex-col items-center px-4 pb-6 tf-fade">
      <div
        className="relative overflow-hidden rounded-2xl border border-sub/25 shadow-2xl"
        style={{ width: "min(100%, calc((100vh - 11rem) * 1.5625))", "--ga": accent } as CSSProperties}
      >
        <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: `${W} / ${H}` }} aria-label="Void Defender game field" />

        {phase === "menu" && (
          <Overlay>
            <div className="text-xs tracking-[0.35em] text-[color:var(--ga)]">ARCADE</div>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">VOID DEFENDER</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Alien ships are descending. Type the first letter of a ship to lock on, then finish its word to blow it up
              before it reaches you.
            </p>

            <div className="mt-6 grid w-full max-w-lg grid-cols-3 gap-2">
              {DIFFS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    difficulty === d.id
                      ? "border-[color:var(--ga)] bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-medium text-white">
                    {d.label}
                    <span className="text-[10px] text-slate-400">{i + 1}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-tight text-slate-400">{d.hint}</div>
                  <div className="mt-2 font-mono text-xs text-[color:var(--ga)]">
                    {bests[d.id] ? `best ${bests[d.id]!.score.toLocaleString()}` : "—"}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={start}
              className="mt-6 rounded-xl bg-[color:var(--ga)] px-8 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              launch · enter
            </button>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-400">
              <span>type letters to shoot</span>
              <span>enter = shockwave when charged</span>
              <span>esc = pause</span>
            </div>
          </Overlay>
        )}

        {phase === "paused" && (
          <Overlay>
            <h2 className="text-4xl font-extrabold text-white">PAUSED</h2>
            <div className="mt-6 flex gap-3">
              <button onClick={() => gameRef.current?.resume()} className="rounded-xl bg-[color:var(--ga)] px-6 py-2.5 text-sm font-bold text-black">
                resume · esc
              </button>
              <button onClick={() => gameRef.current?.toMenu()} className="rounded-xl bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/20">
                quit · q
              </button>
            </div>
          </Overlay>
        )}

        {phase === "over" && result && (
          <Overlay>
            <div className="text-xs tracking-[0.35em] text-red-400">HULL BREACHED</div>
            <div className="mt-2 font-mono text-6xl font-bold text-white">{result.s.score.toLocaleString()}</div>
            {result.best && (
              <div className="mt-2 rounded-full bg-[color:var(--ga)]/20 px-3 py-1 text-xs font-medium text-[color:var(--ga)]">★ new best on {result.s.difficulty}</div>
            )}
            <div className="mt-6 grid grid-cols-3 gap-x-10 gap-y-4 sm:grid-cols-6">
              {[
                ["wave", result.s.wave],
                ["kills", result.s.kills],
                ["accuracy", `${result.s.accuracy}%`],
                ["wpm", Math.round(result.s.wpm)],
                ["max combo", result.s.maxCombo],
                ["time", `${result.s.seconds}s`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-2xl text-white">{v}</div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400">{k}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex gap-3">
              <button onClick={start} className="rounded-xl bg-[color:var(--ga)] px-6 py-2.5 text-sm font-bold text-black">
                fly again · enter
              </button>
              <button onClick={() => gameRef.current?.toMenu()} className="rounded-xl bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/20">
                menu · m
              </button>
            </div>
          </Overlay>
        )}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-[#05060d]/80 px-6 py-6 text-center backdrop-blur-[3px]">
      {children}
    </div>
  );
}
