import { Sparkles } from "lucide-react";
import type { RemixBrief } from "../../domain/brief";

type Props = {
  brief: RemixBrief | null;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function BriefPanel({ brief, canGenerate, isGenerating, onGenerate }: Props) {
  return (
    <section className="panel brief-panel" aria-labelledby="brief-heading">
      <div className="panel-heading row-heading">
        <div>
          <p className="eyebrow">Generation brief</p>
          <h2 id="brief-heading">Remix plan</h2>
        </div>
        <button
          className="secondary-action"
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
        >
          <Sparkles size={17} />
          {isGenerating ? "Writing" : "Generate remix brief"}
        </button>
      </div>

      {brief ? (
        <div className="brief-content">
          <h3>{brief.title}</h3>
          <p>{brief.premise}</p>
          <p className="hook-line">{brief.hook}</p>
          <div className="shot-list" data-testid="storyboard-shots">
            {brief.shots.map((shot) => (
              <article key={shot.id} className="shot-card">
                <span>{shot.timing}</span>
                <h4>Shot {shot.id}</h4>
                <p>{shot.visual}</p>
                <small>{shot.onScreenText}</small>
              </article>
            ))}
          </div>
          <div className="prompt-block">
            <strong>Seedance 2.0 prompt</strong>
            <p>{brief.videoPrompt}</p>
          </div>
        </div>
      ) : (
        <p className="empty-state">Generate the remix brief after the committee reviews the reference.</p>
      )}
    </section>
  );
}
