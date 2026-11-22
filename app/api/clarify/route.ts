import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { vikey } from "@/lib/ai";
import {
  aiErrorResponse,
  invalidInputResponse,
  missingKeyResponse,
  readJson,
} from "@/lib/api-utils";
import { clarifyRequestSchema, clarifySchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah senior product architect dan AI software planner untuk VibePlan.
Tugasmu mengubah ide aplikasi mentah menjadi pertanyaan klarifikasi yang tajam sebelum aplikasi dibangun oleh AI coding agent.

ATURAN WAJIB:
1. Hasilkan tepat 6 pertanyaan (boleh 5-7) dalam bahasa Indonesia yang natural dan profesional.
2. Setiap pertanyaan HARUS memiliki tepat 3 opsi jawaban singkat, konkret, dan saling berbeda.
3. Jangan menanyakan hal yang sudah jelas pada ide atau tech stack pengguna.
4. Prioritaskan cakupan berikut: alur utama pengguna, peran/hak akses pengguna, struktur data inti, aturan bisnis spesifik, integrasi eksternal, dan prioritas fitur MVP.
5. Pertanyaan harus spesifik untuk produk yang dimaksud, bukan pertanyaan generik. Sebutkan konteks produk bila membantu.
6. Kategori harus singkat, misalnya: "Alur Utama", "Peran Pengguna", "Struktur Data", "Aturan Bisnis", "Integrasi", "Prioritas MVP".
7. Gunakan id unik berurutan: q1, q2, q3, dan seterusnya.
8. Opsi jawaban maksimal sekitar 12 kata agar mudah diklik.
9. Fokus pada keputusan arsitektur dan produk yang benar-benar memengaruhi implementasi.
10. Jangan memberikan penjelasan di luar JSON. Kembalikan data sesuai skema.`;

export async function POST(request: Request) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  const parsed = clarifyRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalidInputResponse(parsed.error);

  const { idea, techStack } = parsed.data;

  try {
    const { object } = await generateObject({
      model: vikey,
      schema: clarifySchema,
      mode: "json",
      temperature: 0.5,
      maxTokens: 2500,
      system: SYSTEM_PROMPT,
      prompt: `IDE APLIKASI:
${idea}

TECH STACK PILIHAN:
${techStack}

Susun pertanyaan klarifikasi hybrid untuk proyek ini. Pastikan setiap pertanyaan membantu menentukan alur, data, aturan bisnis, integrasi, dan batas MVP yang akan dituangkan ke PRD, TASKS.md, dan .cursorrules.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("[api/clarify]", error);
    return aiErrorResponse(error);
  }
}
