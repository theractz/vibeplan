"use client";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Feature, MindmapData } from "@/lib/types";
import { cn } from "@/lib/utils";

const X_ROOT = 0;
const X_FEATURE = 360;
const X_SUB = 750;
const ROW_STEP = 210;

type RootData = {
  label: string;
  featureCount: number;
};

type FeatureData = {
  title: string;
  phase: string;
  status: string;
  subCount: number;
  active: boolean;
};

type SubData = {
  items: string[];
  active: boolean;
};

type RootNodeType = Node<RootData, "root">;
type FeatureNodeType = Node<FeatureData, "feature">;
type SubNodeType = Node<SubData, "sub">;

function RootNodeCard({ data }: NodeProps<RootNodeType>) {
  return (
    <div className="w-[220px] rounded-lg border border-slate-700 bg-[#0d121b] p-4">
      <p className="text-[11px] text-slate-600">Proyek</p>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-slate-100">
        {data.label}
      </p>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {data.featureCount} fitur utama
      </p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function FeatureNodeCard({ data }: NodeProps<FeatureNodeType>) {
  return (
    <div
      className={cn(
        "w-[250px] rounded-lg border bg-[#0d121b] p-4 transition-colors",
        data.active ? "border-slate-600" : "border-slate-800",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-amber-400">
          {data.phase}
        </span>
        <span className="text-[10px] text-slate-600">{data.subCount} sub</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-slate-100">
        {data.title}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{data.status}</p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function SubNodeCard({ data }: NodeProps<SubNodeType>) {
  const items = data.items.filter((item) => item.trim().length > 0);

  return (
    <div
      className={cn(
        "w-[270px] rounded-lg border bg-[#0d121b] p-4 transition-colors",
        data.active ? "border-slate-600" : "border-slate-800",
      )}
    >
      <p className="text-[11px] text-slate-600">Sub-fitur</p>
      {items.length === 0 ? (
        <p className="mt-2 text-[11px] text-slate-600">Belum ada sub-fitur.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400"
            >
              <span className="shrink-0 text-slate-600">–</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = {
  root: RootNodeCard,
  feature: FeatureNodeCard,
  sub: SubNodeCard,
};

interface FeatureEditorProps {
  feature: Feature;
  index: number;
  active: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Feature>) => void;
  onDelete: () => void;
}

function FeatureEditor({
  feature,
  index,
  active,
  onSelect,
  onUpdate,
  onDelete,
}: FeatureEditorProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 transition-colors",
        active
          ? "border-slate-600 bg-slate-900/60"
          : "border-slate-800 bg-transparent",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSelect}
          className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-200"
        >
          Fitur {String(index + 1).padStart(2, "0")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus ${feature.title}`}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-red-950/50 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Input
        value={feature.title}
        onChange={(event) => onUpdate({ title: event.target.value })}
        onFocus={onSelect}
        placeholder="Judul fitur"
        className="mt-2 h-8 px-2 text-xs"
      />

      <div className="mt-2 grid grid-cols-[1fr_96px] gap-2">
        <Input
          value={feature.phase}
          onChange={(event) => onUpdate({ phase: event.target.value })}
          onFocus={onSelect}
          placeholder="FASE 1"
          className="h-8 px-2 font-mono text-[11px] uppercase"
        />
        <Input
          value={feature.status}
          onChange={(event) => onUpdate({ status: event.target.value })}
          onFocus={onSelect}
          placeholder="Direncanakan"
          className="h-8 px-2 text-[11px]"
        />
      </div>

      <label className="mt-3 block text-[11px] text-slate-600">
        Sub-fitur (3–5, satu per baris)
      </label>
      <Textarea
        value={feature.subFeatures.join("\n")}
        onChange={(event) =>
          onUpdate({ subFeatures: event.target.value.split("\n") })
        }
        onFocus={onSelect}
        rows={4}
        className="mt-1 min-h-[88px] px-2 py-1.5 text-[11px] leading-relaxed"
      />
      <button
        type="button"
        onClick={() =>
          onUpdate({
            subFeatures: [...feature.subFeatures, "Sub-fitur baru"],
          })
        }
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-slate-200"
      >
        <Plus className="h-3 w-3" />
        Tambah baris
      </button>
    </div>
  );
}

interface FeatureMindmapProps {
  mindmap: MindmapData;
  loading: boolean;
  error: string | null;
  onMindmapChange: (next: MindmapData) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function FeatureMindmap({
  mindmap,
  loading,
  error,
  onMindmapChange,
  onBack,
  onContinue,
}: FeatureMindmapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    mindmap.features[0]?.id ?? null,
  );

  const { projectName, features } = mindmap;

  const updateFeature = (id: string, patch: Partial<Feature>) => {
    onMindmapChange({
      ...mindmap,
      features: mindmap.features.map((feature) =>
        feature.id === id ? { ...feature, ...patch } : feature,
      ),
    });
  };

  const removeFeature = (id: string) => {
    const nextFeatures = mindmap.features.filter((feature) => feature.id !== id);
    onMindmapChange({ ...mindmap, features: nextFeatures });
    if (selectedId === id) {
      setSelectedId(nextFeatures[0]?.id ?? null);
    }
  };

  const addFeature = () => {
    const id = `f-${Date.now().toString(36)}`;
    const nextPhase = `FASE ${Math.min(mindmap.features.length + 1, 3)}`;
    const newFeature: Feature = {
      id,
      phase: nextPhase,
      title: "Fitur Baru",
      status: "Direncanakan",
      subFeatures: [
        "Sub-fitur pertama",
        "Sub-fitur kedua",
        "Sub-fitur ketiga",
      ],
    };

    onMindmapChange({
      ...mindmap,
      features: [...mindmap.features, newFeature],
    });
    setSelectedId(id);
  };

  const { nodes, edges } = useMemo(() => {
    const rootY =
      features.length > 0 ? ((features.length - 1) * ROW_STEP) / 2 : 0;

    const rootNode: RootNodeType = {
      id: "root",
      type: "root",
      position: { x: X_ROOT, y: rootY },
      data: {
        label: projectName.trim() || "Proyek Baru",
        featureCount: features.length,
      },
      draggable: false,
    };

    const featureNodes: FeatureNodeType[] = features.map((feature, index) => ({
      id: `feature-${feature.id}`,
      type: "feature",
      position: { x: X_FEATURE, y: index * ROW_STEP },
      data: {
        title: feature.title.trim() || "Fitur tanpa judul",
        phase: feature.phase.trim() || "FASE 1",
        status: feature.status.trim() || "Direncanakan",
        subCount: feature.subFeatures.filter((item) => item.trim()).length,
        active: feature.id === selectedId,
      },
      draggable: false,
    }));

    const subNodes: SubNodeType[] = features.map((feature, index) => ({
      id: `sub-${feature.id}`,
      type: "sub",
      position: { x: X_SUB, y: index * ROW_STEP },
      data: {
        items: feature.subFeatures,
        active: feature.id === selectedId,
      },
      draggable: false,
    }));

    const flowEdges: Edge[] = features.flatMap((feature) => [
      {
        id: `edge-root-${feature.id}`,
        source: "root",
        target: `feature-${feature.id}`,
        type: "default",
      },
      {
        id: `edge-sub-${feature.id}`,
        source: `feature-${feature.id}`,
        target: `sub-${feature.id}`,
        type: "default",
      },
    ]);

    return {
      nodes: [rootNode, ...featureNodes, ...subNodes],
      edges: flowEdges,
    };
  }, [features, projectName, selectedId]);

  const subFeatureCount = features.reduce(
    (total, feature) =>
      total + feature.subFeatures.filter((item) => item.trim()).length,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs text-slate-600">Langkah 3 dari 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
            Peta konsep
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Edit fitur dan sub-fitur sebelum dokumen dibuat. Klik node untuk
            memilih fitur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft />
            Kembali
          </Button>
          <Button size="lg" onClick={onContinue} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? "Menyusun dokumen..." : "Lanjutkan"}
            {!loading ? <ArrowRight /> : null}
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
            <p className="text-[11px] text-slate-600">
              {features.length} fitur · {subFeatureCount} sub-fitur
            </p>
            <p className="hidden text-[11px] text-slate-600 sm:block">
              Klik node untuk memilih
            </p>
          </div>
          <div className="h-[540px] w-full lg:h-[640px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              minZoom={0.25}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_event, node) => {
                if (node.type === "root") return;
                const featureId = node.id.replace(/^(feature|sub)-/, "");
                setSelectedId(featureId);
              }}
              className="h-full w-full"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1.4}
                color="#2b3950"
              />
              <Controls position="bottom-left" showInteractive={false} />
            </ReactFlow>
          </div>
        </Card>

        <aside className="flex max-h-[686px] min-h-[420px] flex-col overflow-hidden rounded-lg border border-slate-800 bg-[#0d121b]">
          <div className="border-b border-slate-800 p-3.5">
            <p className="text-sm font-medium text-slate-200">Editor fitur</p>
            <label
              htmlFor="project-name"
              className="mt-3 block text-[11px] text-slate-600"
            >
              Nama proyek
            </label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(event) =>
                onMindmapChange({ ...mindmap, projectName: event.target.value })
              }
              placeholder="Nama proyek"
              className="mt-1 h-8 text-sm"
            />
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">
              {features.length === 0 ? (
                <div className="border border-dashed border-slate-800 px-3 py-8 text-center text-xs text-slate-600">
                  Belum ada fitur.
                </div>
              ) : (
                features.map((feature, index) => (
                  <FeatureEditor
                    key={feature.id}
                    feature={feature}
                    index={index}
                    active={selectedId === feature.id}
                    onSelect={() => setSelectedId(feature.id)}
                    onUpdate={(patch) => updateFeature(feature.id, patch)}
                    onDelete={() => removeFeature(feature.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-slate-800 p-3">
            <Button variant="outline" className="w-full" onClick={addFeature}>
              <Plus />
              Tambah fitur
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
