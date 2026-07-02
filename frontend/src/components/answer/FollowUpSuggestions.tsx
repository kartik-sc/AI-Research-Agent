"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lightbulb, ArrowUp } from "lucide-react";
import { useResearchStore } from "@/lib/store";

interface FollowUpSuggestionsProps {
  suggestions: string[];
}

export function FollowUpSuggestions({ suggestions }: FollowUpSuggestionsProps) {
  const { startFollowUp } = useResearchStore();
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    startFollowUp(trimmed);
    router.push("/");
    setValue("");
  }

  return (
    <div className="pb-10">
      {suggestions.length > 0 && (
        <>
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
                onClick={() => startFollowUp(q)}
                className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-foreground"
              >
                {q}
              </motion.button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Ask a follow-up question…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-muted-foreground"
          aria-label="Submit follow-up"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
