// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchResult } from "@/lib/schema";

// Mock the AI call so tests never reach Groq.
vi.mock("@/lib/ai", () => ({ analyzeMatch: vi.fn() }));

import { analyzeMatch } from "@/lib/ai";
import { POST } from "./route";

const mockedAnalyze = vi.mocked(analyzeMatch);

const sampleResult: MatchResult = {
  score: 80,
  summary: "Strong overlap.",
  matchingSkills: ["React"],
  missingSkills: ["Go"],
  suggestedBullets: ["Built React apps."],
};

const validBody = {
  jobDescription: "Frontend engineer with React and TypeScript experience. ".repeat(2),
  resume: "Built React and TypeScript apps for five years at a startup. ".repeat(2),
};

// The route's rate limiter lives in module memory for the whole file, so every test
// uses its own IP to stay independent of the others.
let ipCounter = 0;
const nextIp = () => `203.0.113.${++ipCounter}`;

function makeRequest(body: unknown, ip = nextIp()) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockedAnalyze.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/analyze", () => {
  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeRequest("{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Request body must be valid JSON." });
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("returns 400 with details for invalid input", async () => {
    const res = await POST(makeRequest({ jobDescription: "short", resume: 42 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request.");
    expect(body.details).toEqual([
      "Job description must be at least 50 characters.",
      "Resume is required and must be text.",
    ]);
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("returns 200 with the analysis result", async () => {
    mockedAnalyze.mockResolvedValue(sampleResult);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleResult);
    expect(mockedAnalyze).toHaveBeenCalledWith({
      jobDescription: validBody.jobDescription.trim(),
      resume: validBody.resume.trim(),
    });
  });

  it("returns 502 with a generic message when analysis throws", async () => {
    mockedAnalyze.mockRejectedValue(new Error("Groq exploded with secret details"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/couldn't analyze this match/);
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("returns 429 after 10 requests from the same IP in an hour", async () => {
    mockedAnalyze.mockResolvedValue(sampleResult);
    const ip = nextIp();

    for (let i = 0; i < 10; i++) {
      expect((await POST(makeRequest(validBody, ip))).status).toBe(200);
    }

    const limited = await POST(makeRequest(validBody, ip));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect((await limited.json()).error).toMatch(/limit of 10 analyses per hour/);
    expect(mockedAnalyze).toHaveBeenCalledTimes(10);

    // A different client is unaffected.
    expect((await POST(makeRequest(validBody))).status).toBe(200);
  });
});
