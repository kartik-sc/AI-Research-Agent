"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResearchResult } from "@/lib/types";

interface ReportViewProps {
  result: ResearchResult | null;
  isLoading: boolean;
}

export function ReportView({ result, isLoading }: ReportViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!result) return null;

  const confidence = Math.round(result.confidence_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-base font-semibold leading-snug">
          {result.query}
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            {result.mode}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              confidence >= 80
                ? "border-emerald-500/30 text-emerald-400"
                : confidence >= 60
                ? "border-yellow-500/30 text-yellow-400"
                : "border-red-500/30 text-red-400"
            }`}
          >
            {confidence}% confidence
          </Badge>
        </div>
      </div>

      {result.plan && (
        <div className="rounded-md bg-muted/40 p-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Research plan · {result.plan.sub_queries.length} sub-queries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.plan.sub_queries.map((q, i) => (
              <span
                key={i}
                className="rounded bg-background px-2 py-0.5 text-xs text-foreground"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      <article className="max-w-none text-sm leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-3 mt-6 text-xl font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-6 border-b border-border pb-1 text-lg font-semibold">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-base font-semibold">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-3 text-foreground">{children}</p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                {children}
              </code>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="text-foreground">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
          }}
        >
          {result.report}
        </ReactMarkdown>
      </article>
    </motion.div>
  );
}
