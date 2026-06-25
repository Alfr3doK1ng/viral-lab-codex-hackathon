import type { CommitteeFinding } from "./committee";
import type { NormalizedReference, UploadMetadata } from "./reference";
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
  persona?: {
    creatorName: string;
    imageName: string;
  };
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
    uploads?: NormalizedReference["uploads"];
    creatorImage?: UploadMetadata;
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
  const creatorName = creatorNameFromImage(reference.creatorImage?.name);
  if (creatorName && isComedySkitReference(reference)) {
    return generateSkitBrief(reference, analysis, committee, creatorName);
  }

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
      upload: stripDataUrl(reference.upload),
      uploads: reference.uploads?.map(stripDataUrl),
      creatorImage: stripDataUrl(reference.creatorImage)
    },
    analysis,
    committee,
    brief,
    video
  };
}

function generateSkitBrief(
  reference: NormalizedReference,
  analysis: ViralAnalysis,
  committee: CommitteeFinding[],
  creatorName: string
): RemixBrief {
  const target = reference.targetNiche;
  const title = `${creatorName}'s AI Startup Snack Spiral`;
  const qa = committee.find((finding) => finding.agent === "QA Critic");
  const topDna = analysis.viralDna.slice(0, 3);
  const persona = reference.creatorImage
    ? { creatorName, imageName: reference.creatorImage.name }
    : undefined;

  const shots: StoryboardShot[] = [
    {
      id: 1,
      timing: "0.0s-2.0s",
      visual: `${creatorName} opens on a campus bench with a serious AI startup pitch, but the whiteboard behind him only says "snack logistics?"`,
      camera: "Fast push-in from portrait framing to confused whiteboard reveal.",
      onScreenText: "I built an AI startup. Why is everyone asking for snacks?",
      audioCue: "Abrupt record scratch into a tiny notification ping.",
      imagePrompt: imagePrompt(
        target,
        `use the supplied creator image as ${creatorName}, campus startup pitch, confused snack whiteboard`
      )
    },
    {
      id: 2,
      timing: "2.0s-4.5s",
      visual:
        "A friend treats the demo like a dorm supply operation: chips, paper towels, and laptops pile up beside the pitch deck.",
      camera: "Whip-pan between pitch deck, snack pile, and a deadpan reaction.",
      onScreenText: "They heard 'AI agent' and brought inventory.",
      audioCue: "Three quick comedic taps synced to each new object.",
      imagePrompt: imagePrompt(target, "dorm supply pile, laptop pitch deck, comic escalation")
    },
    {
      id: 3,
      timing: "4.5s-7.0s",
      visual: `${creatorName} tries to regain control by showing a clean generated-video workflow while everyone keeps asking for the snack menu.`,
      camera: "Locked medium shot, then snap zoom into the clean workflow card.",
      onScreenText: "No. It generates videos. Not granola bars.",
      audioCue: "Typing rhythm interrupted by one plastic bag crinkle.",
      imagePrompt: imagePrompt(
        target,
        `supplied creator image as ${creatorName}, clean workflow card, friends misunderstanding`
      )
    },
    {
      id: 4,
      timing: "7.0s-10.5s",
      visual:
        "The misunderstanding becomes useful: the messy snack requests turn into a storyboard, captions, and a launch plan.",
      camera: "Sideways tracking move across chaos becoming a tidy five-shot board.",
      onScreenText: "Wait. This is actually the product demo.",
      audioCue: "Rising realization chord with crisp UI ticks.",
      imagePrompt: imagePrompt(target, "messy dorm comedy transforming into polished storyboard board")
    },
    {
      id: 5,
      timing: "10.5s-14.0s",
      visual: `${creatorName} faces camera with the finished skit preview while the snack pile sits perfectly labeled like a SaaS dashboard.`,
      camera: "Confident dolly out to reveal the full joke and app result.",
      onScreenText: "Accidental startup. Intentional demo.",
      audioCue: "Clean punchline hit, then one soft notification tail.",
      imagePrompt: imagePrompt(
        target,
        `supplied creator image as ${creatorName}, finished AI video demo, labeled snack dashboard punchline`
      )
    }
  ];

  return {
    title,
    premise: `An original campus skit starring ${creatorName}: two viral reference structures collide as an AI founder pitch is mistaken for a dorm snack logistics startup.`,
    hook: `First three seconds: ${creatorName} makes a serious startup claim, then the frame reveals the absurd snack misunderstanding.`,
    persona,
    shots,
    videoPrompt: [
      `Seedance 2.0 video prompt for a 14-second vertical 9:16 campus comedy skit about ${target}.`,
      `Use the supplied creator image as the likeness reference for ${creatorName} only.`,
      "Reference inspiration: awkward business-pitch escalation, dorm-room supply chaos, reaction cuts, and a clean final punchline.",
      `Pacing: ${analysis.pacingPattern}`,
      `Story arc: ${analysis.emotionalArc}`,
      `Use these viral DNA anchors: ${topDna.join(" ")}`
    ].join(" "),
    negativePrompts: [
      "Do not copy the source creators, faces, voices, rooms, wardrobes, watermarks, or exact captions.",
      "Do not imply the snack logistics joke is a real dark-web service or illicit activity.",
      "Use the supplied creator image only for the starring character authorized by the upload.",
      qa?.findings[0] ?? "Keep the output original and structurally inspired only."
    ],
    captionOptions: [
      `${creatorName} tried to pitch an AI startup and accidentally invented snack ops.`,
      "The references gave us the escalation. The skit is fully new.",
      "Campus founder energy, dorm-room punchline."
    ],
    hashtags: ["#AIVideo", "#CampusComedy", "#CreatorTools", "#VideoStrategy"],
    readinessChecklist: [
      "Hook reads as a joke in the first frame.",
      "Every shot escalates the misunderstanding or pays it off.",
      "Only the uploaded creator image is used for likeness.",
      "Source videos are structural inspiration, not copied scenes.",
      "Final video preview is labeled by provider and exportable as JSON."
    ]
  };
}

function imagePrompt(targetNiche: string, scene: string): string {
  return [
    `Image 2 prompt: vertical 9:16 frame for ${targetNiche}.`,
    scene,
    "Readable interface details, cinematic practical lighting, original creator and original assets only."
  ].join(" ");
}

function isComedySkitReference(reference: NormalizedReference): boolean {
  const text = [
    reference.caption,
    reference.transcript,
    reference.sourceNiche,
    reference.targetNiche
  ]
    .join(" ")
    .toLowerCase();
  return /skit|comedy|dorm|snack|punchline|business pitch|dark web|awkward/.test(text);
}

function creatorNameFromImage(name?: string): string | undefined {
  if (!name) return undefined;
  const stem = name.replace(/\.[^.]+$/, "").trim();
  const cleaned = stem.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripDataUrl<T extends UploadMetadata | undefined>(asset: T): T {
  if (!asset) return asset;
  return {
    name: asset.name,
    size: asset.size,
    type: asset.type
  } as T;
}
