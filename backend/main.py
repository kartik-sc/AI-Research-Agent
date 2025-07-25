from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SearchRequest, SearchResponse
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
  "keywords": ["kw1", "kw2", ...],
  "insights": ["<Key finding 1>", "<Key finding 2>", ...],
  "open_questions": ["<Gap or unanswered question 1>", "<Gap or limitation 2>", ...],
  "possible_hypotheses": ["<Plausible hypothesis 1>", "<Research direction or idea 2>", ...],
  "citations": [
    {{"url": "<url>", "title": "<title>"}},
    ...
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

@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    prompt = PROMPT_TEMPLATE.format(query=request.query)
    try:
        model = genai.GenerativeModel(
            MODEL,
            system_instruction="Reply only with raw JSON (no back-ticks, no commentary)."
        )
        response = model.generate_content(prompt)

        raw = (response.text or "").strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.I)
        raw = re.sub(r'\s*```$', '', raw)

        if not raw:
            raise ValueError("Empty response")

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
        print("RAW TEXT  :", repr(raw))
        return SearchResponse(
            summary="Sorry, the AI could not generate a valid response.",
            keywords=[],
            insights=[],
            open_questions=[],
            possible_hypotheses=[],
            citations=[]
        )