"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR, { mutate as globalMutate } from "swr";
import {
  Home,
  FolderOpen,
  Clock,
  Settings2,
  Sun,
  Moon,
  Plus,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { HistoryPanel } from "@/components/sidebar/HistoryPanel";
import { swrFetcher, createProject } from "@/lib/api";
import { useResearchStore } from "@/lib/store";
import type { ProjectSummary } from "@/lib/types";

const NAV_ITEMS = [
  { icon: Home,       label: "Research",  href: "/" },
  { icon: FolderOpen, label: "Projects",  href: "/projects" },
  { icon: Clock,      label: "History",   href: "/history" },
  { icon: Settings2,  label: "Settings",  href: "/settings" },
] as const;

const PRESET_COLORS = [
  "#7F77DD", "#60A5FA", "#34D399", "#F87171",
  "#FBBF24", "#A78BFA", "#F472B6", "#6EE7B7",
];

const ICON_OPTIONS = [
  { key: "folder",   emoji: "🗂️" },
  { key: "research", emoji: "🔬" },
  { key: "lab",      emoji: "🧪" },
  { key: "chart",    emoji: "📊" },
  { key: "book",     emoji: "📚" },
  { key: "globe",    emoji: "🌐" },
  { key: "brain",    emoji: "🧠" },
  { key: "star",     emoji: "⭐" },
];

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const { resetResearch } = useResearchStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("folder");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data: projects } = useSWR<ProjectSummary[]>("/api/projects", swrFetcher);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });
      await globalMutate("/api/projects");
      toast.success("Project created");
      setSheetOpen(false);
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
      setIcon("folder");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border bg-background">

      {/* ── Brand ───────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/90">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight">ResearchOS</span>
      </div>

      {/* ── New Research ─────────────────────────── */}
      <div className="px-3 pb-2">
        <button
          onClick={() => { resetResearch(); router.push("/"); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus className="h-3.5 w-3.5" />
          New Research
        </button>
      </div>

      <Separator />

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* ── Projects ─────────────────────────────── */}
      <div className="px-2 py-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Projects
          </p>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground">
              <Plus className="h-3 w-3" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>New Project</SheetTitle>
                <SheetDescription>
                  Organise your research sessions into a project.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateProject} className="flex flex-col gap-4 px-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Research Project"
                    required
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">
                    Description{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you researching?"
                    rows={2}
                    className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          outline: color === c ? `2px solid ${c}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Icon</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ICON_OPTIONS.map(({ key, emoji }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIcon(key)}
                        className={`flex h-9 items-center justify-center rounded-md border text-lg transition-colors ${
                          icon === key
                            ? "border-ring bg-accent"
                            : "border-border hover:bg-accent/50"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <SheetFooter>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Creating…" : "Create Project"}
                  </button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col gap-0.5">
          {(projects ?? []).slice(0, 5).map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent"
            >
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="flex-1 truncate text-[11px] text-foreground/80">
                {p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name}
              </span>
            </Link>
          ))}

          {(projects ?? []).length === 0 && (
            <p className="px-2.5 py-1 text-[10px] text-muted-foreground/50">
              No projects yet
            </p>
          )}

          <Link
            href="/projects"
            className="mt-0.5 flex items-center gap-1 px-2.5 py-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            All projects
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <Separator />

      {/* ── Recent history ───────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden py-2">
        <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Recent
        </p>
        <div className="flex-1 overflow-hidden">
          <HistoryPanel />
        </div>
      </div>

      {/* ── Theme toggle ─────────────────────────── */}
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {mounted && (theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          ))}
          {mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Toggle theme"}
        </button>
      </div>
    </aside>
  );
}
