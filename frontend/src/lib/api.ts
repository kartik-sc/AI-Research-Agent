import type {
  AgentEvent,
  ProjectSummary,
  ResearchRequest,
  ResearchResponse,
  SessionDetail,
  SessionSummary,
  SseCompletePayload,
  SsePayload,
} from "./types";

export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── SWR fetcher (attach to useSWR as the second arg) ────────────────────────
export const swrFetcher = <T>(path: string): Promise<T> => apiFetch<T>(path);

// ── Research ─────────────────────────────────────────────────────────────────

export async function startResearch(
  req: ResearchRequest
): Promise<{ session_id: string; status: string }> {
  return apiFetch("/api/research", { method: "POST", body: JSON.stringify(req) });
}

export async function getResult(sessionId: string): Promise<ResearchResponse> {
  return apiFetch(`/api/research/${sessionId}/result`);
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(params?: {
  limit?: number;
  offset?: number;
  project_id?: string;
  search?: string;
}): Promise<SessionSummary[]> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  if (params?.project_id) q.set("project_id", params.project_id);
  if (params?.search) q.set("search", params.search);
  return apiFetch(`/api/sessions?${q.toString()}`);
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  return apiFetch(`/api/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
}

export async function assignProject(
  sessionId: string,
  projectId: string | null
): Promise<SessionSummary> {
  return apiFetch(`/api/sessions/${sessionId}/project`, {
    method: "PATCH",
    body: JSON.stringify({ project_id: projectId }),
  });
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<ProjectSummary[]> {
  return apiFetch("/api/projects");
}

export async function createProject(body: {
  name: string;
  description?: string;
  color: string;
  icon: string;
}): Promise<ProjectSummary> {
  return apiFetch("/api/projects", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
}

// ── SSE stream ────────────────────────────────────────────────────────────────

export function streamResearch(
  sessionId: string,
  onEvent: (event: AgentEvent) => void,
  onComplete: (result: SseCompletePayload) => void,
  onError: (msg: string) => void
): () => void {
  const url = `${BASE}/api/research/stream/${sessionId}`;
  const source = new EventSource(url);

  source.onmessage = (e: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(e.data) as SsePayload;

      if ("type" in payload && payload.type === "complete") {
        onComplete(payload as SseCompletePayload);
        source.close();
        return;
      }

      if ("type" in payload && payload.type === "error") {
        onError((payload as { type: "error"; message: string }).message);
        source.close();
        return;
      }

      onEvent(payload as AgentEvent);
    } catch {
      // ignore malformed frames
    }
  };

  source.onerror = () => {
    onError("Connection to research stream lost");
    source.close();
  };

  return () => source.close();
}
