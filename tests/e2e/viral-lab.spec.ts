import { expect, type Page, test } from "@playwright/test";

const sampleReference = {
  url: "https://www.tiktok.com/@studio/video/1234567890",
  caption: "The AI video setup that changed my whole production week.",
  transcript:
    "Stop scrolling. Watch the first broken version, the exact prompt rebuild, and the final generated video system that saves three hours.",
  sourceNiche: "creator productivity",
  targetNiche: "AI video tools",
  metrics: {
    views: "920000",
    likes: "81000",
    comments: "3300",
    shares: "9200",
    saves: "13300"
  }
};

async function fillReference(page: Page, overrides: Partial<typeof sampleReference> = {}) {
  const reference = {
    ...sampleReference,
    ...overrides,
    metrics: {
      ...sampleReference.metrics,
      ...overrides.metrics
    }
  };

  await page.getByLabel("TikTok URL").fill(reference.url);
  await page.getByLabel("Caption").fill(reference.caption);
  await page.getByLabel("Transcript or scene notes").fill(reference.transcript);
  await page.getByLabel("Source niche").fill(reference.sourceNiche);
  await page.getByLabel("Target niche").fill(reference.targetNiche);
  await page.getByRole("spinbutton", { name: "views" }).fill(reference.metrics.views);
  await page.getByRole("spinbutton", { name: "likes" }).fill(reference.metrics.likes);
  await page.getByRole("spinbutton", { name: "comments" }).fill(reference.metrics.comments);
  await page.getByRole("spinbutton", { name: "shares" }).fill(reference.metrics.shares);
  await page.getByRole("spinbutton", { name: "saves" }).fill(reference.metrics.saves);
}

async function analyzeReference(page: Page) {
  await page.getByRole("button", { name: /Analyze viral DNA/i }).click();
  await expect(page.getByTestId("viral-dna-strip")).toBeVisible();
}

async function generateBrief(page: Page) {
  await page.getByRole("button", { name: /Generate remix brief/i }).click();
  await expect(page.locator("[data-testid='storyboard-shots'] .shot-card")).toHaveCount(5);
  await expect(page.getByText(/Seedance 2\.0 prompt/i)).toBeVisible();
}

async function generateVideo(page: Page) {
  await page.getByRole("button", { name: /Generate video/i }).click();
  await expect(page.getByTestId("video-preview")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".provider-label", { hasText: "Offline preview" })).toBeVisible();
}

async function completeWorkflow(page: Page) {
  await page.goto("/");
  await fillReference(page);
  await analyzeReference(page);
  await generateBrief(page);
  await generateVideo(page);
}

test("completes the Viral Lab happy path with an offline video preview", async ({ page }) => {
  await page.goto("/");
  await fillReference(page);
  await analyzeReference(page);
  await expect(page.getByText("Analyst")).toBeVisible();
  await expect(page.getByText("Strategist")).toBeVisible();
  await expect(page.getByText("Director")).toBeVisible();
  await expect(page.getByText("Prompt Engineer")).toBeVisible();
  await expect(page.getByText("QA Critic")).toBeVisible();

  await generateBrief(page);
  await generateVideo(page);

  const videoDetails = await page.getByTestId("video-preview").evaluate((video: HTMLVideoElement) => ({
    src: video.currentSrc || video.src,
    poster: video.poster,
    readyState: video.readyState,
    muted: video.muted,
    controls: video.controls,
    width: video.clientWidth,
    height: video.clientHeight
  }));

  expect(videoDetails.src.startsWith("blob:") || videoDetails.src.startsWith("data:video/webm")).toBe(
    true
  );
  expect(videoDetails.poster.startsWith("data:image/svg+xml")).toBe(true);
  expect(videoDetails.readyState).toBeGreaterThanOrEqual(1);
  expect(videoDetails.muted).toBe(true);
  expect(videoDetails.controls).toBe(true);
  expect(videoDetails.width).toBeGreaterThan(200);
  expect(videoDetails.height).toBeGreaterThan(200);

  await page.getByRole("button", { name: /Copy JSON/i }).click();
  await expect(page.getByText(/JSON copied|JSON ready below/)).toBeVisible();
});

test("blocks analysis until the TikTok URL, content notes, and target niche are valid", async ({
  page
}) => {
  await page.goto("/");

  await page.getByLabel("TikTok URL").fill("http://example.com/not-tiktok");
  await page.getByLabel("Caption").fill("short");
  await page.getByLabel("Target niche").fill("");
  await page.getByRole("button", { name: /Analyze viral DNA/i }).click();

  await expect(page.getByText("Enter a valid https TikTok URL.")).toBeVisible();
  await expect(page.getByText("Add at least 30 characters across caption and transcript.")).toBeVisible();
  await expect(page.getByText("Choose the audience you want the new video to reach.")).toBeVisible();
  await expect(page.getByText("Run analysis to reveal the seven-band viral signal.")).toBeVisible();
  await expect(page.getByTestId("viral-dna-strip")).toHaveCount(0);
});

test("keeps uploaded clip metadata in the generated export", async ({ page }) => {
  await page.goto("/");
  await fillReference(page);

  await page.locator("input[type='file']").setInputFiles({
    name: "reference-hook.webm",
    mimeType: "video/webm",
    buffer: Buffer.from("demo clip bytes")
  });

  await expect(page.getByTestId("upload-name")).toHaveText("reference-hook.webm");
  await analyzeReference(page);
  await generateBrief(page);

  const bundle = JSON.parse((await page.getByTestId("json-preview").textContent()) ?? "{}");
  expect(bundle.inputSummary.upload).toEqual({
    name: "reference-hook.webm",
    size: 15,
    type: "video/webm"
  });
});

test("exports a judge-readable bundle after video generation", async ({ page }) => {
  await completeWorkflow(page);

  await page.getByRole("button", { name: /Copy JSON/i }).click();
  await expect(page.getByText(/JSON copied|JSON ready below/)).toBeVisible();

  const exportText = (await page.getByTestId("json-preview").textContent()) ?? "";
  const bundle = JSON.parse(exportText);

  expect(bundle.inputSummary.url).toBe(sampleReference.url);
  expect(bundle.inputSummary.targetNiche).toBe(sampleReference.targetNiche);
  expect(bundle.analysis.dimensions).toHaveLength(7);
  expect(bundle.committee.map((finding: { agent: string }) => finding.agent)).toEqual([
    "Analyst",
    "Strategist",
    "Director",
    "Prompt Engineer",
    "QA Critic"
  ]);
  expect(bundle.brief.shots).toHaveLength(5);
  expect(bundle.brief.videoPrompt).toContain("Seedance 2.0 video prompt");
  expect(bundle.video.status).toBe("succeeded");
  expect(bundle.video.provider).toBe("Offline preview");
});

test("keeps the primary workflow usable on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await completeWorkflow(page);

  await expect(page.getByRole("heading", { name: "Viral Lab" })).toBeVisible();
  await expect(page.getByTestId("video-preview")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});
