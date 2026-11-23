import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.VIKEY_API_KEY?.trim() || "vikey-api-key-not-configured";
const baseURL =
  process.env.VIKEY_BASE_URL?.trim() || "https://api.vikey.ai/v1";

export const vikeyModelId =
  process.env.VIKEY_MODEL?.trim() || "deepseek/deepseek-v4-flash";

export const vikey = createOpenAI({ apiKey, baseURL }).chat(vikeyModelId, {
  reasoningEffort: "low",
});

export function isVikeyConfigured() {
  return Boolean(process.env.VIKEY_API_KEY?.trim());
}

export function describeAIError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/\s+/g, " ").trim();
    return message.length > 500 ? `${message.slice(0, 500)}...` : message;
  }

  return "Terjadi kesalahan tidak dikenal saat menghubungi model AI.";
}
