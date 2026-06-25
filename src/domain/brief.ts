import type { CommitteeFinding } from "./committee";
import type { NormalizedReference } from "./reference";
import type { ViralAnalysis } from "./scoring";

export type StoryboardShot = {
  id: number;
  timing: string;
  visual: string;
  camera: string;
  onScreenText: string;
  audioCue: string;
  imagePrompt: string;
};

export type RemixBrief = {
  title: string;
  premise: string;
  hook: string;
  shots: StoryboardShot[];
  videoPrompt: string;
  negativePrompts: string[];
  captionOptions: string[];
  hashtags: string[];
  readinessChecklist: string[];
};

export type VideoGenerationSnapshot =
  | { status: "idle" }
  | { status: "queued"; provider: string; startedAt: string }
  | { status: "processing"; provider: string; startedAt: string; progressLabel: string }
  | { status: "succeeded"; provider: string; startedAt: string; completedAt: string; videoUrl: string }
  | { status: "failed"; provider: string; startedAt: string; error: string };

export type ExportBundle = {
  exportedAt: string;
  inputSummary: {
    url: string;
    sourceNiche: string;
    targetNiche: string;
    caption: string;
    transcript: string;
    metrics: NormalizedReference["metrics"];
    upload?: NormalizedReference["upload"];
  };
  analysis: ViralAnalysis;
  committee: CommitteeFinding[];
  brief: RemixBrief;
  video: VideoGenerationSnapshot;
};

export function generateRemixBrief(
  reference: NormalizedReference,
  analysis: ViralAnalysis,
  committee: CommitteeFinding[]
): RemixBrief {
  const target = reference.targetNiche;
  const title = `${target} Remix: The Proof Loop`;
  const topDna = analysis.viralDna.slice(0, 3);
  const qa = committee.find((finding) => finding.agent === "QA Critic");

  const shots: StoryboardShot[] = [
    {
      id: 1,
      timing: "0.0s-2.0s",
      visual: `A creator opens a cluttered ${target} project dashboard with a visible failed output beside it.`,
      camera: "Tight handheld push-in from screen edge to creator reaction.",
      onScreenText: "This looked impressive, but it failed.",
      audioCue: "Hard stop beat, then a quiet digital click.",
      imagePrompt: imagePrompt(target, "cluttered dashboard before-state, anxious but focused creator")
    },
    {
      id: 2,
      timing: "2.0s-4.5s",
      visual: "The messy process is reduced to three highlighted friction points.",
      camera: "Quick snap zooms between sticky-note labels and interface details.",
      onScreenText: "3 hidden friction points",
      audioCue: "Three crisp UI ticks matched to text reveals.",
      imagePrompt: imagePrompt(target, "three labeled friction points, editorial production console")
    },
    {
      id: 3,
      timing: "4.5s-7.0s",
      visual: "A clean prompt card slides in and rewrites the workflow step by step.",
      camera: "Locked overhead shot with smooth card motion and readable prompt text blocks.",
      onScreenText: "The rebuild prompt",
      audioCue: "Rising synth pulse with subtle typing texture.",
      imagePrompt: imagePrompt(target, "clean prompt card rebuilding a short-form video workflow")
    },
    {
      id: 4,
      timing: "7.0s-10.5s",
      visual: "The before-state transforms into a storyboard, captions, and generated video preview timeline.",
      camera: "Sideways tracking move across the transformation from messy to organized.",
      onScreenText: "From mess to shot list",
      audioCue: "Warm lift with a clean transition sweep.",
      imagePrompt: imagePrompt(target, "storyboard timeline and generated preview emerging from workflow")
    },
    {
      id: 5,
      timing: "10.5s-14.0s",
      visual: "Final split screen: original problem on left, polished generated video system on right.",
      camera: "Slow confident dolly out to reveal the full system and final takeaway.",
      onScreenText: "Steal the structure, not the video.",
      audioCue: "Short payoff hit, then one clean tail note.",
      imagePrompt: imagePrompt(target, "final split screen transformation, polished AI video production system")
    }
  ];

  return {
    title,
    premise: `Translate a viral ${reference.sourceNiche} proof mechanic into an original ${target} short video.`,
    hook: `First three seconds: interrupt with the failed version, then promise the exact ${target} rebuild.`,
    shots,
    videoPrompt: [
      `Seedance 2.0 video prompt for a 14-second vertical 9:16 short about ${target}.`,
      `Duration: 14 seconds. Style: editorial post-production console with crisp UI details and human-scale proof.`,
      "Motion: quick snap zooms, clean card slides, sideways tracking reveal, and confident final dolly out.",
      `Pacing: ${analysis.pacingPattern}`,
      `Story arc: ${analysis.emotionalArc}`,
      `Use these viral DNA anchors: ${topDna.join(" ")}`
    ].join(" "),
    negativePrompts: [
      "Do not copy the original creator, likeness, face, voice, room, or wardrobe.",
      "Do not use platform watermarks, logos, branded assets, or exact captions from the reference.",
      "Do not imply guaranteed virality, income, or platform manipulation.",
      qa?.findings[0] ?? "Keep the output original and structurally inspired only."
    ],
    captionOptions: [
      `I rebuilt the viral structure for ${target}, not the original video.`,
      `The useful part was the proof loop. Here is the ${target} version.`,
      `Steal the structure, not the clip: ${target} edition.`
    ],
    hashtags: ["#AIVideo", "#CreatorTools", "#VideoStrategy", "#PromptEngineering"],
    readinessChecklist: [
      "Hook is understandable with sound off.",
      "Every shot shows a visible transformation or proof point.",
      "No creator likeness, watermark, exact caption, or protected asset is reused.",
      "Prompt set can be handed to Image 2 and Seedance 2.0 style providers.",
      "Final video preview is labeled by provider and exportable as JSON."
    ]
  };
}

export function createExportBundle(
  reference: NormalizedReference,
  analysis: ViralAnalysis,
  committee: CommitteeFinding[],
  brief: RemixBrief,
  video: VideoGenerationSnapshot
): ExportBundle {
  return {
    exportedAt: new Date(0).toISOString(),
    inputSummary: {
      url: reference.url,
      sourceNiche: reference.sourceNiche,
      targetNiche: reference.targetNiche,
      caption: reference.caption,
      transcript: reference.transcript,
      metrics: reference.metrics,
      upload: reference.upload
    },
    analysis,
    committee,
    brief,
    video
  };
}

function imagePrompt(targetNiche: string, scene: string): string {
  return [
    `Image 2 prompt: vertical 9:16 frame for ${targetNiche}.`,
    scene,
    "Readable interface details, cinematic practical lighting, original creator and original assets only."
  ].join(" ");
}
