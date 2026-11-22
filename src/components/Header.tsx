import type { ReactNode } from "react";
import type { View } from "../types";
import { ChartIcon, CommandIcon, GameIcon, KeyboardIcon, SettingsIcon } from "./icons";

function NavButton({ active, label, onClick, children }: { active?: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={(e) => {
        e.currentTarget.blur(); // a mouse click shouldn't leave a focus ring behind while you type or play
        onClick();
      }}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-subalt text-main" : "text-sub hover:text-fg"
      }`}
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function Header({
  view,
  onView,
  onPalette,
  onSettings,
}: {
  view: View;
  onView: (v: View) => void;
  onPalette: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 sm:px-10">
      <div className="flex items-center gap-6">
        <button onClick={() => onView("test")} className="text-2xl font-semibold tracking-tight text-fg" aria-label="TypeForge home">
          Type<span className="text-main">Forge</span>
        </button>
        <nav className="flex items-center gap-1">
          <NavButton label="test" active={view === "test"} onClick={() => onView("test")}>
            <KeyboardIcon />
          </NavButton>
          <NavButton label="arcade" active={view === "arcade"} onClick={() => onView("arcade")}>
            <GameIcon />
          </NavButton>
          <NavButton label="stats" active={view === "stats"} onClick={() => onView("stats")}>
            <ChartIcon />
          </NavButton>
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <NavButton label="commands" onClick={onPalette}>
          <CommandIcon />
        </NavButton>
        <NavButton label="settings" onClick={onSettings}>
          <SettingsIcon />
        </NavButton>
      </div>
    </header>
  );
}
