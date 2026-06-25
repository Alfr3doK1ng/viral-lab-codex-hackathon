import type { ViralAnalysis } from "../../domain/scoring";

type Props = {
  analysis: ViralAnalysis | null;
};

export function AnalysisPanel({ analysis }: Props) {
  return (
    <section className="panel analysis-panel" aria-labelledby="analysis-heading">
      <div className="panel-heading row-heading">
        <div>
          <p className="eyebrow">Viral DNA</p>
          <h2 id="analysis-heading">Signal readout</h2>
        </div>
        <strong className="score-pill">{analysis ? analysis.totalScore : "--"}</strong>
      </div>

      {analysis ? (
        <>
          <div className="dna-strip" data-testid="viral-dna-strip">
            {analysis.dimensions.map((dimension) => (
              <span
                key={dimension.id}
                style={{ "--score": `${dimension.score}%` } as React.CSSProperties}
                title={`${dimension.label}: ${dimension.score}`}
              />
            ))}
          </div>
          <div className="dimension-list">
            {analysis.dimensions.map((dimension) => (
              <article key={dimension.id} className="dimension-row">
                <div>
                  <strong>{dimension.label}</strong>
                  <p>{dimension.rationale}</p>
                </div>
                <span>{dimension.score}</span>
              </article>
            ))}
          </div>
          <div className="dna-copy">
            <p>{analysis.hookPattern}</p>
            <p>{analysis.pacingPattern}</p>
            <ul>
              {analysis.viralDna.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="empty-state">Run analysis to reveal the seven-band viral signal.</p>
      )}
    </section>
  );
}
