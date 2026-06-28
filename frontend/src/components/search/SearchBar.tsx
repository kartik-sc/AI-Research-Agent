"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Layers, GraduationCap, ArrowRight, RotateCcw } from "lucide-react";
import { useResearchStore } from "@/lib/store";
import type { ResearchMode } from "@/lib/types";

const MODES: {
  value: ResearchMode;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { value: "quick",    label: "Quick",    icon: Zap,           desc: "~30s · single agent" },
  { value: "deep",     label: "Deep",     icon: Layers,        desc: "~3min · parallel agents, verified" },
  { value: "academic", label: "Academic", icon: GraduationCap, desc: "~2min · arXiv + Semantic Scholar" },
];

const EXAMPLES = [
  "Explain Mixture of Experts",
  "State of AI agents 2025",
  "Compare Mamba vs Transformer",
  "Latest diffusion model architectures",
];

// ── Hero mode (empty state) ─────────────────────────────────────────────────

export function HeroSearch() {
  const { query, mode, setQuery, setMode, startResearch, status } = useResearchStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "running";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    startResearch();
  };

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-8">

      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          ResearchOS
        </h1>
        <p className="text-sm text-muted-foreground">The AI research workspace</p>
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg transition-colors focus-within:border-ring">
          <Search className="mb-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            placeholder="Ask anything to research deeply…"
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Example pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setQuery(ex); textareaRef.current?.focus(); }}
            className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Mode selector */}
      <div className="flex w-full gap-2">
        {MODES.map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex flex-1 flex-col gap-1 rounded-xl border px-3 py-3 text-left transition-colors ${
              mode === value
                ? "border-ring bg-accent text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${mode === value ? "text-primary" : ""}`} />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <span className="text-[10px] leading-snug opacity-70">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Compact mode (active state) ─────────────────────────────────────────────

export function CompactSearch() {
  const { query, setQuery, startResearch, resetResearch, status } = useResearchStore();
  const isLoading = status === "running";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    startResearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur"
    >
      <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder="New research question…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex items-center gap-2">
        {!isLoading && (
          <button
            type="button"
            onClick={resetResearch}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
