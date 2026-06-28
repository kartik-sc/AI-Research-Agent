"use client";

import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { GraphTooltip } from "./GraphTooltip";
import { useResearchStore } from "@/lib/store";
import type { KnowledgeEdge, KnowledgeNode } from "@/lib/types";

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// D3 simulation extends nodes with x/y/vx/vy
type SimNode = KnowledgeNode & d3.SimulationNodeDatum;

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  label: string;
  strength: number;
}

const NODE_COLORS: Record<string, string> = {
  concept:   "#7F77DD",
  person:    "#1D9E75",
  paper:     "#378ADD",
  model:     "#D85A30",
  framework: "#BA7517",
  dataset:   "#639922",
};

const LEGEND_TYPES = Object.entries(NODE_COLORS);

function nodeColor(type: string): string {
  return NODE_COLORS[type] ?? "#7F77DD";
}

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simLinksRef = useRef<SimLink[]>([]);

  const [tooltip, setTooltip] = useState<{ node: KnowledgeNode; x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { setQuery, startResearch } = useResearchStore();

  // ── Main D3 setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 500;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // Click empty space → deselect
    svg.on("click", () => {
      setSelectedId(null);
      setTooltip(null);
    });

    const g = svg.append("g");

    // Degree map for radius scaling
    const degreeMap = new Map<string, number>(nodes.map((n) => [n.id, 0]));
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
    });
    const maxDeg = Math.max(...degreeMap.values(), 1);
    const rScale = d3.scaleLinear().domain([0, maxDeg]).range([6, 14]);

    // Nodes starting at center with tiny jitter (so simulation can spread them)
    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 20,
      y: height / 2 + (Math.random() - 0.5) * 20,
    }));

    const simLinks: SimLink[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label,
      strength: e.strength,
    }));
    simLinksRef.current = simLinks;

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode, SimLink>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(90)
          .strength((d) => (d as SimLink).strength * 0.6)
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<SimNode>((d) => rScale(degreeMap.get(d.id) ?? 0) + 12)
      );

    simulationRef.current = simulation;

    // Edge lines
    const linkSel = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, SimLink>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "var(--color-border, #333)")
      .attr("stroke-opacity", (d) => 0.3 + d.strength * 0.5)
      .attr("stroke-width", (d) => 0.5 + d.strength * 1.5);

    // Node circles
    const nodeSel = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", (d) => rScale(degreeMap.get(d.id) ?? 0))
      .attr("fill", (d) => nodeColor(d.type))
      .attr("stroke", "var(--color-background, #000)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Labels for high-degree nodes
    const degreeThreshold = maxDeg * 0.35;
    const labelSel = g
      .append("g")
      .attr("class", "labels")
      .selectAll<SVGTextElement, SimNode>("text")
      .data(simNodes.filter((n) => (degreeMap.get(n.id) ?? 0) >= degreeThreshold))
      .join("text")
      .text((d) => (d.label.length > 16 ? d.label.slice(0, 15) + "…" : d.label))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => rScale(degreeMap.get(d.id) ?? 0) + 12)
      .attr("fill", "var(--color-muted-foreground, #888)")
      .attr("font-size", "9px")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Simulation tick
    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeSel.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labelSel.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSel.call(drag);

    // Hover tooltip
    nodeSel
      .on("mouseenter", (event: MouseEvent, d) => {
        setTooltip({ node: d, x: event.clientX, y: event.clientY });
      })
      .on("mousemove", (event: MouseEvent) => {
        setTooltip((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on("mouseleave", () => setTooltip(null));

    // Click to select (stopPropagation prevents svg deselect)
    nodeSel.on("click", (event: MouseEvent, d) => {
      event.stopPropagation();
      setSelectedId((prev) => (prev === d.id ? null : d.id));
      setTooltip(null);
    });

    // Double-click → new research
    nodeSel.on("dblclick", (event: MouseEvent, d) => {
      event.stopPropagation();
      setQuery(d.label);
      startResearch();
    });

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => g.attr("transform", event.transform.toString()));

    svg.call(zoom);
    zoomRef.current = zoom;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, edges, setQuery, startResearch]);

  // ── Highlight effect when selectedId changes ────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const links = simLinksRef.current;

    if (!selectedId) {
      svg.selectAll<SVGCircleElement, SimNode>("circle").attr("opacity", 1);
      svg
        .selectAll<SVGLineElement, SimLink>("line")
        .attr("stroke-opacity", (d) => 0.3 + d.strength * 0.5);
      return;
    }

    const connected = new Set<string>([selectedId]);
    links.forEach((l) => {
      const s = typeof l.source === "object" ? (l.source as SimNode).id : String(l.source);
      const t = typeof l.target === "object" ? (l.target as SimNode).id : String(l.target);
      if (s === selectedId) connected.add(t);
      if (t === selectedId) connected.add(s);
    });

    svg
      .selectAll<SVGCircleElement, SimNode>("circle")
      .attr("opacity", (d) => (connected.has(d.id) ? 1 : 0.12));

    svg
      .selectAll<SVGLineElement, SimLink>("line")
      .attr("stroke-opacity", (d) => {
        const s = typeof d.source === "object" ? (d.source as SimNode).id : String(d.source);
        const t = typeof d.target === "object" ? (d.target as SimNode).id : String(d.target);
        return s === selectedId || t === selectedId ? 0.9 : 0.03;
      });
  }, [selectedId]);

  // ── Control handlers ────────────────────────────────────────────────────────
  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.5);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1 / 1.5);
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
        Knowledge graph not available for this session
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium">{nodes.length} nodes</span>
          <span className="text-border">·</span>
          <span>{edges.length} edges</span>
          {selectedId && (
            <>
              <span className="text-border">·</span>
              <span className="text-primary">1 selected — double-click to research</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomIn}
            className="rounded-md border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="rounded-md border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Reset view
          </button>
        </div>
      </div>

      {/* Graph canvas */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-border bg-card"
        style={{ height: 500 }}
      >
        <svg ref={svgRef} className="w-full" style={{ display: "block" }} />
        {tooltip && (
          <GraphTooltip
            node={tooltip.node}
            x={tooltip.x}
            y={tooltip.y}
            onResearch={() => {
              setQuery(tooltip.node.label);
              startResearch();
              setTooltip(null);
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND_TYPES.map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] capitalize text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
