import { describe, expect, it } from "vitest";
import { generateRemixBrief } from "../../src/domain/brief";
import { runAgentCommittee } from "../../src/domain/committee";
import { validateReferenceInput, type ReferenceInput } from "../../src/domain/reference";
import { analyzeViralness } from "../../src/domain/scoring";
import {
  generateOfflinePreviewVideo,
  generateVideo,
  requestRealProviderGeneration
} from "../../src/providers/generation";

const input: ReferenceInput = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "The AI video production loop I wish I had last month.",
  transcript:
    "Stop scrolling. I tested the messy version, rebuilt the prompt, and got a final video plan that actually works.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: 740000,
    likes: 64000,
    comments: 2700,
    shares: 7200,
    saves: 11100
  }
};

function briefFixture() {
  const result = validateReferenceInput(input);
  if (!result.ok) throw new Error("Expected valid reference");
  const analysis = analyzeViralness(result.value);
  const committee = runAgentCommittee(result.value, analysis);
  return generateRemixBrief(result.value, analysis, committee);
}

describe("video generation providers", () => {
  it("returns a succeeded offline preview result without API keys", async () => {
    const result = await generateOfflinePreviewVideo(briefFixture());

    expect(result.status).toBe("succeeded");
    if (result.status !== "succeeded") return;
    expect(result.provider).toBe("Offline preview");
    expect(result.videoUrl.length).toBeGreaterThan(20);
    expect(result.diagnostics.join(" ")).toMatch(/offline/i);
  });

  it("uses offline mode when generateVideo is asked explicitly", async () => {
    const result = await generateVideo(briefFixture(), "offline");

    expect(result.status).toBe("succeeded");
    expect(result.provider).toBe("Offline preview");
  });

  it("records when a creator portrait is supplied to the offline preview", async () => {
    const result = await generateOfflinePreviewVideo(briefFixture(), {
      creatorImageDataUrl: "data:image/jpeg;base64,portrait",
      creatorName: "Hanzhe"
    });

    expect(result.status).toBe("succeeded");
    expect(result.diagnostics.join(" ")).toMatch(/creator image|Hanzhe/i);
  });

  it("fails safely when the real provider endpoint is unavailable", async () => {
    const result = await requestRealProviderGeneration(briefFixture());

    expect(["failed", "queued", "succeeded"]).toContain(result.status);
    expect(JSON.stringify(result)).not.toMatch(/api[_-]?key|secret|token/i);
  });
});
