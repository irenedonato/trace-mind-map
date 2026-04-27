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

Vector DB:
- Stores embeddings
- Enables similarity search
- Supports cross-modal retrieval

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
Vehicle: FIAT Tipo  
Plate: AB123 (partial)  
Time: 12 Apr 2026, 17:00–20:00  
Location: Torino Porta Susa  

---

### Step 2 — Structured Data

Vehicle → Owner

Owner expands to:
- Devices (communication logs)
- Transactions (financial activity)
- Events (movement logs)

---

### Step 3 — Video (Deckard)
- Detect person exiting vehicle (potentially not the owner)
- Identify red sweatshirt
- Track across cameras

---

### Step 4 — OSINT
- Image similarity
- Social profiles
- Contact network

---

## Key Principles
- Ephemeral graphs
- Human-in-the-loop
- Explainability
- Data sovereignty
