"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useResearchStore } from "@/lib/store";

interface FollowUpSuggestionsProps {
  suggestions: string[];
}

export function FollowUpSuggestions({ suggestions }: FollowUpSuggestionsProps) {
  const { setQuery, startResearch } = useResearchStore();

  if (suggestions.length === 0) return null;

  const handleClick = (q: string) => {
    setQuery(q);
    startResearch();
  };

  return (
    <div className="pb-10">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Explore further
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.08 * i }}
            onClick={() => handleClick(q)}
            className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-foreground"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
