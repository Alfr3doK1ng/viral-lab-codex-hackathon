import { CirclePlay } from "lucide-react";
import type { VideoGenerationResult } from "../../providers/generation";

type VideoState = { status: "idle" } | VideoGenerationResult;

type Props = {
  video: VideoState;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function VideoPanel({ video, canGenerate, isGenerating, onGenerate }: Props) {
  return (
    <section className="panel video-panel" aria-labelledby="video-heading">
      <div className="panel-heading row-heading">
        <div>
          <p className="eyebrow">Final video</p>
          <h2 id="video-heading">Playable result</h2>
        </div>
        <button
          className="primary-action compact"
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
        >
          <CirclePlay size={17} />
          {isGenerating ? "Rendering" : "Generate video"}
        </button>
      </div>

      {video.status === "idle" ? (
        <p className="empty-state">Generate a remix brief to unlock video rendering.</p>
      ) : null}

      {video.status === "processing" ? (
        <div className="video-state">
          <span className="pulse-dot" />
          <p>{video.progressLabel}</p>
        </div>
      ) : null}

      {video.status === "failed" ? (
        <div className="video-state error-box">
          <strong>{video.provider}</strong>
          <p>{video.error}</p>
        </div>
      ) : null}

      {video.status === "queued" ? (
        <div className="video-state">
          <strong>{video.provider}</strong>
          <p>Generation queued.</p>
        </div>
      ) : null}

      {video.status === "succeeded" ? (
        <div className="video-result">
          <span className="provider-label">{video.provider}</span>
          <video
            aria-label="Generated video preview"
            data-testid="video-preview"
            src={video.videoUrl}
            poster={video.posterUrl}
            autoPlay
            controls
            muted
            loop
            preload="auto"
            playsInline
          />
          <ul className="video-diagnostics">
            {video.diagnostics.map((diagnostic) => (
              <li key={diagnostic}>{diagnostic}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
