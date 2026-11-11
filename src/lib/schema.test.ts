import { describe, expect, it } from "vitest";
import { AnalyzeRequestSchema, MatchResultSchema } from "./schema";

const text = (n: number) => "a".repeat(n);
const validRequest = { jobDescription: text(60), resume: text(60) };

describe("AnalyzeRequestSchema", () => {
  it("accepts valid input and trims whitespace", () => {
    const parsed = AnalyzeRequestSchema.safeParse({
      jobDescription: `  ${text(60)}  `,
      resume: text(60),
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.jobDescription).toBe(text(60));
  });

  it("accepts exactly the 50 and 15,000 character bounds", () => {
    expect(AnalyzeRequestSchema.safeParse({ jobDescription: text(50), resume: text(15000) }).success).toBe(true);
  });

  it("rejects text that is too short", () => {
    const parsed = AnalyzeRequestSchema.safeParse({ ...validRequest, resume: text(49) });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Resume must be at least 50 characters.");
  });

  it("counts length after trimming, so padded short text is still too short", () => {
    const parsed = AnalyzeRequestSchema.safeParse({ ...validRequest, resume: ` ${text(40)}${" ".repeat(20)}` });
    expect(parsed.success).toBe(false);
  });

  it("rejects text that is too long", () => {
    const parsed = AnalyzeRequestSchema.safeParse({ ...validRequest, jobDescription: text(15001) });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe(
      "Job description must be at most 15000 characters.",
    );
  });

  it.each([
    ["a number", 123],
    ["null", null],
    ["an array", ["text"]],
  ])("rejects %s with a type error", (_label, value) => {
    const parsed = AnalyzeRequestSchema.safeParse({ ...validRequest, jobDescription: value });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Job description is required and must be text.");
  });

  it("rejects a missing field", () => {
    expect(AnalyzeRequestSchema.safeParse({ jobDescription: text(60) }).success).toBe(false);
  });
});

describe("MatchResultSchema", () => {
  const validResult = {
    score: 80,
    summary: "Good match.",
    matchingSkills: ["React"],
    missingSkills: ["Go"],
    suggestedBullets: ["Built things."],
  };

  it("accepts a valid result", () => {
    expect(MatchResultSchema.safeParse(validResult).success).toBe(true);
  });

  it.each([
    ["a score above 100", { score: 101 }],
    ["a negative score", { score: -1 }],
    ["a non-integer score", { score: 72.5 }],
    ["a string score", { score: "80" }],
    ["more than 5 bullets", { suggestedBullets: Array(6).fill("x") }],
    ["non-string skills", { matchingSkills: [1, 2] }],
  ])("rejects %s", (_label, override) => {
    expect(MatchResultSchema.safeParse({ ...validResult, ...override }).success).toBe(false);
  });
});
