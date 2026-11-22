"use client";

import { Plus, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { STEP_META, type SavedProject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarHistoryProps {
  projects: SavedProject[];
  currentId: string | null;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onOpen: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

function stepLabel(step: SavedProject["step"]) {
  return STEP_META.find((item) => item.key === step)?.shortLabel ?? "Ide";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SidebarHistory({
  projects,
  currentId,
  open,
  onClose,
  onNew,
  onOpen,
  onDelete,
}: SidebarHistoryProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[272px] shrink-0 flex-col border-r border-slate-800 bg-[#080b11] transition-transform lg:static lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 text-[10px] font-semibold text-slate-300">
              VP
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">VibePlan</p>
              <p className="text-[10px] text-slate-600">Product planner</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Tutup sidebar"
          >
            <X />
          </Button>
        </div>

        <div className="p-3">
          <Button className="w-full justify-start" onClick={onNew}>
            <Plus />
            Proyek baru
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-slate-500">Riwayat</span>
          <span className="text-[10px] text-slate-600">{projects.length}</span>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 px-2 pb-4">
            {projects.length === 0 ? (
              <div className="mx-2 mt-3 border border-dashed border-slate-800 px-3 py-6">
                <p className="text-xs text-slate-400">Belum ada riwayat.</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Progres proyek tersimpan otomatis di browser ini.
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const active = project.id === currentId;

                return (
                  <div key={project.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onOpen(project)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2.5 pr-9 text-left transition-colors",
                        active
                          ? "border-slate-700 bg-slate-800/60"
                          : "border-transparent hover:bg-slate-900",
                      )}
                    >
                      <span className="block truncate text-[13px] font-medium text-slate-300">
                        {project.name || "Proyek tanpa judul"}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600">
                        <span>{stepLabel(project.step)}</span>
                        <span>·</span>
                        <span>{formatDate(project.updatedAt)}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(project.id);
                      }}
                      aria-label={`Hapus ${project.name || "proyek"}`}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded text-slate-600 opacity-0 transition-opacity hover:bg-red-950/50 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-[10px] leading-relaxed text-slate-600">
            Zero-login. Data tersimpan lokal di browser.
          </p>
        </div>
      </aside>
    </>
  );
}
