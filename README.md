<p align="center">
  <img src="https://img.shields.io/badge/VoiceOps-Operational%20Intelligence-3B82F6?style=for-the-badge&logo=soundcharts&logoColor=white" alt="VoiceOps Badge"/>
</p>

<h1 align="center">VoiceOps — Operational Intelligence Console</h1>

<p align="center">
  <b>Real-time AI-powered risk analysis & compliance monitoring for financial call centers</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vanilla%20JS-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.4.0-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Theme-Dark%20Mode-0D1117?style=flat-square" />
  <img src="https://img.shields.io/badge/API-REST%20%2F%20ngrok-1F2937?style=flat-square" />
  <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Architecture Diagram](#system-architecture-diagram)
- [Frontend Module Map](#frontend-module-map)
- [Pages & Features](#pages--features)
- [Backend API Integration](#backend-api-integration)
- [Data Flow](#data-flow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)

---

## Overview

**VoiceOps** is a single-page application (SPA) that serves as the operational intelligence console for analyzing financial call center interactions. It connects to a Python/FastAPI backend that processes audio recordings using NLP, RAG (Retrieval-Augmented Generation), and risk scoring engines.

The frontend provides:

- **Real-time dashboard** with KPIs, activity feeds, and pattern detection
- **Audio upload & live analysis** with step-by-step processing visualization
- **Deep investigation views** with conversation replay, NLP insights, and risk rationale
- **Detailed document insights** and **financial data extraction** per call
- **AI-powered chatbot** for natural-language queries over call data
- **Risk queue** for triaging high/medium risk cases
- **n8n workflow integration** for Slack, CRM, and callback automation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VoiceOps Platform                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND (This Repo)                         │   │
│  │                     Vanilla JS + Vite SPA                        │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │   │
│  │  │  Sidebar    │  │  Main Area   │  │  AI Assistant Panel    │   │   │
│  │  │  Navigation │  │              │  │  (Chatbot)             │   │   │
│  │  │             │  │  ┌────────┐  │  │                        │   │   │
│  │  │  • Dashboard│  │  │ Header │  │  │  • Context-aware       │   │   │
│  │  │  • Cases    │  │  ├────────┤  │  │  • RAG-backed answers  │   │   │
│  │  │  • Risk Q   │  │  │Content │  │  │  • Suggestion chips    │   │   │
│  │  │  • Settings │  │  │ Area   │  │  │  • Markdown rendering  │   │   │
│  │  │             │  │  │        │  │  │                        │   │   │
│  │  └────────────┘  │  └────────┘  │  └────────────────────────┘   │   │
│  │                                                                  │   │
│  └───────────────────────────┬──────────────────────────────────────┘   │
│                              │                                          │
│                    API Layer │ (fetch + ngrok)                          │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────────────┐   │
│  │                     BACKEND (FastAPI)                             │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │   │
│  │  │  Audio       │  │  NLP Engine   │  │  RAG Engine           │  │   │
│  │  │  Processor   │  │              │  │  (Knowledge Base)     │  │   │
│  │  │              │  │  • Intent     │  │                       │  │   │
│  │  │  • STT       │  │  • Sentiment  │  │  • Pattern matching   │  │   │
│  │  │  • Diarize   │  │  • Entities   │  │  • Risk grounding     │  │   │
│  │  │  • Language   │  │  • Obligation │  │  • Compliance check   │  │   │
│  │  │    Detection  │  │              │  │  • Recommendations    │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │   │
│  │  │  Risk Score   │  │  Document     │  │  Chat (LLM)          │  │   │
│  │  │  Engine       │  │  Generator    │  │                       │  │   │
│  │  │              │  │              │  │  • GPT-4o-mini         │  │   │
│  │  │  • Behavioral │  │  • Summary    │  │  • Context injection  │  │   │
│  │  │  • Audio trust│  │  • Timeline   │  │  • Source citations   │  │   │
│  │  │  • Fraud prob. │  │  • Financials │  │                       │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘  │   │
│  │                                                                  │   │
│  │                     ┌──────────────┐                              │   │
│  │                     │  PostgreSQL   │                              │   │
│  │                     │  + Embeddings │                              │   │
│  │                     └──────────────┘                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                    ┌──────────────┐                                     │
│                    │  n8n (Ext.)  │  Slack · CRM · Callback             │
│                    └──────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture Diagram

```
                    ┌─────────────────┐
                    │   User Browser  │
                    └────────┬────────┘
                             │
                     Vite Dev Server
                     (localhost:5173)
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼──────────┐      ┌───────────▼──────────┐
    │   Main API (ngrok) │      │  Upload API (ngrok)  │
    │                    │      │                      │
    │  GET  /dashboard/* │      │  POST /analyze-call  │
    │  GET  /calls       │      │  (multipart/form)    │
    │  GET  /call/{id}   │      │                      │
    │  GET  /call/{id}/  │      └──────────────────────┘
    │       document     │
    │  GET  /call/{id}/  │
    │       document/    │
    │       financial    │
    │  PATCH /call/{id}/ │
    │        status      │
    │  POST /chat        │
    │  POST /knowledge/* │
    │  GET  /health      │
    └────────────────────┘
```

---

## Frontend Module Map

```
src/
├── main.js              ← App entry point, routing, all page renderers
│   ├── init()           ← Bootstrap: sidebar, header, page, events, chatbot
│   ├── renderPage()     ← SPA router (dashboard, cases, risk-queue, investigation, settings)
│   ├── renderHomePage() ← Active Cases grid + audio upload panel
│   ├── renderRiskQueuePage()   ← High/medium risk triage table
│   ├── renderInvestigationPage() ← Deep case analysis (hero card, conversation, NLP, patterns)
│   ├── renderSettingsPage()    ← Risk thresholds, notification toggles
│   ├── openDetailedInsights()  ← Modal: document summary, timeline, entities, flags
│   ├── openFinancialInsights() ← Modal: amounts, EMI, commitments, products
│   └── simulateCall()          ← Popup animation demo
│
├── api.js               ← Centralized API service (all fetch calls + liveStore)
├── dashboard.js         ← Dashboard renderer (stats, activity, patterns, cases)
├── chatbot.js           ← AI Assistant panel (context-aware chat with RAG backend)
├── data.js              ← n8n workflow JSON template
│
├── index.css            ← Global variables, layout, sidebar, header, dark theme
├── components.css       ← Buttons, cards, inputs, badges, form controls
├── pages.css            ← Investigation page, insight modals, workflow diagram
├── dashboard.css        ← Dashboard KPIs, activity feed, patterns, case cards
├── tables.css           ← Risk queue table, bulk actions
├── chatbot.css          ← Assistant panel, chat bubbles, suggestion chips
└── animations.css       ← Skeletons, pulse dots, processing steps
```

---

## Pages & Features

### 1. Dashboard
| Section | Description |
|---------|-------------|
| **KPI Row** | Total Calls, High Risk Count, Avg Risk Score, Resolution Rate |
| **Recent Activity** | Timeline of latest processed calls with risk levels |
| **Top Patterns** | Bar chart of most frequently matched fraud patterns |
| **Active Cases** | High-priority case cards with quick navigation |
| **Quick Actions** | One-click navigation to Start Analysis or Risk Queue |

### 2. Active Cases (Home)
- **Upload Panel** — Drag-and-drop or browse audio files (MP3, WAV, M4A)
- **Processing Animation** — 4-step visual pipeline (Transcribe → Understand → History Check → Decision)
- **Call Cards Grid** — All calls with risk score, assessment, patterns, and confidence
- **Risk Banner** — Alert banner when high-risk cases exist

### 3. Risk Queue
- **Triage Table** — Filterable table of high/medium risk calls
- **Columns** — Case ID, Risk Score, RAG Headline, Matched Patterns, Action
- **Bulk Actions** — Select multiple cases for batch escalation/assignment

### 4. Investigation Page
| Section | Description |
|---------|-------------|
| **Hero Card** | Call ID, status badge, timestamp, fraud likelihood, risk verdict, language detected, risk score, confidence |
| **Action Buttons** | Mark as Safe, Detailed Insights, Financial Insights |
| **Decision Rationale** | Matched patterns + RAG explanation |
| **Conversation** | Agent/Customer chat bubbles from backend diarization |
| **NLP Insights** | Intent, sentiment, obligation strength, call quality |
| **Matched Patterns** | Chip tags for detected fraud patterns |

### 5. Detailed Insights Modal
Fetches from `GET /api/v1/call/{id}/document`:
- Call summary, purpose & outcome
- Key discussion points
- Call timeline (with speaker attribution)
- Detected entities (persons, organizations, locations)
- Risk flags & compliance notes
- Action items

### 6. Financial Insights Modal
Fetches from `GET /api/v1/call/{id}/document/financial`:
- Amounts mentioned (currency cards with context)
- EMI details & total outstanding
- Payment commitments
- Financial products & account references
- Transaction references

### 7. AI Assistant (Chatbot)
- Context-aware suggestions per page
- Sends queries to `POST /api/v1/chat` (RAG-backed LLM)
- Markdown rendering for responses
- Fallback local responses when API is unreachable

### 8. Settings
- Risk threshold configuration
- Auto-escalation toggle
- Notification preferences (Slack, Email)

### 9. n8n Workflow Integration
- Visual workflow diagram (Call → VoiceOps → Decision → Slack/CRM/Callback)
- Copy workflow JSON for import into n8n
- Simulate Customer Call popup animation

---

## Backend API Integration

All API calls go through `src/api.js` with a centralized `apiFetch()` wrapper.

### Endpoints

| Method | Endpoint | Description | Used In |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/dashboard/stats` | KPI statistics | Dashboard |
| `GET` | `/api/v1/dashboard/recent-activity` | Latest processed calls | Dashboard |
| `GET` | `/api/v1/dashboard/top-patterns` | Most matched patterns | Dashboard |
| `GET` | `/api/v1/dashboard/active-cases` | High-priority cases | Dashboard, Risk Queue |
| `GET` | `/api/v1/dashboard/health` | System health status | Dashboard |
| `GET` | `/api/v1/calls` | Paginated call list | Active Cases |
| `GET` | `/api/v1/call/{call_id}` | Full call details (nested) | Investigation |
| `GET` | `/api/v1/call/{call_id}/document` | AI-generated document insights | Detailed Insights Modal |
| `GET` | `/api/v1/call/{call_id}/document/financial` | Financial data extraction | Financial Insights Modal |
| `PATCH` | `/api/v1/call/{call_id}/status` | Update call status | Mark Safe, Escalate |
| `POST` | `/api/v1/chat` | AI chatbot query | Assistant Panel |
| `POST` | `/api/v1/analyze-call` | Upload & analyze audio (multipart) | Upload Panel |
| `POST` | `/api/v1/knowledge/seed` | Seed knowledge base | Admin |
| `GET` | `/api/v1/knowledge/status` | Knowledge base status | Admin |

### Response Shape Notes

- **List endpoints** (`/calls`, `/active-cases`, `/recent-activity`, `/top-patterns`) return **flat objects** in arrays
- **Detail endpoint** (`/call/{call_id}`) returns **nested objects**: `risk_assessment`, `rag_output`, `nlp_insights`, `call_context`, `conversation`
- **Upload endpoint** uses a **separate ngrok URL** with `multipart/form-data`

---

## Data Flow

```
Audio File (.mp3/.wav)
       │
       ▼
┌──────────────────┐     POST /analyze-call
│  Upload Panel    │ ──────────────────────► Backend (STT + NLP + RAG)
│  (drag & drop)   │                              │
└──────────────────┘                              ▼
                                          ┌──────────────┐
                                          │  PostgreSQL   │
                                          │  (call record)│
                                          └──────┬───────┘
                                                 │
       ┌─────────────────────────────────────────┘
       │
       ▼
┌──────────────────┐     GET /call/{id}
│  Investigation   │ ◄────────────────── Full call object
│  Page            │
│                  │     GET /call/{id}/document
│  ┌────────────┐  │ ◄────────────────── Document insights
│  │  Detailed  │  │
│  │  Insights  │  │     GET /call/{id}/document/financial
│  ├────────────┤  │ ◄────────────────── Financial extraction
│  │  Financial │  │
│  │  Insights  │  │
│  └────────────┘  │
└──────────────────┘
```

---

## Project Structure

```
voiceops_frontend/
├── index.html               # App shell — sidebar, main area, assistant panel, n8n modal
├── package.json             # Vite 5.4.0 (zero runtime dependencies)
├── public/
│   └── vite.svg
├── src/
│   ├── main.js              # Core app — routing, renderers, upload, actions (~1160 lines)
│   ├── api.js               # API service layer — all endpoints + liveStore
│   ├── dashboard.js         # Dashboard renderer with parallel API fetching
│   ├── chatbot.js           # AI Assistant — context-aware chat panel
│   ├── data.js              # n8n workflow JSON template
│   ├── index.css            # Global: CSS variables, layout, sidebar, header
│   ├── components.css       # Reusable: buttons, cards, badges, inputs
│   ├── pages.css            # Pages: investigation, insight modals, workflow
│   ├── dashboard.css        # Dashboard: KPIs, activity, patterns, cases
│   ├── tables.css           # Risk queue table styles
│   ├── chatbot.css          # Chat panel: bubbles, input, suggestions
│   └── animations.css       # Skeletons, spinners, processing steps
└── dist/                    # Production build output (vite build)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **pnpm**
- Backend API running (exposed via ngrok or direct URL)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/kriti11m/VoiceOps_frontend.git
cd VoiceOps_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build     # Output in dist/
npm run preview   # Preview production build
```

---

## Configuration

### API URLs

Edit `src/api.js` to point to your backend:

```javascript
// Main API base URL — all /api/v1/* routes
const API_BASE_URL = 'https://your-ngrok-url.ngrok-free.app';

// Audio upload endpoint (may be on a separate service)
const ANALYZE_CALL_URL = 'https://your-upload-ngrok.ngrok-free.app/api/v1/analyze-call';
```

The chatbot (`src/chatbot.js`) automatically imports `API_BASE_URL` from `api.js` — no separate config needed.

### ngrok Headers

All requests include `ngrok-skip-browser-warning: true` to bypass the ngrok interstitial page.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | None (Vanilla JS ES2022) |
| **Build Tool** | Vite 5.4.0 |
| **Styling** | Custom CSS with CSS Variables (dark theme) |
| **Fonts** | Inter (UI) + JetBrains Mono (code/data) |
| **Icons** | Inline SVG (Feather-style) |
| **API** | Fetch API with centralized wrapper |
| **State** | In-memory `liveStore` + `window` globals |
| **Routing** | Custom SPA router (`renderPage()` switch) |
| **Backend** | FastAPI + PostgreSQL + GPT-4o-mini (separate repo) |
| **Tunnel** | ngrok for local development |
| **Automation** | n8n workflow integration |

---

<p align="center">
  <sub>Built with ❤️ for operational intelligence</sub>
</p>
