import type {
  AgentEvent,
  ResearchRequest,
  ResearchResponse,
  SessionSummary,
  SseCompletePayload,
  SsePayload,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function startResearch(
  req: ResearchRequest
): Promise<{ session_id: string; status: string }> {
  return apiFetch("/api/research", { method: "POST", body: JSON.stringify(req) });
}

export async function getResult(sessionId: string): Promise<ResearchResponse> {
  return apiFetch(`/api/research/${sessionId}/result`);
}

export async function listSessions(): Promise<SessionSummary[]> {
  return apiFetch("/api/sessions");
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
}

/**
 * Opens an SSE connection to the research stream.
 * Returns a cleanup function that closes the EventSource.
 *
 * The backend emits two kinds of events:
 *   - Agent events: {agent_name, event_type, message, timestamp}
 *   - Terminal events: {type: "complete"|"error", ...}
 */
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

      // Terminal complete event
      if ("type" in payload && payload.type === "complete") {
        onComplete(payload as SseCompletePayload);
        source.close();
        return;
      }

      // Terminal error event
      if ("type" in payload && payload.type === "error") {
        onError((payload as { type: "error"; message: string }).message);
        source.close();
        return;
      }

      // Regular agent event
      onEvent(payload as AgentEvent);
    } catch {
      // Ignore malformed frames
    }
  };

  source.onerror = () => {
    onError("Connection to research stream lost");
    source.close();
  };

  return () => source.close();
}
