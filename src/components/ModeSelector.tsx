import type { ReactNode } from "react";
import type { QuoteLength, TestConfig, TestMode } from "../types";

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  onOpenCustom: () => void;
}

const MODES: TestMode[] = ["time", "words", "quote", "zen", "custom"];
const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];
const QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"];

function Btn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${active ? "text-main" : "text-sub hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1.5 h-5 w-[2px] rounded bg-bg" />;

export function ModeSelector({ config, onChange, onOpenCustom }: Props) {
  const generated = config.mode === "time" || config.mode === "words";

  return (
    <div className="inline-flex flex-wrap items-center justify-center rounded-xl bg-subalt px-3 py-1">
      {generated && (
        <>
          <Btn active={config.punctuation} onClick={() => onChange({ punctuation: !config.punctuation })} title="punctuation">
            @ punctuation
          </Btn>
          <Btn active={config.numbers} onClick={() => onChange({ numbers: !config.numbers })} title="numbers">
            # numbers
          </Btn>
          <Sep />
        </>
      )}

      {MODES.map((m) => (
        <Btn
          key={m}
          active={config.mode === m}
          onClick={() => (m === "custom" && !config.customText.trim() ? onOpenCustom() : onChange({ mode: m }))}
        >
          {m}
        </Btn>
      ))}

      <Sep />

      {config.mode === "time" &&
        DURATIONS.map((d) => (
          <Btn key={d} active={config.duration === d} onClick={() => onChange({ duration: d })}>
            {d}
          </Btn>
        ))}
      {config.mode === "words" &&
        WORD_COUNTS.map((w) => (
          <Btn key={w} active={config.wordCount === w} onClick={() => onChange({ wordCount: w })}>
            {w}
          </Btn>
        ))}
      {config.mode === "quote" &&
        QUOTE_LENGTHS.map((q) => (
          <Btn key={q} active={config.quoteLength === q} onClick={() => onChange({ quoteLength: q })}>
            {q}
          </Btn>
        ))}
      {config.mode === "custom" && <Btn onClick={onOpenCustom}>change text</Btn>}
      {config.mode === "zen" && <span className="px-2 text-sm text-sub">shift + enter to finish</span>}

      {generated && (
        <>
          <Sep />
          <Btn
            onClick={() => onChange({ wordlist: config.wordlist === "english" ? "code" : "english" })}
            title="switch word list"
          >
            {config.wordlist === "english" ? "english" : "code"}
          </Btn>
        </>
      )}
    </div>
  );
}
