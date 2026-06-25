export type ReferenceMetrics = {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reposts?: number;
};

export type UploadMetadata = {
  name: string;
  size: number;
  type: string;
};

export type ReferenceInput = {
  url: string;
  caption: string;
  transcript: string;
  sourceNiche: string;
  targetNiche: string;
  metrics: ReferenceMetrics;
  upload?: UploadMetadata;
};

export type NormalizedReference = ReferenceInput & {
  combinedText: string;
  textWordCount: number;
};

export type FieldError = {
  field: keyof ReferenceInput | "transcript";
  message: string;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

const MIN_TEXT_LENGTH = 30;

export function validateReferenceInput(input: ReferenceInput): ValidationResult<NormalizedReference> {
  const errors: FieldError[] = [];
  const url = input.url.trim();
  const caption = input.caption.trim();
  const transcript = input.transcript.trim();
  const sourceNiche = input.sourceNiche.trim();
  const targetNiche = input.targetNiche.trim();
  const combinedText = `${caption} ${transcript}`.trim();

  if (!isHttpsTikTokUrl(url)) {
    errors.push({ field: "url", message: "Enter a valid https TikTok URL." });
  }

  if (combinedText.replace(/\s/g, "").length < MIN_TEXT_LENGTH) {
    errors.push({
      field: "transcript",
      message: "Add at least 30 characters across caption and transcript."
    });
  }

  if (!targetNiche) {
    errors.push({
      field: "targetNiche",
      message: "Choose the audience you want the new video to reach."
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      url,
      caption,
      transcript,
      sourceNiche: sourceNiche || "unspecified source niche",
      targetNiche,
      metrics: normalizeMetrics(input.metrics),
      upload: input.upload ? normalizeUpload(input.upload) : undefined,
      combinedText,
      textWordCount: countWords(combinedText)
    }
  };
}

export function isHttpsTikTokUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com"));
  } catch {
    return false;
  }
}

function normalizeMetrics(metrics: ReferenceMetrics): ReferenceMetrics {
  return Object.fromEntries(
    Object.entries(metrics)
      .filter(([, value]) => typeof value === "number" && Number.isFinite(value) && value >= 0)
      .map(([key, value]) => [key, Math.round(value as number)])
  ) as ReferenceMetrics;
}

function normalizeUpload(upload: UploadMetadata): UploadMetadata {
  return {
    name: upload.name.trim(),
    size: Math.max(0, Math.round(upload.size)),
    type: upload.type.trim() || "application/octet-stream"
  };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
