import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { vikey } from "@/lib/ai";
import {
  aiErrorResponse,
  invalidInputResponse,
  missingKeyResponse,
  readJson,
} from "@/lib/api-utils";
import { generateRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

type DocKey = "prd" | "tasks" | "rules";

const DOC_LABELS: Record<DocKey, string> = {
  prd: "PRD.md",
  tasks: "TASKS.md",
  rules: ".cursorrules",
};

const singleDocSchema = z.object({
  content: z
    .string()
    .min(20)
    .describe("Isi lengkap dokumen dalam Markdown/teks tanpa code fence pembungkus"),
});

const SHARED_RULES = `ATURAN GLOBAL:
- Bahasa Indonesia profesional, jelas, dan actionable. Istilah teknis boleh tetap bahasa Inggris.
- Dokumen harus konsisten dengan ide, tech stack, jawaban klarifikasi, dan feature tree yang diberikan.
- Jangan membungkus seluruh isi dokumen dengan triple backtick. Field content berisi Markdown/teks mentah.
- Jangan memakai placeholder seperti "TODO" atau "isi nanti" pada bagian inti.
- Fitur dan fase harus sama persis dengan feature tree. Jangan menambah cakupan yang tidak diminta.
- Jika perlu asumsi karena informasi kurang, tulis eksplisit sebagai asumsi singkat.
- Ringkas tetapi konkret. Hindari pengulangan dan basa-basi.
- Kembalikan JSON object dengan field "content" berisi dokumen lengkap, tanpa teks lain di luar JSON.`;

const PRD_SYSTEM = `Kamu adalah technical writer dan software architect senior.
Tugasmu HANYA menulis dokumen PRD.md.

WAJIB memuat bagian berikut dengan urutan sama:
# PRD — <Nama Proyek>
## 1. Ringkasan Produk
## 2. Tujuan & Metrik Keberhasilan
## 3. Target Pengguna & Persona
## 4. User Flow Utama
## 5. Fitur per Fase
## 6. Arsitektur Sistem
## 7. Tech Stack & Alasan
## 8. Struktur Folder yang Disarankan
## 9. Skema Database / Model Data
## 10. Integrasi Eksternal
## 11. Aturan Bisnis & Validasi
## 12. Non-Functional Requirements
## 13. Roadmap MVP
## 14. Risiko & Mitigasi

PANDUAN:
- Target panjang 900-1500 kata. Padat, bukan dangkal.
- Gunakan tabel Markdown bila membuat informasi lebih jelas.
- Struktur folder harus nyata sesuai tech stack (bukan folder generik).
- Skema database harus konkret: nama tabel, field penting, tipe, relasi, dan index unik bila relevan.
- User flow ditulis langkah demi langkah untuk alur utama.
- Metrik harus terukur.
- Jangan menulis TASKS.md atau .cursorrules di dalam PRD.`;

const TASKS_SYSTEM = `Kamu adalah tech lead yang menulis instruksi eksekusi untuk AI coding agent.
Tugasmu HANYA menulis dokumen TASKS.md.

STRUKTUR WAJIB:
# TASKS — <Nama Proyek>
Paragraf singkat cara memakai dokumen dan urutan eksekusi.
## FASE 1 — <tema fase>
- [ ] 1.1 <judul task>
  Prompt untuk AI coding agent (di dalam code fence):
  Jelaskan konteks, tujuan, file yang dibuat/diubah, langkah implementasi, batasan, dan kriteria selesai yang bisa diverifikasi.
- [ ] 1.2 ...
## FASE 2 ...
## FASE 3 ...

PANDUAN:
- Target panjang 1000-1800 kata.
- FASE 1 minimal 5 task; fase berikutnya minimal 3 task.
- Setiap task harus cukup kecil untuk satu sesi AI coding dan berurutan tanpa tumpang tindih.
- Setiap prompt wajib menyebut file target, langkah teknis, dan kriteria selesai.
- Sertakan perintah verifikasi (build/typecheck/lint/test) pada task yang relevan.
- Prompt harus siap copy-paste dan menyebut tech stack serta konvensi proyek.
- Gunakan checkbox Markdown untuk daftar task.
- Jangan menulis PRD atau .cursorrules di dalam TASKS.`;

const RULES_SYSTEM = `Kamu adalah principal engineer yang menulis aturan untuk AI coding agent.
Tugasmu HANYA menulis dokumen .cursorrules.

WAJIB memuat aturan tegas untuk:
- Peran dan tujuan file ini.
- Batasan tech stack (wajib dan terlarang).
- Konvensi penamaan file, komponen, variabel, tipe, dan API.
- Pola arsitektur dan struktur folder.
- Aturan state management, data fetching, validasi, dan error handling.
- Aturan styling/UI dan aksesibilitas.
- Keamanan, environment variables, dan larangan membocorkan secret.
- Testing dan perintah wajib (install, dev, build, lint, typecheck).
- Cara AI coding agent bekerja: baca konteks dulu, perubahan kecil, jangan merusak API publik, verifikasi sebelum selesai.

PANDUAN:
- Target panjang 500-900 kata.
- Tulis sebagai instruksi imperatif yang bisa dipatuhi AI agent, bukan esai.
- Spesifik untuk tech stack proyek ini, bukan aturan generik semua proyek.
- Jangan menulis PRD atau TASKS di dalam .cursorrules.`;

const DOC_SPECS: Record<
  DocKey,
  { system: string; maxTokens: number; instruction: string }
> = {
  prd: {
    system: PRD_SYSTEM,
    maxTokens: 12000,
    instruction:
      "Tulis PRD.md lengkap dan final berdasarkan konteks proyek di atas.",
  },
  tasks: {
    system: TASKS_SYSTEM,
    maxTokens: 14000,
    instruction:
      "Tulis TASKS.md lengkap dan berurutan berdasarkan feature tree di atas.",
  },
  rules: {
    system: RULES_SYSTEM,
    maxTokens: 8000,
    instruction:
      "Tulis .cursorrules lengkap yang mengunci konvensi dan tech stack proyek di atas.",
  },
};

function formatAnswers(
  answers: {
    question: string;
    selectedOption?: string;
    customDetail?: string;
  }[],
) {
  if (answers.length === 0) return "Tidak ada jawaban klarifikasi.";

  return answers
    .map((answer, index) => {
      const parts = [`${index + 1}. ${answer.question}`];
      if (answer.selectedOption) parts.push(`   Pilihan: ${answer.selectedOption}`);
      if (answer.customDetail) parts.push(`   Detail: ${answer.customDetail}`);
      return parts.join("\n");
    })
    .join("\n");
}

function formatFeatures(
  features: {
    id: string;
    phase: string;
    title: string;
    status: string;
    subFeatures: string[];
  }[],
) {
  return features
    .map(
      (feature) =>
        `- [${feature.phase}] ${feature.title} (${feature.status})\n${feature.subFeatures
          .map((sub) => `  - ${sub}`)
          .join("\n")}`,
    )
    .join("\n");
}

async function generateDocument(
  doc: DocKey,
  context: string,
  revision?: {
    instruction: string;
    currentContent: string;
    activeDoc: DocKey;
  },
) {
  const spec = DOC_SPECS[doc];
  const prompt = revision
    ? `${context}

MODE: REVISI CEPAT
INSTRUKSI REVISI DARI PENGGUNA:
${revision.instruction}
DOKUMEN YANG DIREVISI: ${DOC_LABELS[revision.activeDoc]}

DOKUMEN SAAT INI:
<current_document>
${revision.currentContent}
</current_document>

Terapkan instruksi revisi secara presisi pada dokumen ini. Pertahankan bagian yang tidak diminta untuk diubah. Kembalikan versi terbaru yang lengkap.`
    : `${context}

TUGAS: ${spec.instruction}`;

  const { object } = await generateObject({
    model: vikey,
    schema: singleDocSchema,
    schemaName: doc,
    mode: "json",
    temperature: revision ? 0.25 : 0.35,
    maxTokens: spec.maxTokens,
    system: `${spec.system}\n\n${SHARED_RULES}`,
    prompt,
  });

  return object.content.trim();
}

function logGenerateError(error: unknown) {
  console.error("[api/generate]", error);

  if (error && typeof error === "object") {
    const debug = error as {
      text?: string;
      finishReason?: string;
      usage?: unknown;
      cause?: unknown;
    };
    console.error("[api/generate:debug]", {
      finishReason: debug.finishReason,
      textLength: debug.text?.length,
      usage: debug.usage,
      cause: debug.cause instanceof Error ? debug.cause.message : debug.cause,
    });
  }
}

export async function POST(request: Request) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  const parsed = generateRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalidInputResponse(parsed.error);

  const {
    projectName,
    idea,
    techStack,
    answers,
    features,
    revisionInstruction,
    activeDoc,
    currentDocs,
  } = parsed.data;

  const context = `NAMA PROYEK: ${projectName}

IDE APLIKASI:
${idea}

TECH STACK:
${techStack}

JAWABAN KLARIFIKASI:
${formatAnswers(answers)}

FEATURE TREE FINAL:
${formatFeatures(features)}`;

  try {
    if (revisionInstruction && currentDocs) {
      const target: DocKey = activeDoc ?? "prd";
      const revised = await generateDocument(target, context, {
        instruction: revisionInstruction,
        currentContent: currentDocs[target],
        activeDoc: target,
      });

      return NextResponse.json({
        ...currentDocs,
        [target]: revised,
      });
    }

    const [prd, tasks, rules] = await Promise.all([
      generateDocument("prd", context),
      generateDocument("tasks", context),
      generateDocument("rules", context),
    ]);

    return NextResponse.json({ prd, tasks, rules });
  } catch (error) {
    logGenerateError(error);
    return aiErrorResponse(error);
  }
}
