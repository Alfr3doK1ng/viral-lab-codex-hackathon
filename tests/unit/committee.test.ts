import { describe, expect, it } from "vitest";
import { runAgentCommittee } from "../../src/domain/committee";
import { validateReferenceInput, type ReferenceInput } from "../../src/domain/reference";
import { analyzeViralness } from "../../src/domain/scoring";

const input: ReferenceInput = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "Nobody talks about the boring AI setup that makes videos convert.",
  transcript:
    "Stop scrolling. I tried the messy workflow first, then rebuilt it with a cleaner prompt, and the final output finally made sense.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: 650000,
    likes: 50000,
    comments: 2100,
    shares: 7600,
    saves: 9800
  }
};

function committeeFixture() {
  const result = validateReferenceInput(input);
  if (!result.ok) throw new Error("Expected valid reference");
  const analysis = analyzeViralness(result.value);
  return runAgentCommittee(result.value, analysis);
}

describe("runAgentCommittee", () => {
  it("returns the required committee roles in order", () => {
    const committee = committeeFixture();

    expect(committee.map((finding) => finding.agent)).toEqual([
      "Analyst",
      "Strategist",
      "Director",
      "Prompt Engineer",
      "QA Critic"
    ]);
  });

  it("gives every agent a verdict, confidence score, and structured findings", () => {
    const committee = committeeFixture();

    for (const finding of committee) {
      expect(finding.role.length).toBeGreaterThan(5);
      expect(finding.verdict.length).toBeGreaterThan(10);
      expect(finding.confidence).toBeGreaterThanOrEqual(0);
      expect(finding.confidence).toBeLessThanOrEqual(100);
      expect(finding.findings.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("requires QA Critic to check originality and safety", () => {
    const qa = committeeFixture().find((finding) => finding.agent === "QA Critic");

    expect(qa?.findings.join(" ")).toMatch(/original/i);
    expect(qa?.findings.join(" ")).toMatch(/safety|safe/i);
  });
});
