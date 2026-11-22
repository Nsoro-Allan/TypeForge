import type { ReactNode } from "react";
import { useEffect } from "react";

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-bg p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            o.value === value ? "bg-main text-bg font-medium" : "text-sub hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${value ? "bg-main" : "bg-bg"}`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-transform ${
          value ? "translate-x-[18px] bg-bg" : "bg-sub"
        }`}
      />
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="px-1.5 py-0.5 rounded bg-fg/10 text-fg/80 font-mono text-[0.7rem]">{children}</kbd>;
}

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-xl",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-12 tf-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-label={title} className={`w-full ${width} rounded-2xl bg-subalt p-6 shadow-2xl border border-sub/20`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-sub hover:text-fg text-sm" aria-label="Close">
            esc
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
