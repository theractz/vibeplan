"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ClarificationStep } from "@/components/ClarificationStep";
import { FeatureMindmap } from "@/components/FeatureMindmap";
import { IdeaInputStep } from "@/components/IdeaInputStep";
import { SidebarHistory } from "@/components/SidebarHistory";
import { WorkspaceOutput } from "@/components/WorkspaceOutput";
import { Button } from "@/components/ui/button";
import {
  clearLastProjectId,
  createId,
  deleteProject,
  getLastProjectId,
  loadProjects,
  upsertProject,
} from "@/lib/storage";
import {
  STEP_META,
  type AppStep,
  type ClarificationAnswer,
  type ClarificationAnswerPayload,
  type ClarificationAnswers,
  type ClarificationQuestion,
  type DocTab,
  type Feature,
  type GenerateResponse,
  type MindmapData,
  type PlanResponse,
  type ProjectDocs,
  type SavedProject,
} from "@/lib/types";

type LoadingState = "clarify" | "plan" | "generate" | "revision" | null;

interface ClarifyApiResponse {
  questions: ClarificationQuestion[];
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let message = `Permintaan gagal (${response.status}).`;
    if (data && typeof data === "object" && "error" in data) {
      message = String((data as { error: unknown }).error);
    }
    throw new Error(message);
  }

  return data as T;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Terjadi kesalahan tak terduga. Coba lagi.";
}

function deriveProjectName(idea: string) {
  const cleaned = idea
    .replace(/[.,!?;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Proyek Baru";

  return cleaned.split(" ").slice(0, 6).join(" ");
}

function buildAnswerPayload(
  questions: ClarificationQuestion[],
  answers: ClarificationAnswers,
): ClarificationAnswerPayload[] {
  return questions
    .map((question) => {
      const answer = answers[question.id];
      return {
        question: question.question,
        selectedOption: answer?.selectedOption || undefined,
        customDetail: answer?.customDetail?.trim() || undefined,
      };
    })
    .filter((answer) => answer.selectedOption || answer.customDetail);
}

function cleanFeatures(features: Feature[]): Feature[] {
  return features.map((feature) => ({
    ...feature,
    title: feature.title.trim(),
    phase: feature.phase.trim() || "FASE 1",
    status: feature.status.trim() || "Direncanakan",
    subFeatures: feature.subFeatures
      .map((subFeature) => subFeature.trim())
      .filter(Boolean),
  }));
}

function validateFeatures(features: Feature[]) {
  if (features.length === 0) {
    return "Tambahkan minimal satu fitur sebelum melanjutkan.";
  }

  for (const feature of features) {
    if (feature.title.length < 3) {
      return "Setiap fitur harus memiliki judul minimal 3 karakter.";
    }
    if (feature.subFeatures.length < 3 || feature.subFeatures.length > 5) {
      return `Fitur "${feature.title}" harus memiliki 3–5 sub-fitur (saat ini ${feature.subFeatures.length}).`;
    }
  }

  return null;
}

function resolveStep(project: SavedProject): AppStep {
  if (project.step === "workspace" && project.docs) return "workspace";
  if (
    (project.step === "mindmap" || project.step === "workspace") &&
    project.mindmap
  ) {
    return "mindmap";
  }
  if (
    (project.step === "clarify" || project.step === "mindmap") &&
    project.questions.length > 0
  ) {
    return "clarify";
  }
  return "idea";
}

function StepProgress({ current }: { current: AppStep }) {
  const currentIndex = STEP_META.findIndex((step) => step.key === current);

  return (
    <div className="hidden items-center gap-2 text-[11px] md:flex">
      {STEP_META.map((step, index) => (
        <span key={step.key} className="flex items-center gap-2">
          {index > 0 ? <span className="text-slate-800">/</span> : null}
          <span
            className={
              index === currentIndex ? "text-slate-200" : "text-slate-600"
            }
          >
            {step.shortLabel}
          </span>
        </span>
      ))}
    </div>
  );
}

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-md border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300"
    >
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup pesan error"
        className="rounded p-0.5 text-red-400/70 transition-colors hover:text-red-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 text-[10px] font-semibold text-slate-300">
      VP
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [step, setStep] = useState<AppStep>("idea");
  const [idea, setIdea] = useState("");
  const [techStack, setTechStack] = useState("");
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<ClarificationAnswers>({});
  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [docs, setDocs] = useState<ProjectDocs | null>(null);

  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState<string | null>(null);

  const idRef = useRef<string | null>(null);

  const applyProject = useCallback((project: SavedProject) => {
    idRef.current = project.id;
    setCurrentId(project.id);
    setStep(resolveStep(project));
    setIdea(project.idea ?? "");
    setTechStack(project.techStack ?? "");
    setQuestions(project.questions ?? []);
    setAnswers(project.answers ?? {});
    setMindmap(project.mindmap ?? null);
    setDocs(project.docs ?? null);
    setError(null);
    setLoading(null);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const stored = loadProjects();
    setProjects(stored);

    const lastId = getLastProjectId();
    const lastProject = lastId
      ? stored.find((project) => project.id === lastId)
      : undefined;

    if (lastProject) {
      applyProject(lastProject);
    }

    setHydrated(true);
  }, [applyProject]);

  useEffect(() => {
    if (!hydrated) return;
    if (!idea.trim() && !mindmap && !docs) return;

    const timer = window.setTimeout(() => {
      const now = new Date().toISOString();
      const id = idRef.current ?? createId();
      const existing = loadProjects().find((project) => project.id === id);

      if (!idRef.current) {
        idRef.current = id;
        setCurrentId(id);
      }

      const project: SavedProject = {
        id,
        name:
          mindmap?.projectName?.trim() ||
          deriveProjectName(idea) ||
          "Proyek Baru",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        step,
        idea,
        techStack,
        questions,
        answers,
        mindmap,
        docs,
      };

      const next = upsertProject(project);
      setProjects(next);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [hydrated, step, idea, techStack, questions, answers, mindmap, docs]);

  const resetWorkspace = () => {
    idRef.current = null;
    setCurrentId(null);
    setStep("idea");
    setIdea("");
    setTechStack("");
    setQuestions([]);
    setAnswers({});
    setMindmap(null);
    setDocs(null);
    setError(null);
    setLoading(null);
    setSidebarOpen(false);
    clearLastProjectId();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find((project) => project.id === id);
    const confirmed = window.confirm(
      `Hapus "${target?.name || "proyek ini"}" dari riwayat? Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!confirmed) return;

    const next = deleteProject(id);
    setProjects(next);

    if (idRef.current === id) {
      resetWorkspace();
    }
  };

  const handleAnswerChange = (
    questionId: string,
    patch: ClarificationAnswer,
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { ...previous[questionId], ...patch },
    }));
  };

  const handleStartClarify = async () => {
    if (idea.trim().length < 10) {
      setError("Tulis ide aplikasi minimal 10 karakter agar AI punya konteks.");
      return;
    }
    if (!techStack.trim()) {
      setError("Tech stack wajib diisi atau pilih salah satu preset.");
      return;
    }

    setLoading("clarify");
    setError(null);

    try {
      const data = await postJson<ClarifyApiResponse>("/api/clarify", {
        idea: idea.trim(),
        techStack: techStack.trim(),
      });

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("AI tidak mengembalikan pertanyaan klarifikasi.");
      }

      setQuestions(data.questions);
      setAnswers({});
      setStep("clarify");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePlan = async () => {
    if (questions.length === 0) {
      setError("Pertanyaan klarifikasi belum tersedia. Mulai ulang dari ide.");
      return;
    }

    setLoading("plan");
    setError(null);

    try {
      const data = await postJson<PlanResponse>("/api/plan", {
        idea: idea.trim(),
        techStack: techStack.trim(),
        answers: buildAnswerPayload(questions, answers),
      });

      if (!Array.isArray(data.features) || data.features.length === 0) {
        throw new Error("AI tidak mengembalikan fitur untuk peta konsep.");
      }

      const features = data.features.map((feature, index) => ({
        id: feature.id || `f${index + 1}`,
        phase: feature.phase || `FASE ${Math.min(index + 1, 3)}`,
        title: feature.title || `Fitur ${index + 1}`,
        status: feature.status || "Direncanakan",
        subFeatures: Array.isArray(feature.subFeatures)
          ? feature.subFeatures
          : [],
      }));

      setMindmap({
        projectName:
          data.projectName?.trim() || deriveProjectName(idea) || "Proyek Baru",
        features,
      });
      setStep("mindmap");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateDocs = async () => {
    if (!mindmap) {
      setError("Peta konsep belum tersedia.");
      return;
    }

    const projectName = mindmap.projectName.trim();
    if (!projectName) {
      setError("Nama proyek wajib diisi di panel editor fitur.");
      return;
    }

    const cleaned = cleanFeatures(mindmap.features);
    const validationError = validateFeatures(cleaned);
    if (validationError) {
      setError(validationError);
      return;
    }

    setMindmap({ ...mindmap, projectName, features: cleaned });
    setLoading("generate");
    setError(null);

    try {
      const data = await postJson<GenerateResponse>("/api/generate", {
        projectName,
        idea: idea.trim(),
        techStack: techStack.trim(),
        answers: buildAnswerPayload(questions, answers),
        features: cleaned,
      });

      setDocs(data);
      setStep("workspace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  const handleRevision = async (instruction: string, activeDoc: DocTab) => {
    if (!mindmap || !docs) {
      throw new Error("Dokumen belum tersedia untuk direvisi.");
    }

    const cleaned = cleanFeatures(mindmap.features);
    const validationError = validateFeatures(cleaned);

    setLoading("revision");
    setError(null);

    try {
      if (validationError) throw new Error(validationError);

      const data = await postJson<GenerateResponse>("/api/generate", {
        projectName: mindmap.projectName.trim(),
        idea: idea.trim(),
        techStack: techStack.trim(),
        answers: buildAnswerPayload(questions, answers),
        features: cleaned,
        revisionInstruction: instruction,
        activeDoc,
        currentDocs: docs,
      });

      setDocs(data);
    } catch (caught) {
      const message = toErrorMessage(caught);
      setError(message);
      throw caught;
    } finally {
      setLoading(null);
    }
  };

  const currentProjectName =
    mindmap?.projectName?.trim() || deriveProjectName(idea) || "Proyek baru";
  const currentStepIndex = STEP_META.findIndex((item) => item.key === step);

  return (
    <div className="flex min-h-screen">
      <SidebarHistory
        projects={projects}
        currentId={currentId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={resetWorkspace}
        onOpen={applyProject}
        onDelete={handleDeleteProject}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#0b0f17]">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar riwayat"
            >
              <Menu />
            </Button>

            <div className="flex items-center gap-2 lg:hidden">
              <BrandMark />
              <span className="text-sm font-medium text-slate-100">VibePlan</span>
            </div>

            <div className="hidden min-w-0 flex-1 items-center lg:flex">
              <span className="truncate text-sm text-slate-400">
                {currentProjectName}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <span className="font-mono text-[10px] text-slate-600 md:hidden">
                {currentStepIndex + 1}/4
              </span>
              <StepProgress current={step} />
              <span className="hidden text-[10px] text-slate-600 sm:block">
                local-first
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
            {error ? (
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            ) : null}

            {step === "idea" ? (
              <IdeaInputStep
                idea={idea}
                techStack={techStack}
                loading={loading === "clarify"}
                error={null}
                onIdeaChange={setIdea}
                onTechStackChange={setTechStack}
                onStart={handleStartClarify}
              />
            ) : null}

            {step === "clarify" ? (
              <ClarificationStep
                questions={questions}
                answers={answers}
                loading={loading === "plan"}
                error={null}
                onAnswerChange={handleAnswerChange}
                onBack={() => {
                  setStep("idea");
                  setError(null);
                }}
                onSubmit={handleCreatePlan}
              />
            ) : null}

            {step === "mindmap" && mindmap ? (
              <FeatureMindmap
                mindmap={mindmap}
                loading={loading === "generate"}
                error={null}
                onMindmapChange={setMindmap}
                onBack={() => {
                  setStep("clarify");
                  setError(null);
                }}
                onContinue={handleGenerateDocs}
              />
            ) : null}

            {step === "workspace" && mindmap && docs ? (
              <WorkspaceOutput
                projectName={mindmap.projectName}
                docs={docs}
                revisionLoading={loading === "revision"}
                onRevision={handleRevision}
                onBack={() => {
                  setStep("mindmap");
                  setError(null);
                }}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
