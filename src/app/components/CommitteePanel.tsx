import { Brain, Clapperboard, PenTool, ShieldCheck, Target } from "lucide-react";
import type { CommitteeFinding } from "../../domain/committee";

type Props = {
  committee: CommitteeFinding[];
};

const icons = {
  Analyst: Brain,
  Strategist: Target,
  Director: Clapperboard,
  "Prompt Engineer": PenTool,
  "QA Critic": ShieldCheck
};

export function CommitteePanel({ committee }: Props) {
  return (
    <section className="panel committee-panel" aria-labelledby="committee-heading">
      <div className="panel-heading">
        <p className="eyebrow">Agent committee</p>
        <h2 id="committee-heading">Loop review</h2>
      </div>
      {committee.length > 0 ? (
        <div className="agent-list">
          {committee.map((finding) => {
            const Icon = icons[finding.agent];
            return (
              <article key={finding.agent} className="agent-row">
                <div className="agent-title">
                  <Icon size={18} />
                  <div>
                    <strong>{finding.agent}</strong>
                    <span>{finding.confidence}%</span>
                  </div>
                </div>
                <p>{finding.verdict}</p>
                <ul>
                  {finding.findings.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">The committee appears after viral DNA analysis.</p>
      )}
    </section>
  );
}
