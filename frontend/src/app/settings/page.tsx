"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ResearchMode } from "@/lib/types";

const MODE_KEY = "researchDefaultMode";

const modes: { value: ResearchMode; label: string; hint: string }[] = [
  { value: "quick", label: "Quick", hint: "Fast answers, fewer sources" },
  { value: "deep", label: "Deep", hint: "Thorough multi-agent research" },
  { value: "academic", label: "Academic", hint: "Rigorous, citation-heavy" },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readStoredMode(): ResearchMode {
  if (typeof window === "undefined") return "deep";
  const stored = window.localStorage.getItem(MODE_KEY);
  if (stored === "quick" || stored === "deep" || stored === "academic") return stored;
  return "deep";
}

export default function SettingsPage() {
  const [defaultMode, setDefaultMode] = useState<ResearchMode>("deep");

  useEffect(() => {
    setDefaultMode(readStoredMode());
  }, []);

  function selectMode(mode: ResearchMode) {
    setDefaultMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODE_KEY, mode);
    }
    toast.success("Default mode updated");
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your research preferences</p>
        </div>

        {/* Section A — Research Defaults */}
        <section className="flex flex-col gap-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Research Defaults
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">
              The mode used when you start a new research session.
            </p>
            <div className="flex flex-wrap gap-2">
              {modes.map((m) => {
                const active = defaultMode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => selectMode(m.value)}
                    className={`flex flex-col items-start gap-0.5 rounded-lg border px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "border-ring bg-accent"
                        : "border-border hover:border-ring hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section B — Appearance */}
        <section className="flex flex-col gap-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Appearance
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Switch between dark and light themes using the toggle at the bottom of the sidebar.
            </p>
          </div>
        </section>

        {/* Section C — About */}
        <section className="flex flex-col gap-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            About
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Application</dt>
                <dd className="font-medium">ResearchOS</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Backend API</dt>
                <dd className="truncate font-medium">{apiUrl}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-medium">v1.0.0</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
