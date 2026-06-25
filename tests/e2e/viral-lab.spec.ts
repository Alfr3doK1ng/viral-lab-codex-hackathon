import { expect, test } from "@playwright/test";

test("completes the Viral Lab happy path with an offline video preview", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("TikTok URL").fill("https://www.tiktok.com/@studio/video/1234567890");
  await page
    .getByLabel("Caption")
    .fill("The AI video setup that changed my whole production week.");
  await page
    .getByLabel("Transcript or scene notes")
    .fill(
      "Stop scrolling. Watch the first broken version, the exact prompt rebuild, and the final generated video system that saves three hours."
    );
  await page.getByLabel("Source niche").fill("creator productivity");
  await page.getByLabel("Target niche").fill("AI video tools");
  await page.getByRole("spinbutton", { name: "views" }).fill("920000");
  await page.getByRole("spinbutton", { name: "likes" }).fill("81000");
  await page.getByRole("spinbutton", { name: "comments" }).fill("3300");
  await page.getByRole("spinbutton", { name: "shares" }).fill("9200");
  await page.getByRole("spinbutton", { name: "saves" }).fill("13300");

  await page.getByRole("button", { name: /Analyze viral DNA/i }).click();
  await expect(page.getByTestId("viral-dna-strip")).toBeVisible();
  await expect(page.getByText("Analyst")).toBeVisible();
  await expect(page.getByText("Strategist")).toBeVisible();
  await expect(page.getByText("Director")).toBeVisible();
  await expect(page.getByText("Prompt Engineer")).toBeVisible();
  await expect(page.getByText("QA Critic")).toBeVisible();

  await page.getByRole("button", { name: /Generate remix brief/i }).click();
  await expect(page.locator("[data-testid='storyboard-shots'] .shot-card")).toHaveCount(5);
  await expect(page.getByText(/Seedance 2\.0 prompt/i)).toBeVisible();

  await page.getByRole("button", { name: /Generate video/i }).click();
  await expect(page.getByTestId("video-preview")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".provider-label", { hasText: "Offline preview" })).toBeVisible();

  await page.getByRole("button", { name: /Copy JSON/i }).click();
  await expect(page.getByText(/JSON copied|JSON ready below/)).toBeVisible();
});

test("keeps the primary workflow usable on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Viral Lab" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Analyze viral DNA/i })).toBeVisible();
  await expect(page.getByLabel("TikTok URL")).toBeVisible();
});
