import type { RemixBrief } from "../domain/brief";

export type VideoGenerationResult =
  | {
      status: "queued";
      provider: string;
      startedAt: string;
      diagnostics: string[];
    }
  | {
      status: "processing";
      provider: string;
      startedAt: string;
      progressLabel: string;
      diagnostics: string[];
    }
  | {
      status: "succeeded";
      provider: string;
      startedAt: string;
      completedAt: string;
      videoUrl: string;
      posterUrl?: string;
      diagnostics: string[];
    }
  | {
      status: "failed";
      provider: string;
      startedAt: string;
      error: string;
      diagnostics: string[];
    };

export type GenerationMode = "auto" | "offline" | "real";

const OFFLINE_PROVIDER = "Offline preview";
const STARTED_AT = new Date(0).toISOString();

export async function generateVideo(
  brief: RemixBrief,
  mode: GenerationMode = "auto"
): Promise<VideoGenerationResult> {
  if (mode === "offline") {
    return generateOfflinePreviewVideo(brief);
  }

  if (mode === "real" || configuredProviderMode() === "real") {
    return requestRealProviderGeneration(brief);
  }

  return generateOfflinePreviewVideo(brief);
}

export async function generateOfflinePreviewVideo(brief: RemixBrief): Promise<VideoGenerationResult> {
  const browserVideoUrl = await tryRecordCanvasPreview(brief);

  return {
    status: "succeeded",
    provider: OFFLINE_PROVIDER,
    startedAt: STARTED_AT,
    completedAt: STARTED_AT,
    videoUrl: browserVideoUrl ?? fallbackVideoDataUrl(brief),
    posterUrl: posterDataUrl(brief),
    diagnostics: [
      browserVideoUrl
        ? "Generated an offline WebM preview in the browser with Canvas and MediaRecorder."
        : "Generated an offline deterministic data URL because browser video recording is unavailable.",
      "No API keys, provider tokens, source video downloads, or third-party calls were used."
    ]
  };
}

export async function requestRealProviderGeneration(
  brief: RemixBrief
): Promise<VideoGenerationResult> {
  const startedAt = new Date().toISOString();

  try {
    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: brief.title,
        videoPrompt: brief.videoPrompt,
        negativePrompts: brief.negativePrompts,
        shots: brief.shots.map((shot) => ({
          id: shot.id,
          timing: shot.timing,
          visual: shot.visual,
          imagePrompt: shot.imagePrompt
        }))
      })
    });

    if (!response.ok) {
      return failedRealProvider(startedAt, `Provider endpoint returned ${response.status}.`);
    }

    const payload = (await response.json()) as Partial<VideoGenerationResult>;
    if (payload.status === "queued" && payload.provider) {
      return {
        status: "queued",
        provider: payload.provider,
        startedAt,
        diagnostics: ["Real provider accepted the request and queued video generation."]
      };
    }

    if (payload.status === "succeeded" && payload.provider && "videoUrl" in payload && payload.videoUrl) {
      return {
        status: "succeeded",
        provider: payload.provider,
        startedAt,
        completedAt: new Date().toISOString(),
        videoUrl: String(payload.videoUrl),
        posterUrl: "posterUrl" in payload && payload.posterUrl ? String(payload.posterUrl) : undefined,
        diagnostics: ["Real provider returned a playable video URL."]
      };
    }

    return failedRealProvider(startedAt, "Provider endpoint returned an unsupported response.");
  } catch {
    return failedRealProvider(startedAt, "Real provider endpoint is not configured in this local demo.");
  }
}

async function tryRecordCanvasPreview(brief: RemixBrief): Promise<string | null> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext("2d");
  const captureStream = canvas.captureStream?.bind(canvas);
  if (!context || !captureStream || !MediaRecorder.isTypeSupported("video/webm")) {
    return null;
  }

  const stream = captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const stopped = new Promise<string>((resolve) => {
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(URL.createObjectURL(blob));
    });
  });

  recorder.start();
  await drawStoryboardFrames(context, brief);
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  return stopped;
}

async function drawStoryboardFrames(context: CanvasRenderingContext2D, brief: RemixBrief): Promise<void> {
  const frameMs = 650;

  for (const shot of brief.shots) {
    const start = performance.now();
    while (performance.now() - start < frameMs) {
      drawFrame(context, brief, shot, (performance.now() - start) / frameMs);
      await nextAnimationFrame();
    }
  }
}

function drawFrame(
  context: CanvasRenderingContext2D,
  brief: RemixBrief,
  shot: RemixBrief["shots"][number],
  progress: number
) {
  const { canvas } = context;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#111214");
  gradient.addColorStop(0.45, "#243036");
  gradient.addColorStop(1, "#efe6d2");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(246, 239, 227, 0.92)";
  context.fillRect(56, 104 + progress * 18, 608, 900);
  context.strokeStyle = "#ec5b3f";
  context.lineWidth = 10;
  context.strokeRect(56, 104 + progress * 18, 608, 900);

  context.fillStyle = "#111214";
  context.font = "700 52px Inter, sans-serif";
  wrapText(context, brief.title, 92, 192, 536, 58);

  context.fillStyle = "#ec5b3f";
  context.font = "700 40px Inter, sans-serif";
  context.fillText(`Shot ${shot.id}`, 92, 378);

  context.fillStyle = "#111214";
  context.font = "500 34px Inter, sans-serif";
  wrapText(context, shot.onScreenText, 92, 446, 536, 44);

  context.fillStyle = "#3a4f59";
  context.font = "400 26px Inter, sans-serif";
  wrapText(context, shot.visual, 92, 650, 536, 36);

  context.fillStyle = "#111214";
  context.font = "700 30px Inter, sans-serif";
  context.fillText(shot.timing, 92, 944);
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    context.fillText(line, x, currentY);
  }
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function fallbackVideoDataUrl(brief: RemixBrief): string {
  const content = JSON.stringify({
    provider: OFFLINE_PROVIDER,
    title: brief.title,
    shots: brief.shots.map((shot) => shot.onScreenText)
  });
  return `data:video/webm;base64,${btoa(unescape(encodeURIComponent(content)))}`;
}

function posterDataUrl(brief: RemixBrief): string {
  const firstShot = brief.shots[0];
  const titleLines = svgTextLines(brief.title, 92, 180, 22, 58);
  const shotLines = svgTextLines(firstShot.onScreenText, 92, 470, 28, 44);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
      <rect width="720" height="1280" fill="#111214"/>
      <rect x="54" y="96" width="612" height="1000" rx="24" fill="#f2eadb" stroke="#ec5b3f" stroke-width="10"/>
      <g fill="#111214" font-family="Arial, sans-serif" font-size="50" font-weight="800">${titleLines}</g>
      <text x="92" y="390" fill="#ec5b3f" font-family="Arial, sans-serif" font-size="44" font-weight="800">Shot 1</text>
      <g fill="#111214" font-family="Arial, sans-serif" font-size="34" font-weight="800">${shotLines}</g>
      <text x="92" y="1010" fill="#314a54" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(firstShot.timing)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function svgTextLines(text: string, x: number, y: number, maxChars: number, lineHeight: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines
    .slice(0, 4)
    .map((lineText, index) => `<text x="${x}" y="${y + index * lineHeight}">${escapeXml(lineText)}</text>`)
    .join("");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function failedRealProvider(startedAt: string, error: string): VideoGenerationResult {
  return {
    status: "failed",
    provider: "Real provider",
    startedAt,
    error,
    diagnostics: [
      "No private credential values were read or returned to the browser.",
      "Use ignored local config files for provider configuration."
    ]
  };
}

function configuredProviderMode(): GenerationMode {
  const mode = import.meta.env.VITE_VIRAL_LAB_PROVIDER_MODE;
  return mode === "real" ? "real" : "offline";
}
