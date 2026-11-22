"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRESETS = [
  {
    label: "Next.js + Tailwind + Supabase",
    stack:
      "Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Shadcn UI, Supabase",
  },
  {
    label: "Next.js + Prisma + PostgreSQL",
    stack:
      "Next.js 15 (App Router), React, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS",
  },
  {
    label: "React + Vite + Firebase",
    stack:
      "React, Vite, TypeScript, Firebase Auth, Firestore, Tailwind CSS",
  },
  {
    label: "Next.js + Drizzle + SQLite",
    stack:
      "Next.js 15 (App Router), TypeScript, Drizzle ORM, SQLite, Tailwind CSS",
  },
];

interface IdeaInputStepProps {
  idea: string;
  techStack: string;
  loading: boolean;
  error: string | null;
  onIdeaChange: (value: string) => void;
  onTechStackChange: (value: string) => void;
  onStart: () => void;
}

export function IdeaInputStep({
  idea,
  techStack,
  loading,
  error,
  onIdeaChange,
  onTechStackChange,
  onStart,
}: IdeaInputStepProps) {
  const canStart = idea.trim().length >= 10 && techStack.trim().length >= 2;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="text-xs text-slate-600">Langkah 1 dari 4</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
          Mulai proyek baru
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
          Tulis ide aplikasi dan tentukan tech stack. VibePlan akan menyusun
          pertanyaan klarifikasi sebelum membuat dokumen.
        </p>
      </div>

      <Card>
        <div className="border-b border-slate-800 p-5 md:p-6">
          <label htmlFor="idea" className="text-sm font-medium text-slate-200">
            Ide aplikasi
          </label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(event) => onIdeaChange(event.target.value)}
            rows={7}
            maxLength={4000}
            placeholder="Contoh: Aplikasi manajemen keuangan pribadi untuk mahasiswa. Pengguna bisa mencatat pemasukan dan pengeluaran, membuat budget bulanan, melihat grafik per kategori, dan mendapat pengingat tagihan."
            className="mt-2 min-h-[170px]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-600">
            <span>Semakin spesifik ide, semakin tajam pertanyaannya.</span>
            <span className="shrink-0 font-mono">{idea.length}/4000</span>
          </div>

          <div className="mt-6">
            <label
              htmlFor="tech-stack"
              className="text-sm font-medium text-slate-200"
            >
              Tech stack
            </label>
            <Input
              id="tech-stack"
              value={techStack}
              onChange={(event) => onTechStackChange(event.target.value)}
              placeholder="Ketik stack sendiri atau pilih preset"
              className="mt-2"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PRESETS.map((preset) => {
                const active = techStack === preset.stack;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onTechStackChange(active ? "" : preset.stack)
                    }
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-[11px] transition-colors",
                      active
                        ? "border-slate-600 bg-slate-800 text-slate-100"
                        : "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300",
                    )}
                  >
                    <span>{preset.label}</span>
                    {active ? <Check className="h-3 w-3 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <p className="text-xs text-slate-600">
            AI akan menyusun 5–7 pertanyaan klarifikasi.
          </p>
          <Button
            size="lg"
            onClick={onStart}
            disabled={!canStart || loading}
            className="w-full md:w-auto"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? "Menyusun pertanyaan..." : "Mulai klarifikasi"}
            {!loading ? <ArrowRight /> : null}
          </Button>
        </div>
      </Card>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
