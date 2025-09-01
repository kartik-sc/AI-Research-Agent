from pydantic import BaseModel
from models import SearchRequest, SearchResponse
from typing import List, Optional

class Citation(BaseModel):
    url: str
    title: str

class SearchRequest(BaseModel):
    query: str

class SearchResponse(BaseModel):
    summary: str
    keywords: List[str]
    insights: Optional[List[str]] = []
    open_questions: Optional[List[str]] = []
    possible_hypotheses: Optional[List[str]] = []
    citations: List[Citation]
