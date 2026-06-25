import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, FlaskConical, Sparkles, Video } from "lucide-react";
import { createExportBundle, generateRemixBrief, type RemixBrief } from "../domain/brief";
import { runAgentCommittee, type CommitteeFinding } from "../domain/committee";
import {
  validateReferenceInput,
  type FieldError,
  type NormalizedReference,
  type ReferenceInput
} from "../domain/reference";
import { analyzeViralness, type ViralAnalysis } from "../domain/scoring";
import { generateVideo, type VideoGenerationResult } from "../providers/generation";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { BriefPanel } from "./components/BriefPanel";
import { CommitteePanel } from "./components/CommitteePanel";
import { ExportPanel } from "./components/ExportPanel";
import { ReferenceIntake } from "./components/ReferenceIntake";
import { VideoPanel } from "./components/VideoPanel";

type VideoState = { status: "idle" } | VideoGenerationResult;

const initialInput: ReferenceInput = {
  url: "",
  caption: "",
  transcript: "",
  sourceNiche: "",
  targetNiche: "",
  metrics: {}
};

export function App() {
  const [input, setInput] = useState<ReferenceInput>(initialInput);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [reference, setReference] = useState<NormalizedReference | null>(null);
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [committee, setCommittee] = useState<CommitteeFinding[]>([]);
  const [brief, setBrief] = useState<RemixBrief | null>(null);
  const [video, setVideo] = useState<VideoState>({ status: "idle" });
  const [workingStep, setWorkingStep] = useState<"idle" | "analysis" | "brief" | "video">("idle");
  const [copyStatus, setCopyStatus] = useState("Export not copied");

  const exportJson = useMemo(() => {
    if (!reference || !analysis || !brief) return "";
    return JSON.stringify(createExportBundle(reference, analysis, committee, brief, video), null, 2);
  }, [analysis, brief, committee, reference, video]);

  function handleAnalyze() {
    setWorkingStep("analysis");
    setCopyStatus("Export not copied");
    const result = validateReferenceInput(input);
    if (!result.ok) {
      setErrors(result.errors);
      setWorkingStep("idle");
      return;
    }

    const nextAnalysis = analyzeViralness(result.value);
    const nextCommittee = runAgentCommittee(result.value, nextAnalysis);
    setErrors([]);
    setReference(result.value);
    setAnalysis(nextAnalysis);
    setCommittee(nextCommittee);
    setBrief(null);
    setVideo({ status: "idle" });
    setWorkingStep("idle");
  }

  function handleGenerateBrief() {
    if (!reference || !analysis) return;
    setWorkingStep("brief");
    const nextBrief = generateRemixBrief(reference, analysis, committee);
    setBrief(nextBrief);
    setVideo({ status: "idle" });
    setCopyStatus("Export not copied");
    setWorkingStep("idle");
  }

  async function handleGenerateVideo() {
    if (!brief) return;
    setWorkingStep("video");
    setVideo({
      status: "processing",
      provider: "Offline preview",
      startedAt: new Date().toISOString(),
      progressLabel: "Rendering storyboard preview",
      diagnostics: ["Preparing the storyboard frames for video preview."]
    });
    const result = await generateVideo(brief, "auto");
    setVideo(result);
    setWorkingStep("idle");
  }

  async function handleCopyJson() {
    if (!exportJson) return;
    try {
      await navigator.clipboard?.writeText(exportJson);
      setCopyStatus("JSON copied");
    } catch {
      setCopyStatus("JSON ready below");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Spec-first loop</p>
          <h1>Viral Lab</h1>
          <p className="lede">
            Extract viral DNA from a TikTok reference, run the agent committee, and render a
            short-video preview.
          </p>
        </div>
        <div className="loop-badges" aria-label="Workflow stages">
          <span>
            <FlaskConical size={16} /> Spec
          </span>
          <span>
            <Activity size={16} /> Agents
          </span>
          <span>
            <Sparkles size={16} /> Brief
          </span>
          <span>
            <Video size={16} /> Video
          </span>
          <span>
            <ClipboardCheck size={16} /> QA
          </span>
        </div>
      </header>

      <section className="workflow-grid" aria-label="Viral Lab workflow">
        <ReferenceIntake
          input={input}
          errors={errors}
          isAnalyzing={workingStep === "analysis"}
          onInputChange={setInput}
          onAnalyze={handleAnalyze}
        />
        <div className="middle-column">
          <AnalysisPanel analysis={analysis} />
          <CommitteePanel committee={committee} />
        </div>
        <div className="output-column">
          <BriefPanel
            brief={brief}
            canGenerate={Boolean(analysis)}
            isGenerating={workingStep === "brief"}
            onGenerate={handleGenerateBrief}
          />
          <VideoPanel
            video={video}
            canGenerate={Boolean(brief)}
            isGenerating={workingStep === "video"}
            onGenerate={handleGenerateVideo}
          />
          <ExportPanel
            exportJson={exportJson}
            copyStatus={copyStatus}
            canExport={Boolean(exportJson)}
            onCopy={handleCopyJson}
          />
        </div>
      </section>
    </main>
  );
}
