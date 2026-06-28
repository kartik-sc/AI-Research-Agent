from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.models import SearchRequest, SearchResponse
import google.generativeai as genai
import os
import json
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

# Serve static JS/CSS at /static
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Serve index.html at root
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY environment variable not set")

genai.configure(api_key=GOOGLE_API_KEY)
MODEL = "models/gemini-2.0-flash-exp"


PROMPT_TEMPLATE = """
User Research Query: {query}

You are a research assistant AI. Your task is to deeply understand the user’s query, extract relevant scientific knowledge, and help generate new insights or hypotheses.

Return ONLY valid JSON with these keys:
{{
  "summary": "<Detailed factual summary of the most relevant knowledge from literature (3–5 sentences)>",
  "keywords": ["kw1", "kw2"],
  "insights": ["<Key finding 1>", "<Key finding 2>"],
  "open_questions": ["<Gap 1>", "<Gap 2>"],
  "possible_hypotheses": ["<Hypothesis 1>", "<Hypothesis 2>"],
  "citations": [
    {{"url": "<url>", "title": "<title>"}}
  ]
}}

If no relevant information is found, return:
{{
  "summary": "No relevant information found.",
  "keywords": [],
  "insights": [],
  "open_questions": [],
  "possible_hypotheses": [],
  "citations": []
}}
"""

# ---------------------------
# API ENDPOINT
# ---------------------------
@app.post("/api/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    prompt = PROMPT_TEMPLATE.format(query=request.query)

    try:
        model = genai.GenerativeModel(
            MODEL,
            system_instruction="Reply only with raw JSON (no markdown, no commentary)."
        )
        response = model.generate_content(prompt)

        raw = (response.text or "").strip()

        # Strip markdown fences
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.I)
        raw = re.sub(r'\s*```$', '', raw)

        result = json.loads(raw)

        return SearchResponse(
            summary=result.get("summary", ""),
            keywords=result.get("keywords", []),
            insights=result.get("insights", []),
            open_questions=result.get("open_questions", []),
            possible_hypotheses=result.get("possible_hypotheses", []),
            citations=result.get("citations", [])
        )

    except Exception as e:
        print("PARSE ERROR:", e)
        print("RAW TEXT:", raw)
        return SearchResponse(
            summary="Sorry, the AI could not generate a valid response.",
            keywords=[],
            insights=[],
            open_questions=[],
            possible_hypotheses=[],
            citations=[]
        )