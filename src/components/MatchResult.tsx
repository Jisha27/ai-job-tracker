import type { MatchResult as MatchResultData } from "@/lib/schema";
import CopyButton from "./CopyButton";
import ScoreBadge from "./ScoreBadge";

type MatchResultProps = {
  result: MatchResultData;
};

type SkillListProps = {
  title: string;
  skills: string[];
  tone: "match" | "missing";
};

const chipTone: Record<SkillListProps["tone"], string> = {
  match:
    "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-950 dark:text-green-200 dark:ring-green-400/30",
  missing:
    "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-200 dark:ring-red-400/30",
};

function SkillList({ title, skills, tone }: SkillListProps) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {skills.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">None found.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {/* Index in the key: the model can return the same skill twice. */}
          {skills.map((skill, i) => (
            <li
              key={`${i}-${skill}`}
              className={`max-w-full rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset [overflow-wrap:anywhere] ${chipTone[tone]}`}
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MatchResult({ result }: MatchResultProps) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Match result</h2>
        <ScoreBadge score={result.score} />
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{result.summary}</p>
      </header>

      <SkillList title="Matching skills" skills={result.matchingSkills} tone="match" />
      <SkillList title="Missing skills" skills={result.missingSkills} tone="missing" />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Suggested resume bullets
        </h3>
        {result.suggestedBullets.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No suggestions.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.suggestedBullets.map((bullet, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200"
              >
                {/* min-w-0 lets the text shrink inside the flex row so long tokens wrap. */}
                <span className="min-w-0 [overflow-wrap:anywhere]">{bullet}</span>
                <CopyButton text={bullet} label={`Copy bullet ${i + 1}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
