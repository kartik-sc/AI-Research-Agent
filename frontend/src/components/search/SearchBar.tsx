"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ResearchMode } from "@/lib/types";

interface SearchBarProps {
  onSubmit: (query: string, mode: ResearchMode) => void;
  isLoading: boolean;
}

const MODES: { value: ResearchMode; label: string; hint: string }[] = [
  { value: "quick", label: "Quick", hint: "~30s · 1 agent" },
  { value: "deep", label: "Deep", hint: "~2min · full pipeline" },
  { value: "academic", label: "Academic", hint: "arxiv + citations" },
  { value: "repository", label: "Repo", hint: "GitHub analysis" },
];

export function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ResearchMode>("deep");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim(), mode);
  };

  const activeMode = MODES.find((m) => m.value === mode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative flex items-start gap-2 rounded-xl border border-border bg-background p-3 shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          <textarea
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            placeholder="Enter a research question…"
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? "Analyzing…" : "Analyze"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={mode} onValueChange={(v) => setMode(v as ResearchMode)}>
            <TabsList className="h-8">
              {MODES.map((m) => (
                <TabsTrigger key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {activeMode && (
            <span className="text-xs text-muted-foreground">
              {activeMode.hint}
            </span>
          )}
        </div>
      </form>
    </motion.div>
  );
}
