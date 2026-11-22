"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type {
  ClarificationAnswer,
  ClarificationAnswers,
  ClarificationQuestion,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClarificationStepProps {
  questions: ClarificationQuestion[];
  answers: ClarificationAnswers;
  loading: boolean;
  error: string | null;
  onAnswerChange: (questionId: string, patch: ClarificationAnswer) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function ClarificationStep({
  questions,
  answers,
  loading,
  error,
  onAnswerChange,
  onBack,
  onSubmit,
}: ClarificationStepProps) {
  const answered = questions.filter((question) => {
    const answer = answers[question.id];
    return Boolean(answer?.selectedOption || answer?.customDetail?.trim());
  }).length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs text-slate-600">Langkah 2 dari 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
            Klarifikasi
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Pilih satu opsi atau tulis detail sendiri. Keduanya bisa digabung.
          </p>
        </div>
        <p className="text-xs text-slate-600">
          {answered} dari {questions.length} terjawab
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {questions.map((question, index) => {
          const answer = answers[question.id] ?? {};

          return (
            <Card key={question.id} className="p-5">
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="font-mono">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>·</span>
                <span>{question.category}</span>
              </div>

              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-200">
                {question.question}
              </p>

              <div className="mt-4 space-y-1.5">
                {question.options.map((option) => {
                  const selected = answer.selectedOption === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onAnswerChange(question.id, {
                          selectedOption: selected ? undefined : option,
                        })
                      }
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-[13px] leading-snug transition-colors",
                        selected
                          ? "border-slate-600 bg-slate-800 text-slate-100"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                      )}
                    >
                      <span>{option}</span>
                      {selected ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <label
                  htmlFor={`detail-${question.id}`}
                  className="text-[11px] text-slate-600"
                >
                  Detail tambahan (opsional)
                </label>
                <Textarea
                  id={`detail-${question.id}`}
                  value={answer.customDetail ?? ""}
                  onChange={(event) =>
                    onAnswerChange(question.id, {
                      customDetail: event.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1.5 min-h-[64px] text-[13px]"
                  placeholder="Ketik jawaban spesifik atau detail tambahan..."
                />
              </div>
            </Card>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          <ArrowLeft />
          Kembali
        </Button>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <span className="hidden text-xs text-slate-600 md:block">
            Jawaban opsional, tetapi membantu hasil.
          </span>
          <Button size="lg" onClick={onSubmit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? "Menyusun peta..." : "Buat peta konsep"}
          </Button>
        </div>
      </div>
    </div>
  );
}
