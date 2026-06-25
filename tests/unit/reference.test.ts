import { describe, expect, it } from "vitest";
import { validateReferenceInput, type ReferenceInput } from "../../src/domain/reference";

const validInput: ReferenceInput = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "I tried this AI workflow and the ending surprised me.",
  transcript:
    "Stop scrolling. I rebuilt my content calendar using one prompt, then tested it live with a surprising payoff.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: 1200000,
    likes: 88000,
    comments: 4100,
    shares: 9000,
    saves: 15000
  },
  upload: {
    name: "reference.mp4",
    size: 2048,
    type: "video/mp4"
  }
};

describe("validateReferenceInput", () => {
  it("accepts and normalizes a usable TikTok reference", () => {
    const result = validateReferenceInput(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.url).toBe(validInput.url);
    expect(result.value.sourceNiche).toBe("creator productivity");
    expect(result.value.targetNiche).toBe("AI video tools");
    expect(result.value.metrics.views).toBe(1200000);
    expect(result.value.upload?.name).toBe("reference.mp4");
  });

  it("normalizes multiple reference clips and a creator image", () => {
    const result = validateReferenceInput({
      ...validInput,
      upload: undefined,
      uploads: [
        { name: " Download (1).mp4 ", size: 11751746.4, type: "video/mp4" },
        { name: "Download (2).mp4", size: 15523873, type: "video/mp4" }
      ],
      creatorImage: {
        name: " Hanzhe.jpeg ",
        size: 34912.2,
        type: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,portrait"
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upload?.name).toBe("Download (1).mp4");
    expect(result.value.uploads).toEqual([
      { name: "Download (1).mp4", size: 11751746, type: "video/mp4" },
      { name: "Download (2).mp4", size: 15523873, type: "video/mp4" }
    ]);
    expect(result.value.creatorImage).toEqual({
      name: "Hanzhe.jpeg",
      size: 34912,
      type: "image/jpeg",
      dataUrl: "data:image/jpeg;base64,portrait"
    });
  });

  it("rejects non-https TikTok URLs", () => {
    const result = validateReferenceInput({
      ...validInput,
      url: "http://www.tiktok.com/@studio/video/123"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: "url",
      message: "Enter a valid https TikTok URL."
    });
  });

  it("rejects non-TikTok URLs", () => {
    const result = validateReferenceInput({
      ...validInput,
      url: "https://example.com/watch/123"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.field === "url")).toBe(true);
  });

  it("requires enough caption and transcript material", () => {
    const result = validateReferenceInput({
      ...validInput,
      caption: "short",
      transcript: "tiny"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: "transcript",
      message: "Add at least 30 characters across caption and transcript."
    });
  });

  it("requires a target niche", () => {
    const result = validateReferenceInput({
      ...validInput,
      targetNiche: "   "
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: "targetNiche",
      message: "Choose the audience you want the new video to reach."
    });
  });
});
