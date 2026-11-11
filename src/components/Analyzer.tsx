"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchResult as MatchResultData } from "@/lib/schema";
import AnalyzeForm from "./AnalyzeForm";
import MatchResult from "./MatchResult";

// Client wrapper that owns the result state, so page.tsx can stay a Server Component.
export default function Analyzer() {
  const [result, setResult] = useState<MatchResultData | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  // In the one-column (mobile) layout the result renders below the form, off-screen.
  // Scroll it into view without moving focus, so aria-live still announces it.
  useEffect(() => {
    const el = resultRef.current;
    if (!result || !el) return;
    if (el.getBoundingClientRect().top > window.innerHeight) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section aria-label="Analyze a job match">
        <AnalyzeForm onResult={setResult} />
      </section>

      <section
        ref={resultRef}
        aria-live="polite"
        aria-label="Analysis result"
        className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        {result ? (
          <MatchResult result={result} />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your results will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
