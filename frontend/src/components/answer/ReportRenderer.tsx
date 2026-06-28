"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { CitationBadge } from "./CitationBadge";
import { useResearchStore } from "@/lib/store";
import type { Source } from "@/lib/types";
import type { ReactNode } from "react";

interface ReportRendererProps {
  markdown: string;
  sources: Source[];
}

// Walk React children and replace [n] text patterns with CitationBadge
function injectCitations(
  children: ReactNode,
  sources: Source[],
  onCite: (n: number) => void
): ReactNode {
  if (typeof children === "string") {
    const parts = children.split(/(\[\d+\])/g);
    if (parts.length === 1) return children;
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const n = parseInt(match[1], 10);
        return (
          <CitationBadge
            key={i}
            number={n}
            source={sources[n - 1]}
            onClick={() => onCite(n)}
          />
        );
      }
      return part;
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string" || Array.isArray(child)
        ? injectCitations(child, sources, onCite)
        : child
    );
  }

  return children;
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group relative mb-4 overflow-hidden rounded-lg border border-border bg-zinc-950">
      <button
        onClick={copy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-700 hover:text-zinc-200"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto px-4 py-4 text-[12px] leading-6 text-zinc-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function ReportRenderer({ markdown, sources }: ReportRendererProps) {
  const { setHighlightedSource } = useResearchStore();

  const handleCitation = useCallback(
    (n: number) => {
      setHighlightedSource(n);
      // Scroll source card into view
      const el = document.getElementById(`source-card-${n}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Clear highlight after animation completes
      setTimeout(() => setHighlightedSource(null), 1200);
    },
    [setHighlightedSource]
  );

  return (
    <article className="max-w-none text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-xl font-bold tracking-tight text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 border-b border-border pb-2 text-base font-semibold tracking-tight text-foreground">
              <span className="mr-2 inline-block h-4 w-0.5 translate-y-0.5 rounded-full bg-primary/60" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-foreground/90">
              {injectCitations(children, sources, handleCitation)}
            </p>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90">
              {injectCitations(children, sources, handleCitation)}
            </li>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 list-disc space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-1.5">{children}</ol>
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
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return <CodeBlock>{String(children).replace(/\n$/, "")}</CodeBlock>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-primary/40 pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2">{children}</td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
