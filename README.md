# NOESIS – Sovereign Cognitive AI  
### Agents Building Real-Time Investigation Graphs at Scale

## Overview
NOESIS is a sovereign, on-premise AI platform designed to support large-scale investigations across heterogeneous data sources.

The system combines:
- High-speed multimodal data processing  
- AI-driven enrichment and indexing  
- Autonomous investigative agents  
- Dynamic, case-specific graph construction  

NOESIS does not build a static global graph.  
It generates ephemeral investigation graphs tailored to a specific investigative seed.

---

## Architecture (HLD)

INPUT → PROCESSING → AGENTS → GRAPH → INSIGHT

---

## Layers

### 1. Input Layer
- Video (CCTV – Closed-Circuit Television)
- Images
- Audio
- Text (logs, reports)
- Structured data:
  - Vehicle registries
  - Communication records
  - Transactions
  - Event logs

---

### 2. Processing Layer
AI-driven preprocessing and enrichment:
- Multimodal feature extraction
- Semantic enrichment
- Entity extraction
- Temporal normalization

Additionally a vector database is used to::
- Stores embeddings
- Enables similarity search
- Supports cross-modal retrieval
This layer transforms raw data into searchable, linkable signals.

---

### 3. Agents Layer
Agents are on-demand and operate in:
- Real-time mode
- Asynchronous mode (long-running)

They:
- Correlate entities
- Generate hypotheses
- Expand investigations

---

### 4. Graph Layer
- Dynamic investigation graph
- Entities, events, relationships
- Confidence + provenance

---

### 5. Insight Layer (future)
- AI-assisted interpretation
- Narrative generation

---

## Deckard Integration (Video Intelligence)

Deckard is integrated as a specialized analysis layer within NOESIS.

Capabilities:

- Natural language video search
  → "Find a man with a red sweatshirt"
- Image-based query
- Temporal localization in long videos
- Explainable reasoning (model trace)

Role in NOESIS:

- Detect entities (vehicles, persons)
- Generate video-based evidence nodes
- Extracts attributes
- Feed the investigation graph

---

## Demo Scenario – Torino Porta Susa

### Step 1 — Seed
The investigation starts from a minimal trigger. For example:

Vehicle: FIAT Tipo  
Plate: AB123 (partial)  
Time: 12 Apr 2026, 17:00–20:00  
Location: Torino Porta Susa  

---

### Step 2 — Structured Data

Vehicle → Owner
type: observed
source: vehicle registry

Owner expands to:
- Devices (communication logs)
- Transactions (financial activity)
- Events (movement logs)

---

### Step 3 — Video (Deckard)
- Detect person exiting vehicle (potentially not the owner)
type: observed
source: Deckard

- Identify a man with red sweatshirt
- Track across cameras ( “Find all occurrences of a man with a red sweatshirt in this area/time window” for
movement reconstruction)

Vehicle → Person Candidate
type: inferred
source: video analysis

---

### Step 4 — OSINT
- Image similarity
- Public social media matching
- Contact network

---

## Key Principles
- Ephemeral graphs
- Human-in-the-loop
- Explainability
- Data sovereignty

---

## Local Development

### Requirements
- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run In Development

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:8080`.

### Production Build

```bash
npm run build
```

The deployable output is generated in `dist/`.

### Preview The Production Build (local deploy simulation)

```bash
npm run build && npm run preview
```

Vite will print the URL, usually `http://localhost:4173`. This serves the real production bundle locally, identical to what gets deployed.

## Lovable Compatibility

This project was originally built with Lovable integration in mind.

The Vite configuration loads `lovable-tagger` only when it is available in the environment and only in development mode. This keeps the project usable in both cases:

- Local development without a Lovable-specific plugin install
- Lovable environments where the plugin is provided

If you later need full local Lovable tagging again, install a `lovable-tagger` version that is compatible with the Vite version used by this project, or downgrade Vite to a version supported by the Lovable plugin.

## Deploy

This is a static Vite application. Deploy the contents of `dist/` to any static hosting platform.

Typical settings:

- Build command: `npm run build`
- Output directory: `dist`

Examples of supported targets:

- Vercel
- Netlify
- GitHub Pages
- Nginx or Apache serving static files
- S3 + CloudFront

## Routing Note

The app uses `BrowserRouter`. If you add real client-side routes beyond `/`, configure your hosting provider to rewrite unknown paths to `index.html` so deep links keep working.
