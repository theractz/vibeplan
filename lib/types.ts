export type AppStep = "idea" | "clarify" | "mindmap" | "workspace";

export type DocTab = "prd" | "tasks" | "rules";

export interface ClarificationQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
}

export interface ClarificationAnswer {
  selectedOption?: string;
  customDetail?: string;
}

export type ClarificationAnswers = Record<string, ClarificationAnswer>;

export interface ClarificationAnswerPayload {
  question: string;
  selectedOption?: string;
  customDetail?: string;
}

export interface Feature {
  id: string;
  phase: string;
  title: string;
  status: string;
  subFeatures: string[];
}

export interface MindmapData {
  projectName: string;
  features: Feature[];
}

export interface ProjectDocs {
  prd: string;
  tasks: string;
  rules: string;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  step: AppStep;
  idea: string;
  techStack: string;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswers;
  mindmap: MindmapData | null;
  docs: ProjectDocs | null;
}

export interface ClarifyResponse {
  questions: ClarificationQuestion[];
}

export interface PlanResponse {
  projectName: string;
  features: Feature[];
}

export type GenerateResponse = ProjectDocs;

export const DOC_TABS: {
  key: DocTab;
  fileName: string;
  label: string;
  description: string;
}[] = [
  {
    key: "prd",
    fileName: "PRD.md",
    label: "PRD.md",
    description: "Blueprint produk lengkap",
  },
  {
    key: "tasks",
    fileName: "TASKS.md",
    label: "TASKS.md",
    description: "Prompt coding per fase",
  },
  {
    key: "rules",
    fileName: ".cursorrules",
    label: ".cursorrules",
    description: "Aturan untuk AI coding agent",
  },
];

export const STEP_META: {
  key: AppStep;
  label: string;
  shortLabel: string;
}[] = [
  { key: "idea", label: "Ide & Stack", shortLabel: "Ide" },
  { key: "clarify", label: "Klarifikasi", shortLabel: "Klarifikasi" },
  { key: "mindmap", label: "Peta Konsep", shortLabel: "Peta" },
  { key: "workspace", label: "Workspace", shortLabel: "Workspace" },
];
