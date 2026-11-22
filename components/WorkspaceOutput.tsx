"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DOC_TABS, type DocTab, type ProjectDocs } from "@/lib/types";

const REVISION_EXAMPLES = [
  "Tambahkan autentikasi Google dan sesuaikan skema database.",
  "Pecah task FASE 1 menjadi langkah yang lebih kecil.",
  "Perketat aturan validasi form dan error handling.",
];

function downloadFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

interface WorkspaceOutputProps {
  projectName: string;
  docs: ProjectDocs;
  revisionLoading: boolean;
  onRevision: (instruction: string, doc: DocTab) => Promise<void>;
  onBack: () => void;
}

export function WorkspaceOutput({
  projectName,
  docs,
  revisionLoading,
  onRevision,
  onBack,
}: WorkspaceOutputProps) {
  const [activeTab, setActiveTab] = useState<DocTab>("prd");
  const [copied, setCopied] = useState<DocTab | null>(null);
  const [instruction, setInstruction] = useState("");

  const activeMeta =
    DOC_TABS.find((tab) => tab.key === activeTab) ?? DOC_TABS[0];

  const handleCopy = async () => {
    await copyText(docs[activeTab]);
    setCopied(activeTab);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const handleDownloadAll = () => {
    DOC_TABS.forEach((tab, index) => {
      window.setTimeout(
        () => downloadFile(tab.fileName, docs[tab.key]),
        index * 250,
      );
    });
  };

  const handleSubmitRevision = async () => {
    const trimmed = instruction.trim();
    if (!trimmed || revisionLoading) return;

    try {
      await onRevision(trimmed, activeTab);
      setInstruction("");
    } catch {
      // Error ditampilkan oleh halaman utama; input dipertahankan.
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs text-slate-600">Langkah 4 dari 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
            {projectName}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Tiga dokumen siap dipakai. Copy, unduh, atau minta revisi pada
            dokumen aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft />
            Edit peta
          </Button>
          <Button onClick={handleDownloadAll}>
            <Download />
            Download semua
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DocTab)}
        >
          <TabsList className="w-full">
            {DOC_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DOC_TABS.map((tab) => {
            const content = docs[tab.key];

            return (
              <TabsContent key={tab.key} value={tab.key}>
                <Card className="overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-slate-200">
                        {tab.fileName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-600">
                        {tab.description} ·{" "}
                        {content.split("\n").length.toLocaleString("id-ID")}{" "}
                        baris
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                      >
                        {copied === tab.key ? <Check /> : <Copy />}
                        {copied === tab.key ? "Tersalin" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(tab.fileName, content)}
                      >
                        <Download />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[66vh] overflow-y-auto p-5 md:p-7">
                    <div className="markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        <Card className="h-fit xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>Revisi dokumen</CardTitle>
            <p className="font-mono text-[11px] text-slate-600">
              {activeMeta.fileName}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={5}
              placeholder="Contoh: Tambahkan role admin, lengkapi skema database, dan sesuaikan task fase 1."
              className="min-h-[120px] text-[13px]"
              disabled={revisionLoading}
            />

            <div className="space-y-1">
              <p className="text-[11px] text-slate-600">Contoh instruksi:</p>
              {REVISION_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInstruction(example)}
                  className="block text-left text-[11px] leading-relaxed text-slate-500 transition-colors hover:text-slate-300"
                >
                  {example}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitRevision}
              disabled={!instruction.trim() || revisionLoading}
            >
              {revisionLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              {revisionLoading ? "Merevisi..." : "Kirim revisi"}
            </Button>

            <p className="text-[10px] leading-relaxed text-slate-600">
              Hanya dokumen aktif yang diperbarui. Dokumen lain tetap.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
