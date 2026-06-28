"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Source } from "@/lib/types";

interface KnowledgeGraphProps {
  sources: Source[];
  query: string;
}

const SOURCE_COLORS: Record<string, string> = {
  arxiv: "#ef4444",
  github: "#6b7280",
  web: "#3b82f6",
  huggingface: "#eab308",
  reddit: "#f97316",
};

export function KnowledgeGraph({ sources, query }: KnowledgeGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const centerNode: Node = {
      id: "query",
      position: { x: 400, y: 250 },
      data: { label: query.slice(0, 40) + (query.length > 40 ? "…" : "") },
      style: {
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "none",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        padding: "8px 12px",
        maxWidth: "180px",
      },
    };

    const radius = 220;
    const angleStep = (2 * Math.PI) / Math.max(sources.length, 1);

    const sourceNodes: Node[] = sources.slice(0, 12).map((source, i) => {
      const angle = i * angleStep;
      return {
        id: `source-${i}`,
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 250 + radius * Math.sin(angle),
        },
        data: {
          label: source.title.slice(0, 30) + (source.title.length > 30 ? "…" : ""),
        },
        style: {
          background: SOURCE_COLORS[source.source_type] + "26",
          border: `1px solid ${SOURCE_COLORS[source.source_type]}66`,
          borderRadius: "6px",
          fontSize: "11px",
          padding: "6px 10px",
          maxWidth: "150px",
          color: SOURCE_COLORS[source.source_type],
        },
      };
    });

    const edges: Edge[] = sourceNodes.map((node) => ({
      id: `edge-${node.id}`,
      source: "query",
      target: node.id,
      style: { stroke: "hsl(var(--border))", strokeWidth: 1 },
    }));

    return { nodes: [centerNode, ...sourceNodes], edges };
  }, [sources, query]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (sources.length === 0) return null;

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-lg border border-border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--muted-foreground))" gap={24} size={1} />
        <Controls
          showInteractive={false}
          style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
        />
      </ReactFlow>
    </div>
  );
}
