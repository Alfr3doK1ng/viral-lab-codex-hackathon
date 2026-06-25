import { ImagePlus, Upload, Wand2 } from "lucide-react";
import type { FieldError, ReferenceInput, ReferenceMetrics, UploadMetadata } from "../../domain/reference";

type Props = {
  input: ReferenceInput;
  errors: FieldError[];
  isAnalyzing: boolean;
  onInputChange: (input: ReferenceInput) => void;
  onAnalyze: () => void;
};

const metricFields: Array<keyof ReferenceMetrics> = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
  "reposts"
];

export function ReferenceIntake({ input, errors, isAnalyzing, onInputChange, onAnalyze }: Props) {
  const errorFor = (field: string) => errors.find((error) => error.field === field)?.message;
  const uploads = input.uploads && input.uploads.length > 0 ? input.uploads : input.upload ? [input.upload] : [];
  const uploadLabel =
    uploads.length > 1
      ? `${uploads.length} clips: ${uploads.map((upload) => upload.name).join(", ")}`
      : uploads[0]?.name ?? "Optional reference clips";

  function update<K extends keyof ReferenceInput>(field: K, value: ReferenceInput[K]) {
    onInputChange({ ...input, [field]: value });
  }

  function updateMetric(field: keyof ReferenceMetrics, value: string) {
    const numberValue = value === "" ? undefined : Number(value);
    onInputChange({
      ...input,
      metrics: {
        ...input.metrics,
        [field]: Number.isFinite(numberValue) ? numberValue : undefined
      }
    });
  }

  function metadataFor(file: File): UploadMetadata {
    return {
      name: file.name,
      size: file.size,
      type: file.type
    };
  }

  async function updateCreatorImage(file: File | undefined) {
    if (!file) {
      update("creatorImage", undefined);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    update("creatorImage", {
      ...metadataFor(file),
      dataUrl
    });
  }

  return (
    <section className="panel intake-panel" aria-labelledby="reference-heading">
      <div className="panel-heading">
        <p className="eyebrow">Reference intake</p>
        <h2 id="reference-heading">TikTok signal</h2>
      </div>
      <label>
        TikTok URL
        <input
          value={input.url}
          onChange={(event) => update("url", event.target.value)}
          placeholder="https://www.tiktok.com/@creator/video/..."
          aria-invalid={Boolean(errorFor("url"))}
        />
      </label>
      {errorFor("url") ? <p className="field-error">{errorFor("url")}</p> : null}

      <label>
        Caption
        <textarea
          value={input.caption}
          onChange={(event) => update("caption", event.target.value)}
          rows={3}
          placeholder="Paste the original caption or hook."
        />
      </label>

      <label>
        Transcript or scene notes
        <textarea
          value={input.transcript}
          onChange={(event) => update("transcript", event.target.value)}
          rows={5}
          placeholder="Add transcript, shot notes, and visible beats."
          aria-invalid={Boolean(errorFor("transcript"))}
        />
      </label>
      {errorFor("transcript") ? <p className="field-error">{errorFor("transcript")}</p> : null}

      <div className="split-fields">
        <label>
          Source niche
          <input
            value={input.sourceNiche}
            onChange={(event) => update("sourceNiche", event.target.value)}
            placeholder="creator productivity"
          />
        </label>
        <label>
          Target niche
          <input
            value={input.targetNiche}
            onChange={(event) => update("targetNiche", event.target.value)}
            placeholder="AI video tools"
            aria-invalid={Boolean(errorFor("targetNiche"))}
          />
        </label>
      </div>
      {errorFor("targetNiche") ? <p className="field-error">{errorFor("targetNiche")}</p> : null}

      <div className="metrics-grid" aria-label="Public metrics">
        {metricFields.map((field) => (
          <label key={field}>
            {field}
            <input
              type="number"
              min={0}
              value={input.metrics[field] ?? ""}
              onChange={(event) => updateMetric(field, event.target.value)}
              placeholder="0"
            />
          </label>
        ))}
      </div>

      <label className="upload-zone">
        <Upload size={18} />
        <span data-testid="upload-name">{uploadLabel}</span>
        <input
          data-testid="reference-video-input"
          type="file"
          accept="video/*"
          multiple
          onChange={(event) => {
            const nextUploads = Array.from(event.target.files ?? []).map(metadataFor);
            onInputChange({
              ...input,
              upload: nextUploads[0],
              uploads: nextUploads
            });
          }}
        />
      </label>

      <label className="upload-zone creator-upload">
        <ImagePlus size={18} />
        <span data-testid="creator-image-name">
          {input.creatorImage ? input.creatorImage.name : "Optional creator image"}
        </span>
        <input
          data-testid="creator-image-input"
          type="file"
          accept="image/*"
          onChange={(event) => {
            void updateCreatorImage(event.target.files?.[0]);
          }}
        />
      </label>
      {input.creatorImage?.dataUrl ? (
        <div className="creator-preview">
          <img
            data-testid="creator-image-preview"
            src={input.creatorImage.dataUrl}
            alt={`${input.creatorImage.name} portrait preview`}
          />
        </div>
      ) : null}

      <button className="primary-action" type="button" onClick={onAnalyze} disabled={isAnalyzing}>
        <Wand2 size={18} />
        {isAnalyzing ? "Analyzing" : "Analyze viral DNA"}
      </button>
    </section>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}
