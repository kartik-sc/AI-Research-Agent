ResearchOS

An AI-powered multi-agent research workspace with autonomous planning, parallel retrieval, verification, knowledge management, and interactive report generation.

That sounds like a product.

What Claude should build

I would tell Claude that this is NOT a chatbot.

It is an AI operating system for research.

Think

Perplexity
NotebookLM
OpenDeepResearch
Cursor
Deep Research
Obsidian

combined together.

Entire Project Vision
ResearchOS

The operating system for technical research.

Not chat.

Not search.

A complete research workflow.
Architecture

I actually like Claude's diagram, but I'd expand it significantly.

                    USER
                      │
          Next.js 15 + React + Tailwind
                      │

────────────────────────────────────────
Search
Canvas
Projects
Knowledge Graph
Timeline
Notes
Reports
Files
────────────────────────────────────────
│
FastAPI Gateway
│
Authentication / Rate Limit
Redis / Session Store
│
LangGraph Orchestrator
│
────────────────────────────────────────
Intent Router
Planner
Memory
Model Router
────────────────────────────────────────
│
▼

Parallel Agent Graph

Planner
│
├── Web Search Agent
├── Academic Agent
├── GitHub Agent
├── Reddit Agent
├── HuggingFace Agent
├── News Agent
├── PDF Agent
├── Verification Agent
├── Citation Agent
├── Report Agent
└── Visualization Agent

        │
        ▼

Knowledge Graph

        │

Vector DB

        │

Final Report

        │

Streaming SSE

        │

Frontend
Core Technologies

Instead of hardcoding Gemini Flash.

Use model routing.

Purpose Model
Planning Gemini 3.5 Pro
Fast Tasks Gemini 3.5 Flash
Code reasoning Claude
Long reasoning GPT-5
Cheap fallback Qwen3
Embeddings BGE-M3
Reranking BGE-Reranker

No modern production AI app uses one model anymore. Model routing is becoming standard.

Search Stack

Don't rely on Google Search.

Use multiple retrieval systems simultaneously.

Tavily
Exa
Arxiv
Semantic Scholar
CrossRef
GitHub
HuggingFace
Wikipedia
News
Reddit
Firecrawl

Every source specializes in something.

Multi-Agent Graph

Instead of

User

↓

LLM

↓

Answer

use

Planner

↓

Parallel Researchers

↓

Verifier

↓

Critic

↓

Writer

↓

Visualizer

↓

Export

The Planner decomposes the task.

Researchers run simultaneously.

Verifier cross-checks.

Critic finds contradictions.

Writer produces the report.

Visualizer generates diagrams.

Knowledge Layer

This is something none of the three responses emphasized enough.

Build BOTH

Vector Database

Qdrant

or

Weaviate

AND

Graph Database

Neo4j

The graph stores

Author

↓

Paper

↓

Algorithm

↓

Framework

↓

Dataset

↓

Repository

↓

Benchmark

Then D3.js renders it.

Memory

Instead of chats.

Everything is project-based.

Projects

↓

Research Sessions

↓

Files

↓

Reports

↓

Knowledge Graph

↓

Timeline

↓

Bookmarks

↓

Exports
Research Modes

Quick

1 agent

30 seconds

Deep

Planner

4 Researchers

Verification

Critic

Writer

Academic

Prioritize

Arxiv

Semantic Scholar

CrossRef

Citations

Repository Analysis

GitHub

Architecture

Dependencies

Security

Stars

Issues

Activity

Benchmarks
UI

This is where most student projects fail.

Don't make another chatbot.

Instead

────────────────────────────────────────

Sidebar

Projects

Collections

Bookmarks

History

────────────────────────────────────────

Search Bar

────────────────────────────────────────

Answer

Sources

Knowledge Graph

Timeline

Artifacts

Agent Stream

────────────────────────────────────────

Use

Next.js

Tailwind

shadcn

Framer Motion

React Flow

D3.js

Monaco

TipTap

Product Features
Perplexity UI

Inline citations

Source cards

Hover previews

Follow-up questions

Research Canvas

Instead of chat.

Question

↓

Planner

↓

Search

↓

Papers

↓

Comparisons

↓

Report

↓

Export
Live Agent Stream

Instead of

Loading...

Planning...

Searching Arxiv...

Searching GitHub...

Ranking sources...

Finding contradictions...

Generating report...

Very impressive during demos.

Source Quality

Every source receives

Trust

Freshness

Academic

Government

Community

Confidence
AI Critic

Second model reviews

Hallucinations

Missing citations

Weak evidence

Contradictions

Confidence score

Knowledge Graph

Interactive

Click

Transformer

↓

Attention

↓

Flash Attention

↓

KV Cache

↓

Inference

Timeline

Research evolution

Example

GPT-2

↓

GPT-3

↓

PaLM

↓

Llama

↓

Gemini

↓

GPT-5

GitHub Intelligence

Repository

Architecture

Dependencies

Issues

Stars

Security

Benchmarks

Activity

License

Complexity

HuggingFace Intelligence

Model Card

Benchmarks

Downloads

License

Inference

Leaderboard

Reddit Consensus

Summarize

r/MachineLearning

r/LocalLLaMA

Community consensus often surfaces practical trade-offs that formal benchmarks miss.

Paper Explorer

Cluster papers by

Topic

Method

Dataset

Citation network

Export

PDF

Markdown

DOCX

LaTeX

BibTeX

PowerPoint

Notion

Backend
FastAPI

↓

Gateway

↓

LangGraph

↓

Task Queue

↓

Workers

↓

Search APIs

↓

Embedding Service

↓

Neo4j

↓

Qdrant

↓

Redis

↓

PostgreSQL
Reliability

Implement

retries
exponential backoff
caching
API fallbacks
rate limiting
checkpointing
resumable workflows
observability
structured logging

This makes the project feel production-ready instead of a demo.

Resume-worthy Engineering Highlights

Instead of emphasizing AI buzzwords, emphasize systems engineering:

Multi-agent orchestration using LangGraph with planner, retrieval, verification, critic, and synthesis agents.
Parallel hybrid retrieval across web, academic, GitHub, and model repositories with semantic reranking.
Dynamic LLM routing for cost, latency, and reasoning optimization.
Hybrid memory using PostgreSQL + Redis + Qdrant + Neo4j.
Real-time Server-Sent Events streaming for transparent agent execution.
Interactive research workspace featuring a knowledge graph, timelines, and project-based organization.
Export pipeline supporting PDF, Markdown, DOCX, and BibTeX.
Production architecture with authentication, caching, retry logic, checkpointing, and asynchronous task execution.
UI concept
┌────────────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Search: "Explain Mixture of Experts" Profile │
├────────────────┼───────────────────────────────────────────────────────────┤
│ Projects │ Streaming Progress Sources │
│ History │ ────────────────────────────────────────── ─────────── │
│ Collections │ ✓ Searching Web arXiv │
│ Bookmarks │ ✓ Reading Papers GitHub │
│ Settings │ ✓ Ranking Sources HF Models │
│ │ ✓ Generating Report Tavily │
│ │ Exa │
│ ├───────────────────────────────────────────────────────────┤
│ │ Report Notes │
│ │ Graph │
│ │ Comparison Tables Timeline │
│ │ Citations Export │
├────────────────┴───────────────────────────────────────────────────────────┤
│ Suggested Follow-ups • Export • Share • Copy • Regenerate │
└────────────────────────────────────────────────────────────────────────────┘
