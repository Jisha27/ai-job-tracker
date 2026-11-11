"use client";

import { useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  text: string;
  /** Accessible name, e.g. "Copy bullet 2". */
  label: string;
};

type CopyStatus = "idle" | "copied" | "failed";

const RESET_AFTER_MS = 2000;

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset if the button unmounts (e.g. a new result arrives).
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      // navigator.clipboard is undefined on insecure (non-HTTPS, non-localhost) origins.
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), RESET_AFTER_MS);
  }

  const buttonText = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy";

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {buttonText}
      </button>
      {/* Screen readers don't reliably announce aria-label changes, so report the outcome here. */}
      <span role="status" className="sr-only">
        {status === "copied" ? "Copied to clipboard" : status === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}
