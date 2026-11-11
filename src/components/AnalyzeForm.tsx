"use client";

import { useId, useState, type FormEvent } from "react";
import { z } from "zod";
import { AnalyzeRequestSchema, MatchResultSchema, type MatchResult } from "@/lib/schema";

type AnalyzeFormProps = {
  onResult: (result: MatchResult) => void;
};

// Mirrors the limits enforced by AnalyzeRequestSchema (used for counter colouring only).
const MIN_CHARS = 50;
const MAX_CHARS = 15000;

// Shape of error bodies returned by /api/analyze (400 and 502).
const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
});

const GENERIC_ERROR = "Something went wrong. Please try again.";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

function TextField({ label, value, onChange, disabled }: TextFieldProps) {
  const id = useId();
  const counterId = `${id}-count`;
  // Count trimmed length so the counter agrees with the schema's .trim().min()/.max().
  const length = value.trim().length;
  const counterTone =
    length > MAX_CHARS
      ? "text-red-700 dark:text-red-400"
      : length > 0 && length < MIN_CHARS
        ? "text-amber-700 dark:text-amber-400"
        : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={counterId}
        rows={10}
        className="min-h-48 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <p id={counterId} className={`self-end text-xs tabular-nums ${counterTone}`}>
        {length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
        {length > 0 && length < MIN_CHARS ? ` (minimum ${MIN_CHARS})` : ""}
      </p>
    </div>
  );
}

export default function AnalyzeForm({ onResult }: AnalyzeFormProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);

    // Validate in the browser first with the same schema the API uses.
    const input = AnalyzeRequestSchema.safeParse({ jobDescription, resume });
    if (!input.success) {
      setErrors(input.error.issues.map((issue) => issue.message));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const apiError = ApiErrorSchema.safeParse(body);
        setErrors(
          apiError.success
            ? apiError.data.details?.length
              ? apiError.data.details
              : [apiError.data.error]
            : [GENERIC_ERROR],
        );
        return;
      }

      const result = MatchResultSchema.safeParse(body);
      if (!result.success) {
        setErrors(["The analysis came back in an unexpected format. Please try again."]);
        return;
      }
      onResult(result.data);
    } catch {
      setErrors(["Couldn't reach the server. Check your connection and try again."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={loading} noValidate className="flex flex-col gap-5">
      <TextField
        label="Job description"
        value={jobDescription}
        onChange={setJobDescription}
        disabled={loading}
      />
      <TextField label="Your resume" value={resume} onChange={setResume} disabled={loading} />

      {/* Always mounted so screen readers announce errors when they appear. */}
      <div role="alert">
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {errors.length === 1 ? (
              <p>{errors[0]}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {errors.map((message, i) => (
                  <li key={`${i}-${message}`}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400 dark:disabled:bg-blue-900"
      >
        {loading ? "Analyzing..." : "Analyze match"}
      </button>
    </form>
  );
}
