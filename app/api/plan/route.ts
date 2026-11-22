import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { vikey } from "@/lib/ai";
import {
  aiErrorResponse,
  invalidInputResponse,
  missingKeyResponse,
  readJson,
} from "@/lib/api-utils";
import { planRequestSchema, planSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah software architect senior yang merancang feature tree untuk produk digital.
Tugasmu mengubah ide, tech stack, dan jawaban klarifikasi menjadi peta konsep fitur yang siap dieksekusi oleh AI coding agent.

ATURAN WAJIB:
1. Hasilkan 4-6 fitur utama (minimal 3, maksimal 8) dalam bahasa Indonesia.
2. projectName harus singkat (1-4 kata), menarik, relevan, tanpa tanda kutip, dan cocok sebagai nama produk.
3. Setiap fitur memiliki 3-5 subFeatures yang spesifik, dapat diimplementasikan, dan tidak saling tumpang tindih.
4. Gunakan fase "FASE 1", "FASE 2", atau "FASE 3". Urutkan fitur berdasarkan prioritas MVP: FASE 1 adalah fondasi/alur inti.
5. Semua status fitur harus "Direncanakan".
6. FASE 1 wajib mencakup fondasi teknis dan alur utama yang membuat produk bisa dipakai end-to-end.
7. Sub-fitur harus berupa pekerjaan nyata, misalnya "Form login email & password", bukan kategori samar seperti "UI" atau "Backend".
8. Pertimbangkan tech stack pilihan pengguna agar fitur realistis dan relevan.
9. Sertakan fitur pendukung penting seperti keamanan, pembayaran, notifikasi, dashboard, atau admin bila relevan dengan ide.
10. ID fitur unik dan berurutan: f1, f2, f3, dan seterusnya.
11. Jangan memberikan penjelasan di luar JSON. Kembalikan data sesuai skema.`;

export async function POST(request: Request) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  const parsed = planRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalidInputResponse(parsed.error);

  const { idea, techStack, answers } = parsed.data;

  const answerText =
    answers.length > 0
      ? answers
          .map((answer, index) => {
            const selected = answer.selectedOption
              ? `Pilihan: ${answer.selectedOption}`
              : "Pilihan: -";
            const detail = answer.customDetail
              ? `Detail tambahan: ${answer.customDetail}`
              : "Detail tambahan: -";
            return `${index + 1}. ${answer.question}\n   ${selected}\n   ${detail}`;
          })
          .join("\n")
      : "Pengguna belum memberikan jawaban detail. Gunakan asumsi paling masuk akal dan tandai cakupan MVP secara konservatif.";

  try {
    const { object } = await generateObject({
      model: vikey,
      schema: planSchema,
      mode: "json",
      temperature: 0.45,
      maxTokens: 3500,
      system: SYSTEM_PROMPT,
      prompt: `IDE APLIKASI:
${idea}

TECH STACK:
${techStack}

JAWABAN KLARIFIKASI:
${answerText}

Susun feature tree final untuk proyek ini. Buat struktur tiga kolom yang akan divisualisasikan sebagai root proyek, fitur utama, dan sub-fitur.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("[api/plan]", error);
    return aiErrorResponse(error);
  }
}
