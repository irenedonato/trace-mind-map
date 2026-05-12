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

## Demo Scenario

### Step 1 — Vehicle Identification

The system performs a probabilistic match on a **black FIAT Tipo** using a partial license plate.  
The vehicle is linked to a registered owner, **Andrea Ferraro**, with no prior records or flags.

At this stage, the signal is weak and does not indicate suspicious activity on its own.

---

### Step 2 — Visual Anomaly Detection

Shortly after, CCTV footage captures an **unknown female exiting the passenger side** of the vehicle (08:19).

This introduces a mismatch:
- The registered owner is male
- The observed individual is female
- No direct confirmation of the owner’s presence

This event becomes the first pivot in the investigation.

---

### Step 3 — External Intelligence Correlation

The system correlates the observed individual with an **external partner agency flag**.

A similar subject had been previously reported in the United States, observed near:
- transit hubs
- logistics facilities

This is not a confirmed identification, but a **probabilistic visual correlation**, increasing the relevance of the subject.

---

### Step 4 — Cross-Site Detection

At 09:06, visual evidence places the **same subject at a logistics site** in the outskirts of Turin.

The match is generated through cross-camera correlation and spatial-temporal alignment.

This establishes:
- movement continuity
- proximity to logistics infrastructure

---

### Step 5 — Contextual Signals

Additional data sources provide contextual signals:

- **Telecom activity**:  
  Elevated call frequency (14 calls in 72 hours) to a recurring unidentified number, with peak activity prior to the observed events.

- **Financial activity**:  
  A €2,850 transaction to a logistics service provider, executed the night before.

Individually, these signals are not conclusive.  
However, they align temporally and contextually with the observed behavior.

---

### Step 6 — Hypothesis Generation

Rather than producing a deterministic conclusion, NOESIS generates a **hypothesis node**:

> **Coordinated Activity**

This hypothesis is supported only by signals that independently contribute meaningful evidence:
- visual correlation of the subject across locations
- presence at a logistics facility
- pre-event financial transaction
- anomalous telecom activity

Each link contributing to the hypothesis is explicitly qualified and traceable.

