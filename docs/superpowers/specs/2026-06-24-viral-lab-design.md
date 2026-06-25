# Viral Lab PRD And Design Spec

## Summary

Viral Lab is a hackathon-ready web app that analyzes a TikTok-style short-form reference, extracts reusable "viral DNA," runs an agent committee over the findings, and generates a new short video. The final demo target is an actual playable video when local provider keys are present, with a deterministic offline preview provider when keys are absent.

The first version is a hybrid demo. It performs deterministic local analysis and generation-brief synthesis so the browser demo and tests are reliable, while exposing provider boundaries for real Image 2 / Seedance 2.0 style generation.

## Product Goals

- Demonstrate a spec-first, loop-engineering workflow that judges can recognize from the app itself.
- Help creators understand why a TikTok-style reference might work without copying the original content.
- Turn the analysis into a new concept, storyboard, prompt set, caption plan, QA checklist, and playable generated video.
- Run fully in a local browser demo with deterministic data and no required API keys.
- Use real provider keys from a local ignored file when present, without blocking the demo when that file is removed for judging.

## Non-Goals

- Scraping TikTok or bypassing platform restrictions.
- Downloading or reproducing copyrighted reference videos.
- Building user accounts, billing, collaboration, or persistent cloud storage.
- Claiming real virality predictions. The score is an interpretable creative heuristic, not a guarantee.
- Guaranteeing a specific third-party provider's uptime, latency, or output quality.

## Target User

The primary user is a creator, growth marketer, or hackathon judge who wants to see how Codex can convert a messy viral-reference idea into an executable creative system. They should be able to run the product loop in under three minutes.

## MVP Workflow

1. User enters a TikTok URL as the primary reference. The app stores the URL as a reference and does not scrape protected TikTok content.
2. User adds caption, transcript or scene notes, creator niche, desired output niche, and optional public metrics.
3. User may optionally upload a short local video file for demo completeness. Upload metadata is displayed, but video decoding is not required for the first version.
4. User clicks **Analyze viral DNA**.
5. The app validates the input and creates a deterministic analysis:
   - viralness score
   - scoring dimensions
   - hook pattern
   - pacing pattern
   - emotional arc
   - repeatability drivers
   - remix constraints
6. The app runs an agent committee:
   - Analyst: summarizes the reference mechanics.
   - Strategist: identifies audience and distribution angle.
   - Director: maps the creative into shots and timing.
   - Prompt Engineer: writes model-ready image and video prompts.
   - QA Critic: flags risk, originality, and execution gaps.
7. User clicks **Generate remix brief**.
8. The app outputs a new, non-copying concept with:
   - concept title
   - one-sentence premise
   - first-three-seconds hook
   - 5-shot storyboard
   - on-screen text beats
   - Image 2 prompt set
   - Seedance 2.0 style video prompt
   - negative prompts
   - caption and hashtag suggestions
   - readiness checklist
9. User clicks **Generate video**.
10. If real provider keys are available, the provider returns playable generated media or a provider job status that resolves to playable media.
11. If real provider keys are absent, the offline preview provider returns a deterministic playable preview video assembled from the storyboard and clearly labeled as an offline preview.
12. User can copy or export the generated brief and provider result as JSON.

## Functional Requirements

### Reference Intake

- The intake form must accept a TikTok URL, caption, transcript or scene notes, source niche, target niche, and optional metrics.
- URL validation must allow `https://` TikTok URLs and reject empty or non-URL values.
- Transcript and caption must have enough text to analyze. The minimum combined length is 30 characters.
- Metrics are optional numeric fields for views, likes, comments, shares, saves, and reposts.
- Optional upload must accept a browser `File` object and show filename, size, and MIME type.
- The guaranteed demo path must work without a file upload.

### Viralness Analysis

- Analysis must be deterministic for identical input.
- The viralness score must be 0-100.
- The scoring dimensions must include:
  - hook clarity
  - payoff density
  - emotional contrast
  - visual specificity
  - remixability
  - social proof
  - retention cues
- Each dimension must include a score, label, and rationale.
- The analysis must include a concise "viral DNA" list of reusable patterns.
- The system must avoid instructions that copy a creator, likeness, watermark, exact script, or branded asset.

### Agent Committee

- The committee must appear as a visible loop, not hidden implementation detail.
- Each agent must have a role, verdict, confidence score, and at least three structured findings.
- Committee findings must use the analysis as input, not free-floating generic advice.
- QA Critic must include originality and safety checks.
- The committee output must be generated locally and deterministically in the first version.

### Remix Brief Generation

- Brief generation must require a completed analysis.
- The generated concept must target the user's selected output niche.
- Storyboard must contain exactly five shots, each with timing, visual direction, camera direction, on-screen text, and audio cue.
- Image prompts must map to storyboard shots.
- The video prompt must specify duration, style, motion, camera behavior, transitions, and pacing.
- Negative prompts must reject copying the original creator, exact captions, logos, watermarks, and unsafe content.
- Exported JSON must include input summary, analysis, committee output, and generation brief.

### Provider Adapter Boundary

- The implementation must define a generation provider interface with an offline preview provider as the default.
- The provider interface must support real image and video generation calls without changing the UI workflow.
- Missing API keys must not block the local demo.
- The UI must label offline preview outputs honestly.
- Provider configuration must come from local environment variables or an ignored local key file, not hard-coded source files.
- The app must never commit API keys, provider tokens, or generated secrets.
- The app must support a real-provider path for Image 2 / Seedance 2.0 style generation when keys are present.

### Final Video Generation

- Video generation must require a completed remix brief.
- The default offline preview provider must produce a playable video artifact or data URL from the storyboard without external API calls.
- A real provider may return `queued`, `processing`, `succeeded`, or `failed` states.
- The UI must show provider state, elapsed time, and the final playable video when available.
- The UI must preserve the generated brief if provider generation fails.
- The exported JSON must include the selected provider, provider state, final video URL or data URL, and any provider-safe diagnostics.

## UX Requirements

- First screen must be the working app, not a marketing landing page.
- Layout should feel like a compact creative control room:
  - left: reference intake
  - center: viral DNA and agent committee
  - right: generated remix brief and storyboard
- Controls should be dense, readable, and suited to repeated creative analysis.
- Use icons for primary actions where available.
- Text must fit inside buttons, panels, and cards at mobile and desktop widths.
- The app must work at desktop width around 1440px and mobile width around 390px.
- The interface must make progress states clear for analysis and generation.
- Errors must tell the user exactly what to fix.
- The generated video panel must be visible in the first workflow view after a video has been generated.

## Visual Direction

The visual identity should feel like an editorial post-production console rather than a generic AI dashboard. The design should use:

- a dark ink base for focus
- high-contrast paper-like output panels for generated briefs
- a restrained signal palette for scoring and agent states
- monospace utility labels for metrics and prompt snippets
- a distinctive "viral DNA strip" that shows the seven score dimensions as compact signal bands

The single aesthetic risk is the DNA strip: it should look more like a creative signal readout than a standard progress chart, while remaining readable and accessible.

## Architecture

The app should be a TypeScript React application with local deterministic domain modules.

Proposed unit boundaries:

- `src/domain/reference.ts`: input types, validation, and normalization.
- `src/domain/scoring.ts`: viralness dimension scoring and score aggregation.
- `src/domain/committee.ts`: deterministic agent committee generation.
- `src/domain/brief.ts`: remix brief and storyboard generation.
- `src/providers/generation.ts`: provider interface, offline preview provider, and real provider adapter boundary.
- `src/app/App.tsx`: app shell and workflow state.
- `src/app/components/*`: focused UI components for intake, analysis, committee, storyboard, and export.
- `tests/unit/*`: unit tests for domain behavior.
- `tests/e2e/*`: browser e2e tests for the complete workflow.

## Data Model

```ts
type ReferenceInput = {
  url: string;
  caption: string;
  transcript: string;
  sourceNiche: string;
  targetNiche: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    reposts?: number;
  };
  upload?: {
    name: string;
    size: number;
    type: string;
  };
};

type ViralDimension = {
  id: string;
  label: string;
  score: number;
  rationale: string;
};

type ViralAnalysis = {
  totalScore: number;
  dimensions: ViralDimension[];
  hookPattern: string;
  pacingPattern: string;
  emotionalArc: string;
  viralDna: string[];
  remixConstraints: string[];
};

type CommitteeFinding = {
  agent: string;
  role: string;
  confidence: number;
  verdict: string;
  findings: string[];
};

type StoryboardShot = {
  id: number;
  timing: string;
  visual: string;
  camera: string;
  onScreenText: string;
  audioCue: string;
  imagePrompt: string;
};

type RemixBrief = {
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

type VideoGenerationState =
  | { status: "idle" }
  | { status: "queued"; provider: string; startedAt: string }
  | { status: "processing"; provider: string; startedAt: string; progressLabel: string }
  | { status: "succeeded"; provider: string; startedAt: string; completedAt: string; videoUrl: string }
  | { status: "failed"; provider: string; startedAt: string; error: string };
```

## Error Handling

- Invalid URL: show "Enter a valid https URL."
- Insufficient text: show "Add at least 30 characters across caption and transcript."
- Missing target niche: show "Choose the audience you want the new video to reach."
- Generation before analysis: disable the button and show analysis as the required prior step.
- Export before brief generation: disable export until a brief exists.
- Video generation without a brief: disable the button and show brief generation as the required prior step.
- Missing provider keys: use the offline preview provider and label the result "Offline preview."
- Provider failure: show the provider-safe error and keep the brief available.
- Unexpected runtime error: show a concise recoverable error and preserve form input.

## Testing Requirements

- Unit tests must cover:
  - valid and invalid reference input
  - score range and deterministic scoring
  - required scoring dimensions
  - committee output shape and role coverage
  - five-shot storyboard generation
  - export JSON completeness
  - offline preview provider result shape
- E2E tests must cover:
  - filling the form
  - running analysis
  - verifying the viral DNA strip appears
  - running brief generation
  - verifying five storyboard shots render
  - generating a playable video preview without API keys
  - copying or exporting JSON
- Browser verification must include desktop and mobile viewport checks.

## Acceptance Criteria

- A new user can complete the happy-path workflow in under three minutes.
- The app runs locally without API keys using the offline preview provider.
- The app can generate or display a playable final video artifact in the local demo.
- Real provider keys can be placed in a local ignored file for a higher-fidelity demo and removed before judging upload.
- The analysis and generation outputs are deterministic for a fixed sample input.
- The visible UI includes the judging-friendly loop: spec-first framing, agent committee, scoring, generation, and QA.
- Unit tests pass.
- E2E browser test passes.
- The final demo can be presented from a local dev server URL.

## Demo Script

1. Open Viral Lab.
2. Paste a sample TikTok URL and transcript.
3. Set source niche to "creator productivity" and target niche to "AI video tools."
4. Click **Analyze viral DNA**.
5. Point out the scoring dimensions and committee loop.
6. Click **Generate remix brief**.
7. Show the five-shot storyboard, prompts, negative prompts, and QA checklist.
8. Click **Generate video**.
9. Show the playable video result. If provider keys are present, this is the real provider result; if not, it is the labeled offline preview.
10. Export JSON and explain that the provider boundary is ready for Image 2 / Seedance 2.0.

## Implementation Constraints

- Use deterministic local logic for the first version.
- Keep provider calls behind an interface.
- Do not require backend services unless needed to protect provider keys for real generation calls.
- Prefer focused files and testable pure functions for the creative intelligence layer.
- Avoid storing uploaded video contents beyond the current browser session.
- Keep copy clear that generated output is a new brief inspired by patterns, not a copy of the reference.
- Keep all local key files ignored by git and safe to remove before submitting the project for judging.
