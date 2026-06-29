"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Layers, GraduationCap, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { useResearchStore } from "@/lib/store";
import type { ResearchMode } from "@/lib/types";

function useTypewriter(texts: string[]): string {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    let deleting = false;
    let current = "";

    const tick = () => {
      const target = texts[idx];
      if (!deleting) {
        if (current.length < target.length) {
          current = target.slice(0, current.length + 1);
          setDisplayed(current);
          timer = setTimeout(tick, 52);
        } else {
          timer = setTimeout(() => { deleting = true; tick(); }, 2600);
        }
      } else {
        if (current.length > 0) {
          current = current.slice(0, -1);
          setDisplayed(current);
          timer = setTimeout(tick, 26);
        } else {
          deleting = false;
          idx = (idx + 1) % texts.length;
          timer = setTimeout(tick, 120);
        }
      }
    };

    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  // texts is a module-level constant — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return displayed;
}

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

// Border class per mode
function modeFormClass(mode: ResearchMode): string {
  if (mode === "deep")     return "deep-mode-glow";
  if (mode === "academic") return "ring-1 ring-teal-500/40 rounded-xl";
  return "";
}

function modeInnerBorder(mode: ResearchMode): string {
  if (mode === "deep")     return "border-transparent bg-card";
  if (mode === "academic") return "border-teal-500/30 bg-card";
  return "border-border bg-card";
}

// ── Hero mode ──────────────────────────────────────────────────────────────

export function HeroSearch() {
  const { query, mode, setQuery, setMode, startResearch, status } = useResearchStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "running";
  const typewriterText = useTypewriter(EXAMPLES);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    startResearch();
  };

  return (
    <div className="relative z-10 flex w-full max-w-[640px] flex-col items-center gap-8">

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="gradient-text-hero text-4xl font-bold tracking-tight">
          ResearchOS
        </h1>
        <p className="text-sm text-muted-foreground/70">The AI research workspace</p>
      </motion.div>

      {/* Search input */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full"
      >
        <div className={modeFormClass(mode)}>
          <div className={`relative flex items-end gap-2 rounded-xl border px-4 py-3 shadow-lg transition-colors focus-within:border-ring ${modeInnerBorder(mode)}`}>
            <Search className="mb-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
              placeholder={query ? "Ask anything to research deeply…" : (typewriterText || "Ask anything to research deeply…")}
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                if (e.key === "Escape") setQuery("");
              }}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all disabled:opacity-40 hover:opacity-90 hover:scale-105 active:scale-95"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArrowRight className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      </motion.form>

      {/* Example pills — staggered entrance */}
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07, duration: 0.28 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setQuery(ex); textareaRef.current?.focus(); }}
            className="rounded-full border border-border/60 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-ring/60 hover:bg-white/[0.06] hover:text-foreground"
          >
            {ex}
          </motion.button>
        ))}
      </div>

      {/* Mode selector — glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="flex w-full gap-2"
      >
        {MODES.map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex flex-1 flex-col gap-1 rounded-xl border px-3 py-3 text-left backdrop-blur-sm transition-all duration-200 ${
              mode === value
                ? "border-violet-500/30 bg-violet-500/8 text-foreground shadow-[0_0_16px_rgba(124,58,237,0.12)]"
                : "border-border/40 bg-white/[0.02] text-muted-foreground hover:border-border/70 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 transition-colors ${
                mode === value ? "text-violet-400" : ""
              }`} />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <span className="text-[10px] leading-snug opacity-60">{desc}</span>
          </button>
        ))}
      </motion.div>

      <p className="text-[10px] text-muted-foreground/30">⌘K to focus · Enter to search · Esc to clear</p>
    </div>
  );
}

// ── Compact mode ───────────────────────────────────────────────────────────

export function CompactSearch() {
  const { query, mode, setQuery, startResearch, resetResearch, status } = useResearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "running";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
      {isLoading
        ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-primary" />
        : <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      }
      <input
        ref={inputRef}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder="New research question…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
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
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ArrowRight className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </form>
  );
}
