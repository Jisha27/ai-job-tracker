import { z } from "zod";

// Shared limits for both free-text inputs. Max keeps prompts (and token cost) bounded.
const MIN_CHARS = 50;
const MAX_CHARS = 15000;

const longText = (label: string) =>
  z
    .string({ error: `${label} is required and must be text.` })
    .trim()
    .min(MIN_CHARS, `${label} must be at least ${MIN_CHARS} characters.`)
    .max(MAX_CHARS, `${label} must be at most ${MAX_CHARS} characters.`);

export const AnalyzeRequestSchema = z.object({
  jobDescription: longText("Job description"),
  resume: longText("Resume"),
});

export const MatchResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  suggestedBullets: z.array(z.string()).max(5),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
