import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export interface Command {
  id: string;
  group: string;
  label: string;
  /** Marks the option that's currently selected (shown with a dot). */
  active?: boolean;
  run: () => void;
}

export function CommandPalette({ commands, onRun, onClose }: { commands: Command[]; onRun: (c: Command) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter((c) => tokens.every((t) => `${c.group} ${c.label}`.toLowerCase().includes(t))).slice(0, 80);
  }, [q, commands]);

  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    (listRef.current?.children[idx] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      setIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      setIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[idx];
      if (c) onRun(c);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[14vh] tf-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-label="command palette" className="w-full max-w-xl overflow-hidden rounded-2xl border border-sub/20 bg-subalt shadow-2xl">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type a command…  (try “theme”, “time 60”, “arcade”)"
          spellCheck={false}
          className="w-full bg-transparent px-5 py-4 text-base text-fg outline-none placeholder:text-sub"
        />
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto border-t border-sub/20 py-1">
          {filtered.length === 0 && <div className="px-5 py-6 text-sm text-sub">no commands match “{q}”</div>}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseMove={() => setIdx(i)}
              onClick={() => onRun(c)}
              className={`flex w-full items-center gap-3 px-5 py-2 text-left text-sm ${i === idx ? "bg-main text-bg" : "text-fg"}`}
            >
              <span className={`w-16 shrink-0 text-xs ${i === idx ? "opacity-70" : "text-sub"}`}>{c.group}</span>
              <span className="flex-1">{c.label}</span>
              {c.active && <span aria-label="current">●</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-4 border-t border-sub/20 px-5 py-2 text-xs text-sub">
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
