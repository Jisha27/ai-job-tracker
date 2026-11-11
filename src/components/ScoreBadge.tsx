type ScoreBadgeProps = {
  score: number;
};

type Band = {
  label: string;
  className: string;
};

// Thresholds: Strong 75+, Partial 55-74, Weak below 55.
// The label is always rendered so meaning never depends on colour alone.
function getBand(score: number): Band {
  if (score >= 75) {
    return {
      label: "Strong",
      className:
        "bg-green-100 text-green-800 ring-green-600/30 dark:bg-green-950 dark:text-green-200 dark:ring-green-400/30",
    };
  }
  if (score >= 55) {
    return {
      label: "Partial",
      className:
        "bg-amber-100 text-amber-900 ring-amber-600/30 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-400/30",
    };
  }
  return {
    label: "Weak",
    className:
      "bg-red-100 text-red-800 ring-red-600/30 dark:bg-red-950 dark:text-red-200 dark:ring-red-400/30",
  };
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const band = getBand(score);

  return (
    <p
      className={`inline-flex items-baseline gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${band.className}`}
    >
      <span className="text-2xl font-bold tabular-nums">{score}</span>
      <span>
        <span className="sr-only">out of 100, </span>
        {band.label} match
      </span>
    </p>
  );
}
