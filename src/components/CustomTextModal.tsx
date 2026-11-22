import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui";

export function CustomTextModal({
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Modal title="custom text" onClose={onClose} width="max-w-2xl">
      <p className="mb-3 text-sm text-sub">Paste anything you want to practise: code, an article, your own notes. Whitespace is normalised.</p>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && words > 0) onSave(text.trim().replace(/\s+/g, " "));
        }}
        rows={8}
        spellCheck={false}
        className="w-full resize-y rounded-lg bg-bg p-3 font-mono text-sm text-fg outline-none ring-1 ring-sub/30 focus:ring-main"
        placeholder="type or paste your text here…"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-sub">{words} words · ctrl+enter to start</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="rounded-lg bg-bg px-4 py-2 text-sm text-sub hover:text-fg">
            cancel
          </button>
          <button
            disabled={words === 0}
            onClick={() => onSave(text.trim().replace(/\s+/g, " "))}
            className="rounded-lg bg-main px-4 py-2 text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-40"
          >
            start test
          </button>
        </div>
      </div>
    </Modal>
  );
}
