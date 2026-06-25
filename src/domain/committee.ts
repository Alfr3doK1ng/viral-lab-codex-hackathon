import type { NormalizedReference } from "./reference";
import type { ViralAnalysis, ViralDimension } from "./scoring";

export type CommitteeFinding = {
  agent: "Analyst" | "Strategist" | "Director" | "Prompt Engineer" | "QA Critic";
  role: string;
  confidence: number;
  verdict: string;
  findings: string[];
};

export function runAgentCommittee(
  reference: NormalizedReference,
  analysis: ViralAnalysis
): CommitteeFinding[] {
  const strongest = strongestDimension(analysis.dimensions);
  const weakest = weakestDimension(analysis.dimensions);

  return [
    {
      agent: "Analyst",
      role: "Dissects why the source reference holds attention.",
      confidence: confidenceFrom(analysis.totalScore, 8),
      verdict: `${strongest.label} is the strongest reusable mechanic in the reference.`,
      findings: [
        `The hook pattern is: ${analysis.hookPattern}`,
        `The pacing pattern is: ${analysis.pacingPattern}`,
        `${strongest.label} scored ${strongest.score}, so it should lead the remix strategy.`
      ]
    },
    {
      agent: "Strategist",
      role: "Translates the mechanics into an audience and distribution angle.",
      confidence: confidenceFrom(analysis.totalScore, 2),
      verdict: `Reframe the source mechanic for ${reference.targetNiche} without borrowing the source execution.`,
      findings: [
        `Target audience: people watching ${reference.targetNiche} for fast practical proof.`,
        `Source niche signal: ${reference.sourceNiche} gives the remix a credible workflow pattern.`,
        `Repair the weakest dimension, ${weakest.label.toLowerCase()}, with clearer on-screen proof.`
      ]
    },
    {
      agent: "Director",
      role: "Turns the viral DNA into shot rhythm, camera behavior, and timing.",
      confidence: confidenceFrom(analysis.totalScore, 5),
      verdict: "Use a five-beat build: interruption, problem, proof, transformation, and payoff.",
      findings: [
        "Open tight on a visible before-state so the promise is legible in the first second.",
        "Cut every 1.5 to 2.5 seconds to keep the proof loop moving.",
        `Let the emotional arc guide performance: ${analysis.emotionalArc}`
      ]
    },
    {
      agent: "Prompt Engineer",
      role: "Converts strategy and direction into model-ready generation prompts.",
      confidence: confidenceFrom(analysis.totalScore, 1),
      verdict: "Generate original visuals from the structure, not from the source creator or assets.",
      findings: [
        `Use ${reference.targetNiche} props, interfaces, and examples in every prompt.`,
        "Write prompts around camera, motion, lighting, and visible transformation.",
        "Keep negative prompts explicit about creator likeness, exact captions, logos, and watermarks."
      ]
    },
    {
      agent: "QA Critic",
      role: "Checks originality, safety, and execution risk before generation.",
      confidence: confidenceFrom(analysis.totalScore, -4),
      verdict: "The concept is safe to generate when it preserves mechanics and replaces source specifics.",
      findings: [
        "Originality check: do not copy the creator, face, voice, room, edit, caption, or sequence exactly.",
        "Safety check: avoid claims that guarantee virality, income, health outcomes, or platform manipulation.",
        "Execution check: make every shot understandable without relying on the TikTok source video."
      ]
    }
  ];
}

function strongestDimension(dimensions: ViralDimension[]): ViralDimension {
  return [...dimensions].sort((a, b) => b.score - a.score)[0];
}

function weakestDimension(dimensions: ViralDimension[]): ViralDimension {
  return [...dimensions].sort((a, b) => a.score - b.score)[0];
}

function confidenceFrom(totalScore: number, offset: number): number {
  return Math.max(0, Math.min(100, Math.round(totalScore + offset)));
}
