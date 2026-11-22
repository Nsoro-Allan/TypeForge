import { useState } from "react";
import type { ReactNode } from "react";
import type { CaretStyle, SoundMode } from "../types";
import { useSettings } from "../hooks/useSettings";
import { themes } from "../lib/themes";
import { playKey } from "../lib/sound";
import { Modal, Segmented, Toggle } from "./ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-sub">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <div className="text-sm text-fg">{label}</div>
        {hint && <div className="text-xs text-sub">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsModal({ onClose, onClearData }: { onClose: () => void; onClearData: () => void }) {
  const { settings, update } = useSettings();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Modal title="settings" onClose={onClose} width="max-w-2xl">
      <Section title="theme">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ theme: t.id })}
              className="flex items-center justify-between rounded-lg border-2 px-3 py-2 text-sm transition"
              style={{
                background: t.bg,
                color: t.text,
                borderColor: settings.theme === t.id ? t.main : "transparent",
              }}
            >
              <span>{t.name}</span>
              <span className="flex gap-1">
                <i className="h-3 w-3 rounded-full" style={{ background: t.main }} />
                <i className="h-3 w-3 rounded-full" style={{ background: t.sub }} />
                <i className="h-3 w-3 rounded-full" style={{ background: t.error }} />
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="appearance">
        <Row label="font size">
          <Segmented
            value={settings.fontSize}
            onChange={(fontSize) => update({ fontSize })}
            options={[
              { value: 1.25, label: "small" },
              { value: 1.75, label: "medium" },
              { value: 2.25, label: "large" },
              { value: 2.75, label: "huge" },
            ]}
          />
        </Row>
        <Row label="caret style">
          <Segmented<CaretStyle>
            value={settings.caretStyle}
            onChange={(caretStyle) => update({ caretStyle })}
            options={[
              { value: "line", label: "line" },
              { value: "block", label: "block" },
              { value: "underline", label: "under" },
              { value: "outline", label: "outline" },
            ]}
          />
        </Row>
        <Row label="smooth caret" hint="glide between letters instead of jumping">
          <Toggle label="smooth caret" value={settings.smoothCaret} onChange={(smoothCaret) => update({ smoothCaret })} />
        </Row>
      </Section>

      <Section title="behaviour">
        <Row label="live stats" hint="show wpm and accuracy while you type">
          <Toggle label="live stats" value={settings.liveStats} onChange={(liveStats) => update({ liveStats })} />
        </Row>
        <Row label="stop on error" hint="wrong letters are blocked until you type the right one">
          <Toggle label="stop on error" value={settings.stopOnError} onChange={(stopOnError) => update({ stopOnError })} />
        </Row>
        <Row label="confidence mode" hint="backspace can't take you back to a previous word">
          <Toggle label="confidence mode" value={settings.confidence} onChange={(confidence) => update({ confidence })} />
        </Row>
      </Section>

      <Section title="sound">
        <Row label="key sounds">
          <Segmented<SoundMode>
            value={settings.sound}
            onChange={(sound) => {
              update({ sound });
              playKey(sound, settings.volume, "key");
            }}
            options={[
              { value: "off", label: "off" },
              { value: "click", label: "click" },
              { value: "thock", label: "thock" },
              { value: "pop", label: "pop" },
            ]}
          />
        </Row>
        <Row label="volume">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
            className="w-40 accent-main"
            aria-label="volume"
          />
        </Row>
        <Row label="arcade sound effects">
          <Toggle label="arcade sound effects" value={settings.gameSound} onChange={(gameSound) => update({ gameSound })} />
        </Row>
      </Section>

      <Section title="data">
        <Row label="clear history" hint="typing results, personal bests and arcade scores (stored on this device)">
          {confirmClear ? (
            <span className="flex gap-2">
              <button
                onClick={() => {
                  onClearData();
                  setConfirmClear(false);
                }}
                className="rounded-md bg-err px-3 py-1 text-sm text-bg"
              >
                yes, delete
              </button>
              <button onClick={() => setConfirmClear(false)} className="rounded-md bg-bg px-3 py-1 text-sm text-sub hover:text-fg">
                cancel
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="rounded-md bg-bg px-3 py-1 text-sm text-err hover:brightness-125">
              clear…
            </button>
          )}
        </Row>
      </Section>
    </Modal>
  );
}
