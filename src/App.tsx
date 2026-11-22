import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaretStyle, SoundMode, TestConfig, TestMode, View } from "./types";
import { SettingsProvider, useSettings } from "./hooks/useSettings";
import { clearHistory, loadConfig, saveConfig } from "./lib/storage";
import { themes } from "./lib/themes";
import { Header } from "./components/Header";
import { ModeSelector } from "./components/ModeSelector";
import { TypingTest } from "./components/TypingTest";
import { StatsPage } from "./components/StatsPage";
import { SettingsModal } from "./components/SettingsModal";
import { CommandPalette } from "./components/CommandPalette";
import type { Command } from "./components/CommandPalette";
import { CustomTextModal } from "./components/CustomTextModal";
import { Kbd } from "./components/ui";
import { GameView } from "./game/GameView";

type Modal = null | "settings" | "palette" | "custom";

function Shell() {
  const { settings, update } = useSettings();
  const [view, setView] = useState<View>("test");
  const [modal, setModal] = useState<Modal>(null);
  const [config, setConfig] = useState<TestConfig>(loadConfig);
  const [running, setRunning] = useState(false);
  const [pointerActive, setPointerActive] = useState(true);
  const [restartKey, setRestartKey] = useState(0);
  const [dataKey, setDataKey] = useState(0);

  useEffect(() => saveConfig(config), [config]);
  const patch = useCallback((p: Partial<TestConfig>) => setConfig((c) => ({ ...c, ...p })), []);

  // Esc / Ctrl+K open the command palette; typing fades the chrome away until the mouse moves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal((m) => (m === "palette" ? null : "palette"));
        return;
      }
      if (e.key === "Escape" && modal === null && view !== "arcade") {
        e.preventDefault();
        setModal("palette");
        return;
      }
      if (view === "test" && modal === null && (e.key.length === 1 || e.key === "Backspace")) setPointerActive(false);
    };
    const onMove = () => setPointerActive(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
    };
  }, [modal, view]);

  const commands = useMemo<Command[]>(() => {
    const test = (p: Partial<TestConfig>) => () => {
      setView("test");
      patch(p);
    };
    const list: Command[] = [];
    const add = (group: string, label: string, run: () => void, active?: boolean) =>
      list.push({ id: `${group}:${label}`, group, label, run, active });

    add("go", "test", () => setView("test"), view === "test");
    add("go", "arcade · void defender", () => setView("arcade"), view === "arcade");
    add("go", "stats & history", () => setView("stats"), view === "stats");
    add("go", "settings", () => setModal("settings"));
    add("test", "restart", () => {
      setView("test");
      setRestartKey((k) => k + 1);
    });

    (["time", "words", "quote", "zen"] as TestMode[]).forEach((m) => add("mode", m, test({ mode: m }), config.mode === m));
    add("mode", "custom text…", () => {
      setView("test");
      setModal("custom");
    }, config.mode === "custom");
    [15, 30, 60, 120].forEach((d) => add("time", `${d} seconds`, test({ mode: "time", duration: d }), config.mode === "time" && config.duration === d));
    [10, 25, 50, 100].forEach((w) => add("words", `${w} words`, test({ mode: "words", wordCount: w }), config.mode === "words" && config.wordCount === w));
    (["short", "medium", "long"] as const).forEach((q) => add("quote", q, test({ mode: "quote", quoteLength: q }), config.mode === "quote" && config.quoteLength === q));
    add("option", `punctuation ${config.punctuation ? "off" : "on"}`, () => patch({ punctuation: !config.punctuation }));
    add("option", `numbers ${config.numbers ? "off" : "on"}`, () => patch({ numbers: !config.numbers }));
    (["english", "code"] as const).forEach((w) => add("words", `word list: ${w}`, () => patch({ wordlist: w }), config.wordlist === w));

    themes.forEach((t) => add("theme", t.name, () => update({ theme: t.id }), settings.theme === t.id));
    (["line", "block", "underline", "outline"] as CaretStyle[]).forEach((c) => add("caret", c, () => update({ caretStyle: c }), settings.caretStyle === c));
    add("caret", `smooth ${settings.smoothCaret ? "off" : "on"}`, () => update({ smoothCaret: !settings.smoothCaret }));
    [
      [1.25, "small"],
      [1.75, "medium"],
      [2.25, "large"],
      [2.75, "huge"],
    ].forEach(([v, name]) => add("font", String(name), () => update({ fontSize: v as number }), settings.fontSize === v));
    (["off", "click", "thock", "pop"] as SoundMode[]).forEach((s) => add("sound", s, () => update({ sound: s }), settings.sound === s));
    add("sound", `arcade effects ${settings.gameSound ? "off" : "on"}`, () => update({ gameSound: !settings.gameSound }));
    add("option", `live stats ${settings.liveStats ? "off" : "on"}`, () => update({ liveStats: !settings.liveStats }));
    add("option", `stop on error ${settings.stopOnError ? "off" : "on"}`, () => update({ stopOnError: !settings.stopOnError }));
    add("option", `confidence mode ${settings.confidence ? "off" : "on"}`, () => update({ confidence: !settings.confidence }));
    return list;
  }, [config, settings, view, patch, update]);

  const runCommand = (c: Command) => {
    setModal(null); // close first so commands that open another dialog win
    c.run();
  };

  const chromeHidden = view === "test" && running && !pointerActive;
  const inputsEnabled = modal === null;

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <div className="tf-chrome" data-hidden={chromeHidden || undefined}>
        <Header view={view} onView={setView} onPalette={() => setModal("palette")} onSettings={() => setModal("settings")} />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {view === "test" && (
          <div className="flex min-h-full flex-col items-center justify-center gap-10 pb-12">
            <div className="tf-chrome px-4" data-hidden={chromeHidden || undefined}>
              <ModeSelector config={config} onChange={patch} onOpenCustom={() => setModal("custom")} />
            </div>
            <TypingTest key={restartKey} config={config} enabled={inputsEnabled} onRunningChange={setRunning} />
          </div>
        )}
        {view === "arcade" && <GameView active={inputsEnabled} />}
        {view === "stats" && (
          <div className="pt-4">
            <StatsPage key={dataKey} />
          </div>
        )}
      </main>

      <footer className="tf-chrome flex items-center justify-center gap-x-6 gap-y-1 px-6 py-3 text-xs text-sub" data-hidden={chromeHidden || undefined}>
        {view === "arcade" ? (
          <>
            <span>type to shoot</span>
            <span><Kbd>enter</Kbd> shockwave</span>
            <span><Kbd>esc</Kbd> pause</span>
          </>
        ) : (
          <>
            <span><Kbd>tab</Kbd> restart</span>
            <span><Kbd>esc</Kbd> / <Kbd>ctrl</Kbd>+<Kbd>k</Kbd> commands</span>
            <span><Kbd>ctrl</Kbd>+<Kbd>backspace</Kbd> delete word</span>
          </>
        )}
      </footer>

      {modal === "settings" && (
        <SettingsModal
          onClose={() => setModal(null)}
          onClearData={() => {
            clearHistory();
            setDataKey((k) => k + 1);
          }}
        />
      )}
      {modal === "palette" && <CommandPalette commands={commands} onRun={runCommand} onClose={() => setModal(null)} />}
      {modal === "custom" && (
        <CustomTextModal
          initial={config.customText}
          onClose={() => setModal(null)}
          onSave={(text) => {
            patch({ mode: "custom", customText: text });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
