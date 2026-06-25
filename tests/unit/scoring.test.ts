import { describe, expect, it } from "vitest";
import { validateReferenceInput, type ReferenceInput } from "../../src/domain/reference";
import { analyzeViralness } from "../../src/domain/scoring";

const input: ReferenceInput = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "The AI workflow nobody showed me until I tested it in public.",
  transcript:
    "Stop scrolling. Here is the before, here is the failed attempt, and here is the exact prompt that fixed it. Watch the final reveal.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: 980000,
    likes: 72000,
    comments: 3600,
    shares: 8200,
    saves: 12000,
    reposts: 1400
  }
};

function normalizedReference() {
  const result = validateReferenceInput(input);
  if (!result.ok) throw new Error("Expected valid reference");
  return result.value;
}

describe("analyzeViralness", () => {
  it("is deterministic for the same reference", () => {
    const reference = normalizedReference();

    expect(analyzeViralness(reference)).toEqual(analyzeViralness(reference));
  });

  it("returns a bounded aggregate score", () => {
    const analysis = analyzeViralness(normalizedReference());

    expect(analysis.totalScore).toBeGreaterThanOrEqual(0);
    expect(analysis.totalScore).toBeLessThanOrEqual(100);
  });

  it("includes every required scoring dimension", () => {
    const analysis = analyzeViralness(normalizedReference());

    expect(analysis.dimensions.map((dimension) => dimension.id)).toEqual([
      "hook-clarity",
      "payoff-density",
      "emotional-contrast",
      "visual-specificity",
      "remixability",
      "social-proof",
      "retention-cues"
    ]);
    expect(analysis.dimensions.every((dimension) => dimension.rationale.length > 10)).toBe(true);
  });

  it("creates reusable viral DNA and anti-copying constraints", () => {
    const analysis = analyzeViralness(normalizedReference());

    expect(analysis.viralDna.length).toBeGreaterThanOrEqual(4);
    expect(analysis.remixConstraints.join(" ")).toMatch(/Do not copy/i);
    expect(analysis.hookPattern).toMatch(/first/i);
  });
});
