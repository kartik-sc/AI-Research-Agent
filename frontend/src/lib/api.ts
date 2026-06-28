import type {
  AgentEvent,
  ResearchRequest,
  ResearchResult,
  SessionSummary,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function startResearch(
  request: ResearchRequest
): Promise<{ session_id: string; status: string }> {
  return apiFetch("/api/research", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getResult(sessionId: string): Promise<ResearchResult> {
  return apiFetch(`/api/research/${sessionId}`);
}

export async function listSessions(): Promise<SessionSummary[]> {
  return apiFetch("/api/sessions");
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
}

export function streamResearch(
  sessionId: string,
  onEvent: (event: AgentEvent) => void,
  onDone: () => void,
  onError: (msg: string) => void
): () => void {
  const url = `${BASE_URL}/api/research/stream/${sessionId}`;
  const source = new EventSource(url);

  source.onmessage = (e) => {
    try {
      const event: AgentEvent = JSON.parse(e.data);
      if (event.event_type === "done") {
        onDone();
        source.close();
      } else if (event.event_type === "error") {
        onError(event.message);
        source.close();
      } else {
        onEvent(event);
      }
    } catch {
      // Ignore malformed events
    }
  };

  source.onerror = () => {
    onError("Connection lost");
    source.close();
  };

  // Return cleanup function
  return () => source.close();
}
