# AI Research Assistant 🧠

A lightweight, full-stack tool that lets you ask complex research questions and instantly receive **AI-generated summaries, insights, open questions, hypotheses, keywords, and citations**—all in a beautiful, responsive web interface.

---

### 🚀 Quick Start

| Step | Command |
|---|---|
| **Backend** |  |
| Install depandancies | `pip install -r requirements.txt` |
| Set key | `set GOOGLE_API_KEY=<your-key>` |
| Run FastAPI | `python -m uvicorn main:app --reload` |
| **Frontend** |  |
| Static server | `python -m http.server 3000` |
| Browse | http://localhost:3000 |

Currently local, will deploy online shortly.
---

### 📡 API Endpoint

`POST /search`  
**Request body**
```
{ "query": "quantum entanglement" }
```
**Response**
```
{
  "summary": "...",
  "keywords": ["...", "..."],
  "insights": ["..."],
  "open_questions": ["..."],
  "possible_hypotheses": ["..."],
  "citations": [{ "url": "...", "title": "..." }]
}
```
---

### 📁 Project Tree

```
backend/
├── init.py
├── main.py          # FastAPI server
├── models.py        # Pydantic schemas
├── requirements.txt # Python deps
frontend/
├── index.html      
└── style.css
└── app.js              # live UI served via python -m http.server 3000
```

---

### 🛠️ Tech Stack

- **Backend**: FastAPI + Google Gemini 2.0 Flash + Python
- **Frontend**: Vanilla HTML/CSS/JS

---
