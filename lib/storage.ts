import type { SavedProject } from "@/lib/types";

export const STORAGE_KEY = "vibeplan:projects";
const LAST_PROJECT_KEY = "vibeplan:last-project";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadProjects(): SavedProject[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as SavedProject[])
      .filter(
        (project): project is SavedProject =>
          Boolean(project) &&
          typeof project === "object" &&
          typeof project.id === "string",
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedProject[]) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // localStorage can fail in private mode or when the quota is full.
  }
}

export function upsertProject(project: SavedProject): SavedProject[] {
  const projects = loadProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  const next =
    index >= 0
      ? projects.map((item) => (item.id === project.id ? project : item))
      : [project, ...projects];

  saveProjects(next);
  setLastProjectId(project.id);
  return loadProjects();
}

export function deleteProject(id: string): SavedProject[] {
  const next = loadProjects().filter((project) => project.id !== id);
  saveProjects(next);

  if (getLastProjectId() === id) {
    if (isBrowser()) window.localStorage.removeItem(LAST_PROJECT_KEY);
  }

  return next;
}

export function setLastProjectId(id: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(LAST_PROJECT_KEY, id);
  } catch {
    // Ignore storage failures.
  }
}

export function clearLastProjectId() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getLastProjectId(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
