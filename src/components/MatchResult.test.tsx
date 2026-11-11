import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MatchResult as MatchResultData } from "@/lib/schema";
import MatchResult from "./MatchResult";

const baseResult: MatchResultData = {
  score: 80,
  summary: "Solid overlap with the core requirements.",
  matchingSkills: ["React", "TypeScript"],
  missingSkills: ["GraphQL"],
  suggestedBullets: ["Built React apps.", "Shipped TypeScript features."],
};

describe("MatchResult", () => {
  it.each([
    [0, "Weak"],
    [54, "Weak"],
    [55, "Partial"],
    [74, "Partial"],
    [75, "Strong"],
    [100, "Strong"],
  ])("shows score %i as a %s match", (score, label) => {
    render(<MatchResult result={{ ...baseResult, score }} />);
    expect(screen.getByText(String(score))).toBeInTheDocument();
    expect(screen.getByText(`${label} match`)).toBeInTheDocument();
  });

  it("renders the summary, skill chips and a copy button per bullet", () => {
    render(<MatchResult result={baseResult} />);

    expect(screen.getByText(baseResult.summary)).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("GraphQL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy bullet 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy bullet 2" })).toBeInTheDocument();
  });

  it("shows empty states when lists are empty", () => {
    render(
      <MatchResult
        result={{ ...baseResult, matchingSkills: [], missingSkills: [], suggestedBullets: [] }}
      />,
    );
    expect(screen.getAllByText("None found.")).toHaveLength(2);
    expect(screen.getByText("No suggestions.")).toBeInTheDocument();
  });
});
