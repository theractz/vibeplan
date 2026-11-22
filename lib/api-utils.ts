import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { describeAIError, isVikeyConfigured } from "@/lib/ai";

export function missingKeyResponse() {
  if (isVikeyConfigured()) return null;

  return NextResponse.json(
    {
      error:
        "VIKEY_API_KEY belum diisi. Tambahkan API key Vikey.ai ke file .env.local lalu restart server.",
    },
    { status: 500 },
  );
}

export function invalidInputResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: "Input tidak valid. Periksa kembali data yang dikirim.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

export function aiErrorResponse(error: unknown) {
  const raw = describeAIError(error);
  const isParseError =
    error instanceof Error &&
    (error.name.includes("NoObjectGenerated") ||
      /parse|json|object/i.test(raw));

  return NextResponse.json(
    {
      error: isParseError
        ? `Respons AI tidak dapat diparse menjadi data terstruktur. Coba lagi. Detail: ${raw}`
        : `Gagal memproses permintaan AI. Detail: ${raw}`,
    },
    { status: 502 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
