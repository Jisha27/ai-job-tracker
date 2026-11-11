import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MatchResult } from "@/lib/schema";
import AnalyzeForm from "./AnalyzeForm";

const JOB = "Frontend engineer with strong React and TypeScript experience needed.";
const RESUME = "Five years building React and TypeScript apps for product teams.";

const sampleResult: MatchResult = {
  score: 80,
  summary: "Good match.",
  matchingSkills: ["React"],
  missingSkills: [],
  suggestedBullets: [],
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function fillAndSubmit(job = JOB, resume = RESUME) {
  const user = userEvent.setup();
  // Paste instead of typing character by character to keep tests fast.
  await user.click(screen.getByLabelText("Job description"));
  await user.paste(job);
  await user.click(screen.getByLabelText("Your resume"));
  await user.paste(resume);
  await user.click(screen.getByRole("button", { name: "Analyze match" }));
}

describe("AnalyzeForm", () => {
  it("shows a validation error for short input and does not call the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AnalyzeForm onResult={vi.fn()} />);

    await fillAndSubmit(JOB, "Too short");

    expect(screen.getByRole("alert")).toHaveTextContent("Resume must be at least 50 characters.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("disables the button and shows 'Analyzing...' while loading", async () => {
    // Hold the request open so the loading state can be observed.
    let resolveFetch: (res: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve))),
    );
    const onResult = vi.fn();
    render(<AnalyzeForm onResult={onResult} />);

    await fillAndSubmit();

    const button = screen.getByRole("button", { name: "Analyzing..." });
    expect(button).toBeDisabled();

    resolveFetch(jsonResponse(sampleResult));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(sampleResult));
    expect(screen.getByRole("button", { name: "Analyze match" })).toBeEnabled();
  });

  it("shows the API error message in the alert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: "We couldn't analyze this match right now." }, 502),
      ),
    );
    const onResult = vi.fn();
    render(<AnalyzeForm onResult={onResult} />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "We couldn't analyze this match right now.",
      ),
    );
    expect(onResult).not.toHaveBeenCalled();
  });

  it("shows the rate-limit message from a 429 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { error: "You've reached the limit of 10 analyses per hour. Please try again later." },
          429,
        ),
      ),
    );
    render(<AnalyzeForm onResult={vi.fn()} />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/limit of 10 analyses per hour/),
    );
  });
});
