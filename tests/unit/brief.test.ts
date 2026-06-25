import { describe, expect, it } from "vitest";
import { createExportBundle, generateRemixBrief } from "../../src/domain/brief";
import { runAgentCommittee } from "../../src/domain/committee";
import { validateReferenceInput, type ReferenceInput } from "../../src/domain/reference";
import { analyzeViralness } from "../../src/domain/scoring";

const input: ReferenceInput = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "The AI video setup that changed my whole production week.",
  transcript:
    "Watch the first broken version, the exact prompt rebuild, and the final video system that saves three hours.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: 920000,
    likes: 81000,
    comments: 3300,
    shares: 9200,
    saves: 13300
  }
};

function briefFixture() {
  const result = validateReferenceInput(input);
  if (!result.ok) throw new Error("Expected valid reference");
  const analysis = analyzeViralness(result.value);
  const committee = runAgentCommittee(result.value, analysis);
  const brief = generateRemixBrief(result.value, analysis, committee);
  return { reference: result.value, analysis, committee, brief };
}

describe("generateRemixBrief", () => {
  it("creates a target-niche concept with exactly five storyboard shots", () => {
    const { brief } = briefFixture();

    expect(brief.title).toMatch(/AI video tools/i);
    expect(brief.shots).toHaveLength(5);
    for (const shot of brief.shots) {
      expect(shot.timing).toMatch(/\d/);
      expect(shot.visual.length).toBeGreaterThan(10);
      expect(shot.camera.length).toBeGreaterThan(5);
      expect(shot.onScreenText.length).toBeGreaterThan(3);
      expect(shot.audioCue.length).toBeGreaterThan(3);
      expect(shot.imagePrompt.length).toBeGreaterThan(20);
    }
  });

  it("includes model-ready prompts and anti-copying negative prompts", () => {
    const { brief } = briefFixture();

    expect(brief.videoPrompt).toMatch(/Seedance 2\.0/i);
    expect(brief.videoPrompt).toMatch(/duration/i);
    expect(brief.negativePrompts.join(" ")).toMatch(/creator|likeness|watermark|exact captions/i);
    expect(brief.captionOptions.length).toBeGreaterThanOrEqual(2);
    expect(brief.hashtags).toContain("#AIVideo");
  });

  it("turns comedy references and a creator portrait into an original skit brief", () => {
    const result = validateReferenceInput({
      ...input,
      caption: "College and dorm skits escalate from business pitch to snacks and a confused punchline.",
      transcript:
        "A campus comedy skit uses business presentation beats, dorm-room chaos, free snacks, supplies, awkward reactions, and a final punchline.",
      sourceNiche: "college dorm comedy skits",
      targetNiche: "AI founder campus skit",
      creatorImage: {
        name: "Hanzhe.jpeg",
        size: 34912,
        type: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,portrait"
      }
    });
    if (!result.ok) throw new Error("Expected valid reference");

    const analysis = analyzeViralness(result.value);
    const committee = runAgentCommittee(result.value, analysis);
    const brief = generateRemixBrief(result.value, analysis, committee);

    expect(brief.title).toMatch(/Hanzhe/i);
    expect(brief.premise).toMatch(/campus|skit|snack/i);
    expect(brief.videoPrompt).toMatch(/Hanzhe|supplied creator image/i);
    expect(brief.shots.map((shot) => shot.onScreenText).join(" ")).toMatch(/snack|startup|demo/i);
    expect(brief.negativePrompts.join(" ")).toMatch(/source creators|watermark|exact/i);
  });
});

describe("createExportBundle", () => {
  it("includes the full workflow output and video state", () => {
    const { reference, analysis, committee, brief } = briefFixture();
    const bundle = createExportBundle(reference, analysis, committee, brief, {
      status: "idle"
    });

    expect(bundle.inputSummary.url).toBe(reference.url);
    expect(bundle.analysis.totalScore).toBe(analysis.totalScore);
    expect(bundle.committee).toHaveLength(5);
    expect(bundle.brief.title).toBe(brief.title);
    expect(bundle.video.status).toBe("idle");
  });

  it("exports creator image metadata without embedding the image data URL", () => {
    const result = validateReferenceInput({
      ...input,
      creatorImage: {
        name: "Hanzhe.jpeg",
        size: 34912,
        type: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,portrait"
      }
    });
    if (!result.ok) throw new Error("Expected valid reference");
    const analysis = analyzeViralness(result.value);
    const committee = runAgentCommittee(result.value, analysis);
    const brief = generateRemixBrief(result.value, analysis, committee);
    const bundle = createExportBundle(result.value, analysis, committee, brief, { status: "idle" });

    expect(bundle.inputSummary.creatorImage).toEqual({
      name: "Hanzhe.jpeg",
      size: 34912,
      type: "image/jpeg"
    });
    expect(JSON.stringify(bundle.inputSummary.creatorImage)).not.toContain("data:image");
  });
});
