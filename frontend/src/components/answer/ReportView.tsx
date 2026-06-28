"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResearchResponse } from "@/lib/types";

interface ReportViewProps {
  query: string;
  mode: string;
  response: ResearchResponse | null;
  isLoading: boolean;
}

export function ReportView({ query, mode, response, isLoading }: ReportViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <div className="pt-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    );
  }

  if (!response) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      {/* Query header */}
      <div className="flex flex-wrap items-start gap-2">
        <h2 className="flex-1 text-base font-semibold leading-snug">{query}</h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
          {mode}
        </span>
      </div>

      {/* Sub-question pills */}
      {response.sub_questions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {response.sub_questions.map((q, i) => (
            <span
              key={i}
              className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {q}
            </span>
          ))}
        </div>
      )}

      {/* Report body */}
      <article className="max-w-none text-sm leading-7">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-3 mt-8 text-xl font-bold tracking-tight">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-7 border-b border-border pb-1.5 text-base font-semibold tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-sm font-semibold">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-foreground/90">{children}</p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                {children}
              </code>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-5 list-disc space-y-1.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-5 list-decimal space-y-1.5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-foreground/90">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mb-4 border-l-2 border-border pl-4 text-muted-foreground">
                {children}
              </blockquote>
            ),
          }}
        >
          {response.report}
        </ReactMarkdown>
      </article>
    </motion.div>
  );
}
