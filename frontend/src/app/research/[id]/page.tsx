import { notFound } from "next/navigation";
import { ReportView } from "@/components/answer/ReportView";
import { SourceList } from "@/components/sources/SourceList";
import type { ResearchResult } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchResult(id: string): Promise<ResearchResult | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/api/research/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ResearchPage({ params }: PageProps) {
  const { id } = await params;
  const result = await fetchResult(id);

  if (!result) notFound();

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <ReportView result={result} isLoading={false} />
        </div>
        <div className="w-72 overflow-y-auto border-l border-border p-4">
          <SourceList sources={result.sources} isLoading={false} />
        </div>
      </main>
    </div>
  );
}
