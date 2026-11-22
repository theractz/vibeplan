import { z } from "zod";

export const clarifySchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1).describe("ID unik pendek, contoh q1"),
        category: z
          .string()
          .min(2)
          .describe("Kategori singkat pertanyaan dalam bahasa Indonesia"),
        question: z
          .string()
          .min(8)
          .describe("Pertanyaan klarifikasi yang tajam dan spesifik"),
        options: z
          .array(z.string().min(1))
          .length(3)
          .describe("Tepat tiga opsi jawaban singkat"),
      }),
    )
    .min(5)
    .max(7)
    .describe("Antara 5 sampai 7 pertanyaan klarifikasi"),
});

export const featureSchema = z.object({
  id: z.string().min(1).describe("ID unik fitur, contoh f1"),
  phase: z
    .string()
    .min(3)
    .describe("Label fase berbahasa Indonesia, contoh FASE 1"),
  title: z.string().min(3).describe("Nama fitur utama yang konkret"),
  status: z.string().min(3).describe('Status fitur, gunakan "Direncanakan"'),
  subFeatures: z
    .array(z.string().min(2))
    .min(3)
    .max(5)
    .describe("3 sampai 5 sub-fitur spesifik"),
});

export const planSchema = z.object({
  projectName: z
    .string()
    .min(2)
    .describe("Nama produk yang singkat, menarik, dan relevan"),
  features: z.array(featureSchema).min(3).max(8),
});

export const docsSchema = z.object({
  prd: z
    .string()
    .min(20)
    .describe("Isi lengkap PRD.md dalam Markdown tanpa pembungkus code fence"),
  tasks: z
    .string()
    .min(20)
    .describe("Isi lengkap TASKS.md dalam Markdown tanpa pembungkus code fence"),
  rules: z
    .string()
    .min(20)
    .describe("Isi lengkap .cursorrules dalam teks/Markdown tanpa code fence"),
});

export const clarifyRequestSchema = z.object({
  idea: z.string().trim().min(10, "Ide aplikasi minimal 10 karakter."),
  techStack: z.string().trim().min(2, "Tech stack wajib diisi."),
});

export const planRequestSchema = z.object({
  idea: z.string().trim().min(10),
  techStack: z.string().trim().min(2),
  answers: z
    .array(
      z.object({
        question: z.string(),
        selectedOption: z.string().optional(),
        customDetail: z.string().optional(),
      }),
    )
    .default([]),
});

export const answerSchema = z.object({
  question: z.string(),
  selectedOption: z.string().optional(),
  customDetail: z.string().optional(),
});

export const generateRequestSchema = z.object({
  projectName: z.string().trim().min(1),
  idea: z.string().trim().min(10),
  techStack: z.string().trim().min(2),
  answers: z.array(answerSchema).default([]),
  features: z.array(featureSchema).min(1),
  revisionInstruction: z.string().trim().optional(),
  activeDoc: z.enum(["prd", "tasks", "rules"]).optional(),
  currentDocs: z
    .object({
      prd: z.string(),
      tasks: z.string(),
      rules: z.string(),
    })
    .optional(),
});
