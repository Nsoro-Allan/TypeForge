import type { ReactNode } from "react";
import type { Quote, Sample, TestConfig, TestStats } from "../types";
import type { PbInfo } from "../hooks/useTypingEngine";
import { ResultChart } from "./ResultChart";
import { Kbd } from "./ui";

interface Props {
  stats: TestStats;
  samples: Sample[];
  config: TestConfig;
  quote: Quote | null;
  pb: PbInfo | null;
  onNext: () => void;
  onRepeat: () => void;
}

export function describeConfig(c: TestConfig): { title: string; sub: string } {
  const flags = [c.punctuation && "punctuation", c.numbers && "numbers"].filter(Boolean).join(" ");
  const list = c.mode === "time" || c.mode === "words" ? c.wordlist : "english";
  switch (c.mode) {
    case "time":
      return { title: `time ${c.duration}`, sub: [list, flags].filter(Boolean).join(" · ") };
    case "words":
      return { title: `words ${c.wordCount}`, sub: [list, flags].filter(Boolean).join(" · ") };
    case "quote":
      return { title: `quote ${c.quoteLength}`, sub: "english" };
    case "custom":
      return { title: "custom text", sub: "" };
    case "zen":
      return { title: "zen", sub: "free typing" };
  }
}

export function Results({ stats, samples, config, quote, pb, onNext, onRepeat }: Props) {
  const type = describeConfig(config);
  const wpmDelta = pb?.prev ? stats.wpm - pb.prev.wpm : null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 tf-fade">
      <div className="grid items-center gap-x-10 gap-y-6 md:grid-cols-[auto_1fr]">
        <div className="flex gap-10 md:block md:space-y-5">
          <Big label="wpm" value={String(Math.round(stats.wpm))} title={`${stats.wpm.toFixed(2)} wpm`} accent />
          <Big label="acc" value={`${Math.round(stats.acc)}%`} title={`${stats.acc.toFixed(2)}% keystroke accuracy`} accent />
        </div>
        <ResultChart samples={samples} />
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-x-12 gap-y-4">
        <Mini label="test type" value={type.title} sub={type.sub} />
        <Mini label="raw" value={String(Math.round(stats.raw))} title={`${stats.raw.toFixed(2)} raw wpm`} />
        <Mini
          label="characters"
          value={`${stats.correct}/${stats.incorrect}/${stats.extra}/${stats.missed}`}
          title="correct / incorrect / extra / missed"
        />
        <Mini label="consistency" value={`${Math.round(stats.consistency)}%`} />
        <Mini label="time" value={`${Math.round(stats.time)}s`} title={`${stats.time.toFixed(2)}s`} />
      </div>

      {pb && (
        <div className="mt-6 text-sm">
          {pb.isPb ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-main/15 px-3 py-1 font-medium text-main">
              ★ new personal best
              {wpmDelta !== null && <span className="opacity-70">+{wpmDelta.toFixed(1)} wpm</span>}
            </span>
          ) : pb.prev ? (
            <span className="text-sub">
              personal best <span className="text-fg">{Math.round(pb.prev.wpm)} wpm</span> · {Math.round(pb.prev.acc)}% acc
            </span>
          ) : null}
        </div>
      )}

      {quote && <div className="mt-5 text-sm text-sub">— {quote.source}</div>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={onNext}
          className="rounded-lg bg-main px-5 py-2 text-sm font-medium text-bg transition hover:brightness-110"
        >
          next test
        </button>
        <button
          onClick={onRepeat}
          className="rounded-lg bg-subalt px-5 py-2 text-sm text-fg transition hover:bg-sub/30"
        >
          repeat same test
        </button>
        <span className="ml-1 text-xs text-sub">
          <Kbd>tab</Kbd> or <Kbd>enter</Kbd> for next
        </span>
      </div>
    </div>
  );
}

function Big({ label, value, title, accent }: { label: string; value: string; title?: string; accent?: boolean }) {
  return (
    <div title={title}>
      <div className="text-2xl text-sub">{label}</div>
      <div className={`font-mono text-6xl leading-none sm:text-7xl ${accent ? "text-main" : "text-fg"}`}>{value}</div>
    </div>
  );
}

function Mini({ label, value, sub, title }: { label: string; value: ReactNode; sub?: string; title?: string }) {
  return (
    <div title={title}>
      <div className="text-xs text-sub">{label}</div>
      <div className="font-mono text-2xl text-fg">{value}</div>
      {sub && <div className="text-xs text-sub">{sub}</div>}
    </div>
  );
}
