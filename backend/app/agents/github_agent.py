import asyncio
import base64
import json
import logging

import httpx
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.models import ModelRouter
from app.core.redis_client import push_event
from app.models.schemas import AgentEvent

logger = logging.getLogger(__name__)

_ANALYSIS_SYSTEM = """You are a technical research analyst reviewing a GitHub repository.
Return ONLY valid JSON with this exact structure:
{
  "summary": "one paragraph: what problem it solves and how it works",
  "activity_health": "active|moderate|stale",
  "key_dependencies": ["dep1", "dep2"],
  "limitations": ["limitation1"],
  "stars": 0,
  "license": "MIT"
}
No markdown fences. Return only JSON."""


def _headers() -> dict[str, str]:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


async def _fetch_repo(client: httpx.AsyncClient, owner: str, repo: str) -> dict:
    headers = _headers()
    meta_r, readme_r, commits_r = await asyncio.gather(
        client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers),
        client.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers=headers),
        client.get(f"https://api.github.com/repos/{owner}/{repo}/commits", headers=headers, params={"per_page": 5}),
        return_exceptions=True,
    )

    meta: dict = {}
    if not isinstance(meta_r, Exception) and meta_r.is_success:
        meta = meta_r.json()

    readme = ""
    if not isinstance(readme_r, Exception) and readme_r.is_success:
        try:
            raw_b64 = readme_r.json().get("content", "")
            readme = base64.b64decode(raw_b64).decode("utf-8", errors="ignore")[:2000]
        except Exception:
            pass

    recent_commits: list[str] = []
    if not isinstance(commits_r, Exception) and commits_r.is_success:
        for c in (commits_r.json() or [])[:5]:
            msg = c.get("commit", {}).get("message", "").split("\n")[0]
            if msg:
                recent_commits.append(msg)

    return {"meta": meta, "readme": readme, "recent_commits": recent_commits}


async def _analyze_repo(meta: dict, readme: str, recent_commits: list[str], mode: str) -> dict:
    router = ModelRouter(mode=mode)
    prompt = (
        f"Repository: {meta.get('full_name', 'unknown')}\n"
        f"Description: {meta.get('description', '')}\n"
        f"Stars: {meta.get('stargazers_count', 0)}\n"
        f"Language: {meta.get('language', 'unknown')}\n"
        f"License: {(meta.get('license') or {}).get('spdx_id', 'unknown')}\n"
        f"Open issues: {meta.get('open_issues_count', 0)}\n\n"
        f"README (first 2000 chars):\n{readme}\n\n"
        f"Recent commits:\n" + "\n".join(f"- {c}" for c in recent_commits)
    )
    raw = await router.call(
        "search_analysis",
        [SystemMessage(content=_ANALYSIS_SYSTEM), HumanMessage(content=prompt)],
        temperature=0.1,
    )
    if "```" in raw:
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)


async def run_github_agent(state: dict) -> dict:
    query: str = state["query"]
    mode: str = state.get("mode", "deep")
    session_id: str = state["session_id"]
    events: list[AgentEvent] = []

    thinking = AgentEvent(
        agent_name="GitHub",
        event_type="thinking",
        message=f"Searching GitHub repositories for: {query[:60]}",
    )
    events.append(thinking)
    await push_event(session_id, thinking.model_dump(mode="json"))

    search_results: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.github.com/search/repositories",
                headers=_headers(),
                params={"q": query, "sort": "stars", "per_page": 3},
            )
            if not resp.is_success:
                raise RuntimeError(f"GitHub search returned {resp.status_code}")
            repos = resp.json().get("items", [])[:3]

            if not repos:
                raise RuntimeError("No repositories found")

            repo_data_list = await asyncio.gather(
                *[_fetch_repo(client, r["owner"]["login"], r["name"]) for r in repos],
                return_exceptions=True,
            )

        for i, (repo, repo_data) in enumerate(zip(repos, repo_data_list)):
            if isinstance(repo_data, Exception):
                logger.warning("GitHub: failed to fetch repo %s: %s", repo.get("full_name"), repo_data)
                continue
            try:
                analysis = await _analyze_repo(
                    repo_data["meta"] or repo,
                    repo_data["readme"],
                    repo_data["recent_commits"],
                    mode,
                )
                # Override stars/license from live metadata for accuracy
                analysis["stars"] = repo.get("stargazers_count", analysis.get("stars", 0))
                analysis["license"] = (repo.get("license") or {}).get("spdx_id") or analysis.get("license", "")
                analysis["language"] = repo.get("language", "")
                analysis["forks"] = repo.get("forks_count", 0)

                search_results.append({
                    "url": repo.get("html_url", f"https://github.com/{repo.get('full_name', '')}"),
                    "title": repo.get("full_name", repo.get("name", "Unknown")),
                    "source_type": "github",
                    "content": analysis.get("summary", ""),
                    "published_date": (repo.get("updated_at") or "")[:10] or None,
                    "metadata": analysis,
                })
            except Exception as exc:
                logger.warning("GitHub: failed to analyze repo %s: %s", repo.get("full_name"), exc)

        action = AgentEvent(
            agent_name="GitHub",
            event_type="action",
            message=f"Analyzed {len(search_results)} GitHub repositories",
        )
        events.append(action)
        await push_event(session_id, action.model_dump(mode="json"))

    except Exception as exc:
        logger.warning("GitHub agent failed: %s", exc)
        err = AgentEvent(
            agent_name="GitHub",
            event_type="complete",
            message=f"GitHub search skipped: {exc}",
        )
        events.append(err)
        await push_event(session_id, err.model_dump(mode="json"))

    return {"search_results": search_results, "agent_events": events}
