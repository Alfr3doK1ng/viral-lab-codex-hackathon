import type { NormalizedReference } from "./reference";

export type ViralDimension = {
  id:
    | "hook-clarity"
    | "payoff-density"
    | "emotional-contrast"
    | "visual-specificity"
    | "remixability"
    | "social-proof"
    | "retention-cues";
  label: string;
  score: number;
  rationale: string;
};

export type ViralAnalysis = {
  totalScore: number;
  dimensions: ViralDimension[];
  hookPattern: string;
  pacingPattern: string;
  emotionalArc: string;
  viralDna: string[];
  remixConstraints: string[];
};

type ScoreContext = {
  text: string;
  words: string[];
  metricsSignal: number;
};

const DIMENSIONS: Array<{
  id: ViralDimension["id"];
  label: string;
  score: (reference: NormalizedReference, context: ScoreContext) => number;
  rationale: (score: number, reference: NormalizedReference, context: ScoreContext) => string;
}> = [
  {
    id: "hook-clarity",
    label: "Hook clarity",
    score: (_reference, context) =>
      42 +
      keywordScore(context.text, ["stop", "wait", "watch", "nobody", "secret", "here is", "before"], 9) +
      (context.words.length < 36 ? 14 : 6),
    rationale: (score) => `Scores ${score} because the opening language gives the audience a clear reason to stay.`
  },
  {
    id: "payoff-density",
    label: "Payoff density",
    score: (_reference, context) =>
      38 + keywordScore(context.text, ["reveal", "result", "fixed", "ending", "tested", "proof"], 8),
    rationale: (score) => `Scores ${score} because the script promises repeated proof points and a visible payoff.`
  },
  {
    id: "emotional-contrast",
    label: "Emotional contrast",
    score: (_reference, context) =>
      36 + keywordScore(context.text, ["failed", "surprised", "before", "after", "finally", "nobody"], 8),
    rationale: (score) => `Scores ${score} because contrast words create a small tension-and-release arc.`
  },
  {
    id: "visual-specificity",
    label: "Visual specificity",
    score: (_reference, context) =>
      34 + keywordScore(context.text, ["screen", "prompt", "calendar", "workflow", "demo", "exact"], 9),
    rationale: (score) => `Scores ${score} because concrete nouns make the concept easier to storyboard.`
  },
  {
    id: "remixability",
    label: "Remixability",
    score: (reference, context) =>
      44 +
      keywordScore(context.text, ["workflow", "prompt", "template", "try", "tested", "exact"], 7) +
      (reference.targetNiche.length > 4 ? 8 : 0),
    rationale: (score, reference) =>
      `Scores ${score} because the mechanic can transfer cleanly into ${reference.targetNiche}.`
  },
  {
    id: "social-proof",
    label: "Social proof",
    score: (_reference, context) => 28 + context.metricsSignal,
    rationale: (score) => `Scores ${score} because public metrics provide a visible validation signal.`
  },
  {
    id: "retention-cues",
    label: "Retention cues",
    score: (_reference, context) =>
      35 + keywordScore(context.text, ["first", "then", "final", "watch", "ending", "step"], 8),
    rationale: (score) => `Scores ${score} because sequencing words encourage viewers to wait for the next beat.`
  }
];

export function analyzeViralness(reference: NormalizedReference): ViralAnalysis {
  const context = buildScoreContext(reference);
  const dimensions = DIMENSIONS.map((dimension) => {
    const score = clampScore(dimension.score(reference, context));
    return {
      id: dimension.id,
      label: dimension.label,
      score,
      rationale: dimension.rationale(score, reference, context)
    };
  });
  const totalScore = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length
  );

  return {
    totalScore,
    dimensions,
    hookPattern: buildHookPattern(reference, context),
    pacingPattern: buildPacingPattern(context),
    emotionalArc: buildEmotionalArc(context),
    viralDna: buildViralDna(reference, dimensions),
    remixConstraints: [
      "Do not copy the original creator, face, voice, likeness, watermark, or exact edit.",
      "Do not reuse exact captions, branded assets, private footage, or platform watermarks.",
      `Translate the mechanics into ${reference.targetNiche} with original shots and examples.`,
      "Preserve the audience promise, pacing, and payoff structure rather than the source content."
    ]
  };
}

function buildScoreContext(reference: NormalizedReference): ScoreContext {
  const text = reference.combinedText.toLowerCase();
  return {
    text,
    words: text.split(/\s+/).filter(Boolean),
    metricsSignal: scoreMetrics(reference)
  };
}

function scoreMetrics(reference: NormalizedReference): number {
  const { views = 0, likes = 0, comments = 0, shares = 0, saves = 0, reposts = 0 } = reference.metrics;
  const engagement = likes + comments * 2 + shares * 3 + saves * 3 + reposts * 2;
  if (views <= 0) return 18;
  const engagementRate = engagement / views;
  return clampScore(18 + Math.round(Math.min(0.18, engagementRate) * 260));
}

function keywordScore(text: string, keywords: string[], points: number): number {
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? points : 0), 0);
}

function buildHookPattern(reference: NormalizedReference, context: ScoreContext): string {
  const firstWords = context.words.slice(0, 10).join(" ");
  return `First beat creates a direct curiosity gap for ${reference.targetNiche}: "${firstWords}..."`;
}

function buildPacingPattern(context: ScoreContext): string {
  if (context.text.includes("before") && context.text.includes("after")) {
    return "Before/after structure with a mid-video proof beat and a final reveal.";
  }
  if (context.text.includes("then") || context.text.includes("step")) {
    return "Stepwise escalation that keeps each beat dependent on the next.";
  }
  return "Fast setup, proof-oriented middle, and short payoff beat.";
}

function buildEmotionalArc(context: ScoreContext): string {
  if (context.text.includes("failed") || context.text.includes("surprised")) {
    return "Skepticism to surprise to practical confidence.";
  }
  return "Curiosity to proof to useful takeaway.";
}

function buildViralDna(reference: NormalizedReference, dimensions: ViralDimension[]): string[] {
  const topDimensions = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 3);
  return [
    `Open with a concrete first-three-seconds promise for ${reference.targetNiche}.`,
    `Use ${reference.sourceNiche} proof mechanics without copying the source execution.`,
    "Show a visible transformation between setup and payoff.",
    "Use on-screen text as retention anchors, not decoration.",
    ...topDimensions.map((dimension) => `Lean into ${dimension.label.toLowerCase()} as a repeatable pattern.`)
  ];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
