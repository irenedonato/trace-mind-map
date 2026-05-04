export type NodeType =
  | "case"
  | "event"
  | "person_candidate"
  | "video"
  | "video_detection"
  | "crop"
  | "social_profile"
  | "document"
  | "entity"
  | "voice_sample"
  | "speaker"
  | "communications_log"
  | "transaction"
  | "transaction_record"
  | "location"
  | "vehicle"
  | "vehicle_registration"
  | "owner"
  // structured evidence nodes — atomic, citable pieces of evidence
  // (distinct from entities). Typically produced by Deckard / AudioRAG / OSINT.
  | "evidence"
  | "video_evidence"
  | "audio_evidence"
  | "image_evidence"
  // legacy aliases — kept for backwards compatibility with existing demo data
  | "person"
  | "device"
  | "social";

/**
 * Structured fields rendered in the Evidence tab when a node of type
 * `*_evidence` is selected. Each field is shown as label/value.
 */
export interface EvidenceFact {
  label: string;
  value: string;
}

export type EdgeType =
  | "appearsInVideo"
  | "called"
  | "sentMoneyTo"
  | "locatedAt"
  | "connectedTo"
  | "linkedToProfile"
  | "derivedFrom"
  | "containsVoice"
  | "matchesSpeaker"
  | "partOfCase"
  | "occurredAt";
export type EdgeStatus = "observed" | "inferred" | "hypothesis" | "validated";

/**
 * Multi-layer taxonomy for investigation graphs.
 *  - observation : raw, atomic data captured from a sensor or feed
 *                  (CCTV crop, ANPR read, CDR row, transaction line, voice sample, social post…)
 *  - entity      : real-world things the investigation is about
 *                  (person, vehicle, device, owner, social profile, location)
 *  - event       : spatio-temporal occurrences
 *                  (a sighting, a call, a money transfer, a detection moment)
 *  - inference   : AI-generated hypotheses bridging the other layers
 *                  (candidate identity, speaker cluster, "driver ≈ owner" guess)
 */
export type NodeLayer = "observation" | "entity" | "event" | "inference";

/** Source channel a piece of data was captured from. */
export type SourceChannel =
  | "video"
  | "audio"
  | "telecom"
  | "transaction"
  | "social"
  | "registry"
  | "geo"
  | "case";

export interface NodeSource {
  channel: SourceChannel;
  label: string;
}

/** Inclusive time range (ISO strings or scenario-clock strings). */
export interface TimeRange {
  start: string;
  end: string;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  /** Investigation layer — see {@link NodeLayer}. Auto-derived from `type` if omitted. */
  layer?: NodeLayer;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  /** Confidence score in [0,1] that this node is correct/relevant. */
  confidence: number;
  /** Single timestamp (instant) for this node — auto-filled from `eventTime` or sourceTrace. */
  timestamp?: string;
  /** Time range when the node represents a window rather than an instant. */
  timeRange?: TimeRange;
  /** Primary source channel — auto-derived from `sourceTrace` if omitted. */
  primarySource?: NodeSource;
  evidence?: Evidence[];
  /** Structured fact-list for evidence nodes (Camera/Time/Detection/Attribute…) */
  facts?: EvidenceFact[];
  /** Scenario-clock time of the event (e.g. "17:12") shown on the node and timeline */
  eventTime?: string;
  sourceTrace?: SourceTraceItem[];
  delay: number; // ms delay before appearing
  /** Demo progression step (1-8) this node belongs to */
  step?: number;
  /** Optional media image (URL or imported asset) shown in a floating preview window when the node is selected. */
  mediaImage?: { src: string; caption?: string };
  /** Optional external action — e.g. open the source video in Deckard (separate app). */
  deckardLink?: { url: string; label: string };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  /** Confidence the link is meaningful (model/source quality). */
  confidence: number;
  /**
   * Probabilistic weight in [0,1] that the relationship actually holds.
   * Defaults to `confidence` when the link is `observed`/`validated`,
   * and to a slightly discounted value for `inferred`/`hypothesis`.
   */
  probability?: number;
  /** @deprecated use `status` instead. Kept for backwards compatibility. */
  inferred?: boolean;
  status: EdgeStatus;
  /** Short human-readable summary shown in the link inspector. */
  rationaleSummary?: string;
  /** Bullet-list reasons why this link exists (for explainability). */
  rationale?: string[];
  delay: number;
  /** Demo progression step (1-8) this edge belongs to */
  step?: number;
}

// ---------------------------------------------------------------------
// Layer / source / probability helpers — used to auto-enrich nodes and
// edges so existing scenario data does not need to be hand-edited.
// ---------------------------------------------------------------------

const NODE_TYPE_TO_LAYER: Record<NodeType, NodeLayer> = {
  // entities
  case: "entity",
  person_candidate: "inference",
  person: "entity",
  vehicle: "entity",
  owner: "entity",
  device: "entity",
  social_profile: "entity",
  social: "entity",
  location: "entity",
  entity: "entity",
  speaker: "inference",

  // events (spatio-temporal occurrences)
  event: "event",

  // observations (raw atomic captures)
  video: "observation",
  video_detection: "observation",
  crop: "observation",
  document: "observation",
  voice_sample: "observation",
  communications_log: "observation",
  transaction: "observation",
  transaction_record: "observation",
  vehicle_registration: "observation",
  evidence: "observation",
  video_evidence: "observation",
  audio_evidence: "observation",
  image_evidence: "observation",
};

const SOURCE_TYPE_TO_CHANNEL: Record<SourceTraceItem["type"], SourceChannel> = {
  video: "video",
  audio: "audio",
  log: "telecom",
  transaction: "transaction",
  image: "social",
  vector: "video",
  nlp: "social",
};

export function getNodeLayer(node: GraphNode): NodeLayer {
  return node.layer ?? NODE_TYPE_TO_LAYER[node.type] ?? "entity";
}

export function getNodePrimarySource(node: GraphNode): NodeSource | undefined {
  if (node.primarySource) return node.primarySource;
  const first = node.sourceTrace?.[0];
  if (!first) return undefined;
  return { channel: SOURCE_TYPE_TO_CHANNEL[first.type] ?? "case", label: first.source };
}

export function getNodeTimestamp(node: GraphNode): string | undefined {
  return (
    node.timestamp ??
    node.eventTime ??
    node.sourceTrace?.find((s) => s.timestamp)?.timestamp ??
    node.evidence?.[0]?.timestamp
  );
}

export function getEdgeProbability(edge: GraphEdge): number {
  if (typeof edge.probability === "number") return edge.probability;
  // Discount inferred/hypothesis links so probability ≠ confidence.
  switch (edge.status) {
    case "validated": return Math.min(1, edge.confidence);
    case "observed":  return edge.confidence;
    case "inferred":  return edge.confidence * 0.9;
    case "hypothesis": return edge.confidence * 0.75;
    default: return edge.confidence;
  }
}

export const layerMeta: Record<NodeLayer, { label: string; color: string; abbrev: string; description: string }> = {
  observation: { label: "Observation", abbrev: "OBS", color: "hsl(160, 84%, 39%)", description: "Raw data captured from a sensor or feed" },
  entity:      { label: "Entity",      abbrev: "ENT", color: "hsl(212, 90%, 60%)", description: "People, vehicles, devices, locations" },
  event:       { label: "Event",       abbrev: "EVT", color: "hsl(45, 95%, 60%)",  description: "Spatio-temporal occurrence" },
  inference:   { label: "Inference",   abbrev: "INF", color: "hsl(280, 70%, 65%)", description: "AI-generated hypothesis" },
};

export interface Evidence {
  type: "video" | "log" | "transaction" | "metadata";
  title: string;
  detail: string;
  timestamp: string;
}

export interface SourceTraceItem {
  source: string;
  type: "video" | "audio" | "log" | "transaction" | "image" | "vector" | "nlp";
  reference: string;
  detail?: string;
  hash?: string;
  timestamp?: string;
}

// =====================================================================
// DEMO PROGRESSION — 8 steps. Each step has a start time (ms) used by
// nodes/edges/logs to animate in sync with the StepIndicator overlay.
// =====================================================================
export interface DemoStep {
  step: number;
  startMs: number;
  title: string;
  subtitle: string;
  /** Scenario-clock time displayed in the StepIndicator (e.g. "17:05") */
  eventTime?: string;
}

export const demoSteps: DemoStep[] = [
  { step: 1, startMs:     0, eventTime: "02:14", title: "Seed received",                 subtitle: "Analyst submits semantic query + filters" },
  { step: 2, startMs:  1800, eventTime: "02:14", title: "Deckard searches station video",subtitle: "Bimodal text→image search across 847 feeds" },
  { step: 3, startMs:  3600, eventTime: "02:15", title: "Subject detected across cameras", subtitle: "Same crop re-identified in multiple feeds" },
  { step: 4, startMs:  5400, eventTime: "10:02", title: "OSINT profile candidate found", subtitle: "Public Instagram match — garment + geo + tags" },
  { step: 5, startMs:  7200, eventTime: "10:08", title: "Public video contains voice sample", subtitle: "Audio segment extracted from social media post" },
  { step: 6, startMs:  9000, eventTime: "10:18", title: "AudioRAG creates speaker cluster", subtitle: "Voiceprint clustered across calls + public audio" },
  { step: 7, startMs: 10800, eventTime: "11:02", title: "Logs and transaction records add context", subtitle: "CDR + financial records correlated to subject" },
  { step: 8, startMs: 12600, eventTime: "11:30", title: "Analyst validates / rejects hypotheses", subtitle: "Hypothesis links promoted to VALIDATED or rejected" },
];

export const demoTotalMs = 14400;

// =====================================================================
// NODES
// =====================================================================
export const demoNodes: GraphNode[] = [
  // ---- STEP 1 — Seed received ----
  {
    id: "c1", type: "case", label: "CASE-2024-0314", sublabel: "Torino · Porta Susa",
    x: 120, y: 150, confidence: 1.0, delay: 0, step: 1,
    evidence: [
      { type: "metadata", title: "Case Opened", detail: "Investigation case opened by analyst on duty. Scope: 72h lookback, area Torino Porta Susa.", timestamp: "2024-03-14T02:14:00Z" },
    ],
    sourceTrace: [
      { source: "Case Management", type: "log", reference: "case_id CASE-2024-0314", detail: "manual case creation by analyst id ANL-014", hash: "sha256:7711…ee01", timestamp: "2024-03-14T02:14:00Z" },
    ],
  },
  {
    id: "ev1", type: "event", label: "Semantic Seed", sublabel: "\"man in red sweatshirt\"",
    x: 280, y: 150, confidence: 1.0, delay: 400, step: 1,
    evidence: [
      { type: "metadata", title: "Seed Query", detail: "Bimodal text→image query submitted to Deckard with 72h time range and Porta Susa geofence.", timestamp: "2024-03-14T02:14:30Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Semantic Query", type: "nlp", reference: "query_id Q-55812", detail: "\"man wearing a red sweatshirt\" · 72h · geofence Porta Susa ±2km", hash: "sha256:3d12…a90f", timestamp: "2024-03-14T02:14:30Z" },
    ],
  },

  // ---- STEP 2 — Deckard searches station video ----
  {
    id: "v1", type: "video", label: "CCTV Feed #12", sublabel: "Aurora — Torino",
    x: 180, y: 220, confidence: 0.95, delay: 1900, step: 2,
    evidence: [
      { type: "video", title: "Video Source", detail: "Duration: 4h 22m, Resolution: 4K, Location: 45.0921°N, 7.6700°E (Aurora, Torino)", timestamp: "2024-03-14T00:00:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Camera CCTV-12", type: "video", reference: "video_id V-00012 / 4h22m @ 4K", detail: "ingested 2024-03-14T00:02:11Z, chain-of-custody verified", hash: "sha256:aa31…77bd", timestamp: "2024-03-14T00:00:00Z" },
    ],
  },
  {
    id: "v2", type: "video", label: "CCTV Feed #47", sublabel: "Centro / San Carlo — Torino",
    x: 360, y: 220, confidence: 0.89, delay: 2300, step: 2,
    evidence: [
      { type: "video", title: "Video Source", detail: "Duration: 8h 15m, Resolution: 1080p, Location: 45.0686°N, 7.6830°E (Centro, Torino)", timestamp: "2024-03-14T08:00:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Camera CCTV-47", type: "video", reference: "video_id V-00047 / 8h15m @ 1080p", detail: "ingested 2024-03-14T08:01:44Z", hash: "sha256:42c0…91ee", timestamp: "2024-03-14T08:00:00Z" },
    ],
  },
  {
    id: "l1", type: "location", label: "Porta Susa", sublabel: "45.0729°N · 7.6660°E",
    x: 80, y: 320, confidence: 0.99, delay: 2600, step: 2,
    sourceTrace: [
      { source: "Camera Geo-registry", type: "log", reference: "cam_meta CCTV-12 / CCTV-47", detail: "fixed cameras anchored to Torino Porta Susa station perimeter", hash: "sha256:ce71…0042" },
    ],
  },

  // ---- STEP 3 — Subject detected across cameras ----
  {
    id: "vd1", type: "video_evidence", label: "Detection #88421", sublabel: "Video Evidence",
    x: 180, y: 360, confidence: 0.93, delay: 3700, step: 3, eventTime: "02:14",
    facts: [
      { label: "Camera",    value: "Porta Susa Cam 12" },
      { label: "Time",      value: "2024-03-14 02:14:33" },
      { label: "Detection", value: "Subject matching seed query" },
      { label: "Attribute", value: "Red sweatshirt · adult male" },
      { label: "BBox",      value: "[412,188,540,402]" },
      { label: "Score",     value: "0.93 (top-1)" },
    ],
    evidence: [
      { type: "video", title: "Top-1 Detection", detail: "Bounding box [412,188,540,402], visual match score 0.93 against query \"man wearing a red sweatshirt\".", timestamp: "2024-03-14T02:14:33Z" },
    ],
    sourceTrace: [
      { source: "Deckard — CCTV Feed #12", type: "video", reference: "frame 4123 @ 02:14:33", detail: "crop_id CR-88421 / vector_id VEC-22a91 / bbox [412,188,540,402]", hash: "sha256:9f2a…b71c", timestamp: "2024-03-14T02:14:33Z" },
    ],
  },
  {
    id: "cr1", type: "crop", label: "Red Sweatshirt Crop", sublabel: "CR-88421",
    x: 80, y: 460, confidence: 0.93, delay: 4000, step: 3,
    sourceTrace: [
      { source: "Deckard VectorDB", type: "vector", reference: "vector_id VEC-22a91", detail: "embedding 512d — visual fingerprint of red garment + subject silhouette", hash: "sha256:1c44…f902" },
    ],
  },
  {
    id: "p1", type: "person_candidate", label: "Mario Rossi", sublabel: "candidate · PER-4821",
    x: 360, y: 420, confidence: 0.86, delay: 4400, step: 3,
    evidence: [
      { type: "metadata", title: "Identity Hypothesis", detail: "Crop embedding nearest-neighbor against reference DB → candidate 'Mario Rossi' (PER-4821), similarity 0.86 — pending analyst validation.", timestamp: "2024-03-14T02:14:35Z" },
      { type: "video", title: "Re-identification CCTV Feed #47", detail: "Same crop embedding re-identified in CCTV Feed #47 (Centro Torino) — sim 0.89.", timestamp: "2024-03-14T09:47:11Z" },
    ],
    sourceTrace: [
      { source: "Deckard VectorDB", type: "vector", reference: "embedding NN-search vs reference crops", detail: "candidate identity PER-4821 (Mario Rossi), similarity 0.86 — HYPOTHESIS, awaiting analyst validation", hash: "sha256:1c44…f902" },
    ],
  },

  // ---- STEP 4 — OSINT profile candidate ----
  {
    id: "s1", type: "social_profile", label: "@mario.r_88", sublabel: "Instagram · public",
    x: 560, y: 360, confidence: 0.71, delay: 5500, step: 4,
    evidence: [
      { type: "metadata", title: "Public Social Profile", detail: "Instagram handle @mario.r_88 — public account, 412 followers, 87 posts. Bio mentions Torino.", timestamp: "2024-03-14T10:02:00Z" },
      { type: "video", title: "Image Match — Red Sweatshirt", detail: "Public post IG-77123 (2024-02-28) shows subject wearing same red sweatshirt as CCTV crop. CLIP visual similarity 0.84.", timestamp: "2024-02-28T15:11:00Z" },
    ],
    sourceTrace: [
      { source: "OSINT — Instagram Scraper", type: "image", reference: "post_id IG-77123 / img_id IMG-9921", detail: "public post, garment match red hoodie, CLIP sim 0.84 vs CCTV crop CR-88421", hash: "sha256:b7e2…44a1", timestamp: "2024-02-28T15:11:00Z" },
      { source: "Geo-tag Cluster", type: "log", reference: "geo_cluster GC-204 · Porta Susa ±300m", detail: "5 of 87 posts geo-tagged within 300m of Torino Porta Susa", hash: "sha256:11df…aa20" },
      { source: "Hashtag Co-occurrence", type: "nlp", reference: "tag #aurora_torino_night", detail: "shared event hashtag with 2 other PER-4821-linked accounts" },
    ],
  },

  // ---- STEP 5 — Public video contains voice sample ----
  {
    id: "vs1", type: "audio_evidence", label: "Voice Sample A-9921", sublabel: "Audio Evidence",
    x: 720, y: 280, confidence: 0.84, delay: 7300, step: 5, eventTime: "10:08",
    facts: [
      { label: "Source",   value: "Instagram post IG-77123" },
      { label: "Time",     value: "2024-03-14 10:08 (extraction)" },
      { label: "Length",   value: "12s" },
      { label: "Format",   value: "PCM 16kHz mono · SNR 18dB" },
      { label: "Speaker",  value: "Italian · Torinese accent" },
    ],
    evidence: [
      { type: "metadata", title: "Audio Extraction", detail: "12s audio segment extracted from public Instagram video IG-77123. Subject speaks Italian, Torinese accent.", timestamp: "2024-02-28T15:11:12Z" },
    ],
    sourceTrace: [
      { source: "Audio Extractor", type: "audio", reference: "audio_id A-9921 @ 00:00:00–00:00:12", detail: "PCM 16kHz mono, extracted from IG-77123, SNR 18dB", hash: "sha256:cc92…aa15", timestamp: "2024-02-28T15:11:12Z" },
    ],
  },

  // ---- STEP 6 — AudioRAG speaker cluster ----
  {
    id: "sp1", type: "speaker", label: "Speaker SPK-77", sublabel: "AudioRAG cluster · 4 samples",
    x: 720, y: 440, confidence: 0.88, delay: 9100, step: 6,
    evidence: [
      { type: "metadata", title: "Speaker Cluster", detail: "AudioRAG clustered 4 voice samples (1 OSINT + 3 intercepted calls) into a single speaker — voiceprint similarity ≥ 0.86.", timestamp: "2024-03-14T03:02:00Z" },
    ],
    sourceTrace: [
      { source: "AudioRAG", type: "audio", reference: "speaker_id SPK-77 / cluster size 4", detail: "voiceprint clustering, intra-cluster sim ≥ 0.86, source: A-9921 + A-00882 + A-00883 + A-00884", hash: "sha256:55de…1c09" },
    ],
  },

  // ---- STEP 7 — Logs and transaction records ----
  {
    id: "cl1", type: "communications_log", label: "CDR Batch", sublabel: "14 calls · 72h",
    x: 540, y: 540, confidence: 0.90, delay: 10900, step: 7,
    evidence: [
      { type: "log", title: "Call Detail Records", detail: "14 outgoing calls from +39 011 555 0147 to +39 011 555 0283 in 72h window. Average duration: 47s.", timestamp: "2024-03-13T18:22:00Z" },
    ],
    sourceTrace: [
      { source: "CDR / IPDR Logs", type: "log", reference: "cdr_batch CDR-2024-03-13 / lines 14882–14895", detail: "carrier export, 14 outgoing calls, avg 47s", hash: "sha256:08f1…44a2", timestamp: "2024-03-13T18:22:00Z" },
    ],
  },
  {
    id: "d1", type: "device", label: "+39 011 555 0147", sublabel: "Burner Phone",
    x: 380, y: 560, confidence: 0.82, delay: 11200, step: 7,
    evidence: [
      { type: "log", title: "Device Attribution", detail: "Voiceprint of caller matches Speaker SPK-77 cluster — similarity 0.88. No subscriber on record.", timestamp: "2024-03-13T18:22:12Z" },
    ],
    sourceTrace: [
      { source: "AudioRAG", type: "audio", reference: "audio_id A-00882 @ 00:00:12", detail: "voiceprint match to SPK-77, similarity 0.88", hash: "sha256:55de…1c09" },
    ],
  },
  {
    id: "t1", type: "evidence", label: "$47,200 Wire Transfer", sublabel: "Transaction Evidence",
    x: 700, y: 580, confidence: 0.91, delay: 11500, step: 7, eventTime: "06:33",
    facts: [
      { label: "From",   value: "Account ***4821" },
      { label: "To",     value: "Account ***7293" },
      { label: "Amount", value: "$47,200" },
      { label: "Time",   value: "2024-03-14 06:33" },
      { label: "Flag",   value: "Structuring (AML R-17)" },
      { label: "Tx ID",  value: "0x4f8a…c3d1" },
    ],
    evidence: [
      { type: "transaction", title: "Wire Transfer Record", detail: "From: Acct ***4821 → Acct ***7293. Flagged: structuring pattern detected.", timestamp: "2024-03-14T06:33:12Z" },
    ],
    sourceTrace: [
      { source: "Financial Records", type: "transaction", reference: "tx_id 0x4f8a…c3d1 / ledger row 88213", detail: "wire transfer, amount $47,200, structuring flag raised by AML rule R-17", hash: "sha256:31bb…e4f7", timestamp: "2024-03-14T06:33:12Z" },
    ],
  },
  {
    id: "p2", type: "person_candidate", label: "Elena Vasquez", sublabel: "candidate · PER-7293",
    x: 860, y: 480, confidence: 0.74, delay: 11800, step: 7,
    evidence: [
      { type: "video", title: "CCTV Feed #47 — Centro / San Carlo", detail: "Subject detected at 09:47:11 UTC, confidence 74%.", timestamp: "2024-03-14T09:47:11Z" },
      { type: "metadata", title: "Inferred Association", detail: "Linked via financial transaction and overlapping location data.", timestamp: "2024-03-14T09:50:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — CCTV Feed #47", type: "video", reference: "frame 14021 @ 09:47:11", detail: "crop_id CR-91188 / vector_id VEC-44f02 / bbox [188,210,322,468]", hash: "sha256:6a09…b218", timestamp: "2024-03-14T09:47:11Z" },
      { source: "Financial Records", type: "transaction", reference: "tx_id 0x4f8a…c3d1 / recipient acct ***7293", detail: "account holder resolved → PER-7293", hash: "sha256:31bb…e4f7" },
    ],
  },
];

// =====================================================================
// EDGES
// =====================================================================
export const demoEdges: GraphEdge[] = [
  // ---- STEP 1 wires the case ↔ event ----
  {
    id: "e_c_ev", source: "c1", target: "ev1", type: "partOfCase", label: "seed of",
    confidence: 1.0, status: "observed", delay: 700, step: 1,
    rationaleSummary: "Semantic seed registered as the initial query of the case.",
    rationale: ["Case CASE-2024-0314 opened by analyst ANL-014", "Seed query Q-55812 attached as first artifact"],
  },

  // ---- STEP 2 — videos discovered, anchored to location ----
  {
    id: "e_ev_v1", source: "ev1", target: "v1", type: "appearsInVideo", label: "queried",
    confidence: 0.95, status: "observed", delay: 2100, step: 2,
    rationaleSummary: "Deckard query targeted CCTV feeds in the geofence.",
    rationale: ["Geofence Porta Susa ±2km includes CCTV-12", "Time window 72h covers the feed"],
  },
  {
    id: "e_ev_v2", source: "ev1", target: "v2", type: "appearsInVideo", label: "queried",
    confidence: 0.89, status: "observed", delay: 2400, step: 2,
    rationaleSummary: "Deckard query targeted CCTV feeds in the geofence.",
    rationale: ["Geofence Porta Susa ±2km includes CCTV-47", "Time window 72h covers the feed"],
  },
  {
    id: "e_v1_l", source: "v1", target: "l1", type: "occurredAt", label: "located at",
    confidence: 0.99, status: "validated", delay: 2700, step: 2,
    rationaleSummary: "Camera geo-registry resolves CCTV-12 to Porta Susa perimeter.",
    rationale: ["Surveyed fixed camera", "Geo-registry coordinates validated"],
  },
  {
    id: "e_v2_l", source: "v2", target: "l1", type: "occurredAt", label: "located at",
    confidence: 0.99, status: "validated", delay: 2900, step: 2,
    rationaleSummary: "Camera geo-registry resolves CCTV-47 to Porta Susa perimeter.",
    rationale: ["Surveyed fixed camera", "Geo-registry coordinates validated"],
  },

  // ---- STEP 3 — detection / crop / candidate ----
  {
    id: "e_v1_vd", source: "v1", target: "vd1", type: "appearsInVideo", label: "produced detection",
    confidence: 0.93, status: "observed", delay: 3800, step: 3,
    rationaleSummary: "Top-1 detection extracted from CCTV-12 by Deckard.",
    rationale: ["Frame 4123 @ 02:14:33", "Visual match score 0.93"],
  },
  {
    id: "e_vd_cr", source: "vd1", target: "cr1", type: "derivedFrom", label: "yields crop",
    confidence: 0.93, status: "observed", delay: 4100, step: 3,
    rationaleSummary: "Crop CR-88421 cut from detection bbox.",
    rationale: ["bbox [412,188,540,402]", "vector_id VEC-22a91 generated"],
  },
  {
    id: "e_cr_p", source: "cr1", target: "p1", type: "linkedToProfile", label: "candidate match",
    confidence: 0.86, status: "hypothesis", delay: 4500, step: 3,
    rationaleSummary: "Crop embedding NN-search returned PER-4821 as top candidate.",
    rationale: [
      "Embedding NN vs reference DB",
      "Similarity 0.86 — below VALIDATED threshold",
      "Identity not confirmed — analyst review pending",
    ],
  },
  {
    id: "e_p_v2", source: "p1", target: "v2", type: "appearsInVideo", label: "re-identified in",
    confidence: 0.89, status: "inferred", inferred: true, delay: 4800, step: 3,
    rationaleSummary: "Same crop embedding re-identified in CCTV-47.",
    rationale: [
      "Embedding NN-search across 847 feeds",
      "Re-identification sim 0.89 in CCTV-47",
      "Time delta consistent with on-foot transit Aurora → Centro",
    ],
  },

  // ---- STEP 4 — OSINT profile ----
  {
    id: "e_p_s", source: "p1", target: "s1", type: "linkedToProfile", label: "linked to profile",
    confidence: 0.71, status: "hypothesis", inferred: true, delay: 5800, step: 4,
    rationaleSummary: "Multiple weak signals link PER-4821 to public Instagram @mario.r_88. Identity not confirmed.",
    rationale: [
      "Same red sweatshirt visible in public Instagram post IG-77123 (CLIP sim 0.84)",
      "5 of 87 posts geo-tagged within 300m of Torino Porta Susa — same location pattern",
      "Shared event hashtag #aurora_torino_night with 2 other PER-4821-linked accounts",
      "Analyst validation pending",
    ],
  },

  // ---- STEP 5 — voice sample from public video ----
  {
    id: "e_s_vs", source: "s1", target: "vs1", type: "containsVoice", label: "contains voice",
    confidence: 0.84, status: "observed", delay: 7600, step: 5,
    rationaleSummary: "12s audio segment extracted from public Instagram video.",
    rationale: ["Source post IG-77123 contains in-frame speech", "Audio extracted at 16kHz mono", "SNR 18dB — usable for voiceprinting"],
  },

  // ---- STEP 6 — AudioRAG speaker cluster ----
  {
    id: "e_vs_sp", source: "vs1", target: "sp1", type: "matchesSpeaker", label: "matches speaker",
    confidence: 0.88, status: "inferred", inferred: true, delay: 9300, step: 6,
    rationaleSummary: "AudioRAG clusters voice sample with 3 intercepted calls.",
    rationale: [
      "Voiceprint A-9921 vs cluster centroid SPK-77, sim 0.88",
      "Cluster contains 4 samples (OSINT + 3 CDR)",
      "Intra-cluster similarity ≥ 0.86",
    ],
  },
  {
    id: "e_sp_p", source: "sp1", target: "p1", type: "linkedToProfile", label: "candidate speaker",
    confidence: 0.82, status: "hypothesis", inferred: true, delay: 9600, step: 6,
    rationaleSummary: "Speaker cluster tentatively attributed to PER-4821 via cross-modal correlation.",
    rationale: [
      "Voice sample A-9921 originates from profile @mario.r_88 (linked to PER-4821)",
      "Other cluster members are calls from device co-located with detection vd1",
      "Identity attribution remains a HYPOTHESIS",
    ],
  },

  // ---- STEP 7 — logs, device, transaction ----
  {
    id: "e_cl_d", source: "cl1", target: "d1", type: "called", label: "originates from",
    confidence: 0.99, status: "observed", delay: 11000, step: 7,
    rationaleSummary: "CDR batch records originate from this MSISDN.",
    rationale: ["MSISDN +39 011 555 0147 present on all 14 CDRs"],
  },
  {
    id: "e_d_sp", source: "d1", target: "sp1", type: "matchesSpeaker", label: "voiceprint",
    confidence: 0.88, status: "inferred", inferred: true, delay: 11300, step: 7,
    rationaleSummary: "Caller voiceprint matches Speaker SPK-77 cluster.",
    rationale: ["AudioRAG sim 0.88 vs SPK-77", "3 intercepted calls contributed to the cluster"],
  },
  {
    id: "e_p_t", source: "p1", target: "t1", type: "sentMoneyTo", label: "sent $47.2K",
    confidence: 0.91, status: "observed", delay: 11600, step: 7,
    rationaleSummary: "Wire transfer originated from account linked to PER-4821.",
    rationale: ["Source account ***4821 resolves to candidate PER-4821", "AML rule R-17 raised structuring flag"],
  },
  {
    id: "e_t_p2", source: "t1", target: "p2", type: "sentMoneyTo", label: "received by",
    confidence: 0.91, status: "observed", delay: 11900, step: 7,
    rationaleSummary: "Recipient account holder resolved via financial records.",
    rationale: ["Recipient account ***7293 mapped to PER-7293 (Elena Vasquez)"],
  },
  {
    id: "e_p2_v2", source: "p2", target: "v2", type: "appearsInVideo", label: "detected in",
    confidence: 0.74, status: "hypothesis", inferred: true, delay: 12100, step: 7,
    rationaleSummary: "Visual similarity to a reference crop — pending analyst validation.",
    rationale: ["Crop CR-91188 in CCTV-47 @ 09:47:11", "Embedding similarity 0.74", "Below 0.80 threshold — flagged as hypothesis"],
  },
];

// =====================================================================
// AGENT LOG (aligned with the 8 demo steps)
// =====================================================================
export const agentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[] = [
  // step 1
  { message: "Case CASE-2024-0314 opened — scope: Torino Porta Susa, 72h lookback", delay: 0, level: "info" },
  { message: "Seed query Q-55812: \"man wearing a red sweatshirt\"", delay: 600, level: "info" },
  // step 2
  { message: "Deckard scanning 847 station feeds in geofence...", delay: 1900, level: "info" },
  { message: "Anchored CCTV-12 + CCTV-47 to Porta Susa perimeter", delay: 2700, level: "success" },
  // step 3
  { message: "MATCH: top-1 detection in CCTV-12 — visual score 0.93", delay: 3800, level: "success" },
  { message: "Crop CR-88421 → NN candidate Mario Rossi (PER-4821) sim 0.86 — HYPOTHESIS", delay: 4400, level: "warning" },
  { message: "Re-identification in CCTV-47 (Centro Torino) — sim 0.89", delay: 4800, level: "success" },
  // step 4
  { message: "OSINT match: public Instagram @mario.r_88 — garment + geo + tags", delay: 5700, level: "warning" },
  // step 5
  { message: "Extracting 12s voice sample A-9921 from public post IG-77123", delay: 7400, level: "info" },
  // step 6
  { message: "AudioRAG: voice sample joins speaker cluster SPK-77 (4 samples)", delay: 9200, level: "success" },
  // step 7
  { message: "CDR batch: 14 calls from +39 011 555 0147 in 72h", delay: 10900, level: "info" },
  { message: "Burner phone voiceprint matches SPK-77 — sim 0.88", delay: 11300, level: "warning" },
  { message: "ALERT: $47,200 wire transfer ***4821 → ***7293 — structuring flagged", delay: 11700, level: "warning" },
  { message: "Recipient resolved: Elena Vasquez (PER-7293)", delay: 12000, level: "success" },
  // step 8
  { message: "Awaiting analyst review — 4 hypothesis links pending validation", delay: 12700, level: "info" },
  { message: "Investigation graph complete — 14 entities, 18 relationships", delay: 13800, level: "success" },
];

// =====================================================================
// TIMELINE
// =====================================================================
export const timelineEvents = [
  { time: "2024-03-13 18:22", event: "First burner phone call detected", entity: "d1" },
  { time: "2024-03-14 02:14", event: "Deckard match — \"man with red sweatshirt\" in CCTV-12", entity: "vd1" },
  { time: "2024-03-14 06:33", event: "$47,200 wire transfer initiated", entity: "t1" },
  { time: "2024-03-14 08:00", event: "CCTV-47 recording begins", entity: "v2" },
  { time: "2024-03-14 09:47", event: "Elena Vasquez detected in Centro Torino", entity: "p2" },
  { time: "2024-03-14 10:02", event: "OSINT match: @mario.r_88 (Instagram)", entity: "s1" },
  { time: "2024-03-14 10:18", event: "AudioRAG cluster SPK-77 formed (4 samples)", entity: "sp1" },
];

// =====================================================================
// REASONING (used by the Reasoning tab)
// =====================================================================
export const reasoningSteps = [
  { step: 1, title: "Semantic Seed Query", detail: "Analyst opened case CASE-2024-0314 and submitted Deckard query \"man wearing a red sweatshirt\" with a 72h lookback over Torino Porta Susa.", confidence: 0.95 },
  { step: 2, title: "Visual Semantic Match", detail: "Visual semantic match: subject wearing red sweatshirt detected across multiple cameras. Identity not confirmed.", confidence: 0.86 },
  { step: 3, title: "OSINT Profile Candidate", detail: "Public Instagram @mario.r_88 surfaced as candidate via garment match (CLIP sim 0.84), geo-cluster around Porta Susa, and shared event hashtags.", confidence: 0.71 },
  { step: 4, title: "Voice Sample Extraction", detail: "12s voice sample extracted from a public Instagram video posted by the same profile. Audio quality usable for voiceprinting.", confidence: 0.84 },
  { step: 5, title: "AudioRAG Speaker Cluster", detail: "AudioRAG clustered the OSINT sample with 3 intercepted calls into Speaker SPK-77 (intra-cluster similarity ≥ 0.86).", confidence: 0.88 },
  { step: 6, title: "Comms & Financial Context", detail: "CDR batch links burner phone to SPK-77; wire transfer of $47,200 from account ***4821 → ***7293 raises structuring flag.", confidence: 0.91 },
  { step: 7, title: "Second Subject Inferred", detail: "Recipient ***7293 resolves to Elena Vasquez (PER-7293), subsequently detected in CCTV-47 at 09:47 UTC. INFERRED: coordination.", confidence: 0.74 },
  { step: 8, title: "Analyst Validation", detail: "4 HYPOTHESIS links remain pending analyst validation before promotion to VALIDATED status.", confidence: 0.80 },
];

// =====================================================================
// =====================================================================
// VEHICLE-DRIVEN SCENARIO
// Seed: suspicious vehicle near Torino Porta Susa (partial plate AB123)
// =====================================================================
// =====================================================================

export const vehicleDemoSteps: DemoStep[] = [
  { step: 1, startMs:     0, eventTime: "08:17", title: "Suspicious vehicle detected",       subtitle: "ANPR / city camera flags black FIAT Tipo at Porta Susa" },
  { step: 2, startMs:  1800, eventTime: "08:18", title: "Registry → owner",                  subtitle: "Partial plate resolves to registered owner" },
  { step: 3, startMs:  3600, eventTime: "08:19", title: "Telecom + financial context",       subtitle: "Recent calls and a suspicious transaction surface" },
  { step: 4, startMs:  5400, eventTime: "08:19", title: "Deckard extracts visual evidence",  subtitle: "Person exiting the vehicle captured at Porta Susa" },
  { step: 5, startMs:  7200, eventTime: "09:06", title: "Deckard visual search match",       subtitle: "Same individual appears near a logistics warehouse" },
  { step: 6, startMs:  9000, eventTime: "09:06", title: "Warehouse appearance event",        subtitle: "Spatio-temporal event built from Deckard match" },
  { step: 7, startMs: 10800, eventTime: "09:10", title: "AI hypothesis assembled",           subtitle: "Coordinated logistics activity inferred" },
  { step: 8, startMs: 12600, eventTime: "09:30", title: "Analyst validates / rejects",       subtitle: "Promote or discard hypothesis links" },
];

export const vehicleDemoTotalMs = 14400;

// ----- Nodes -----
export const vehicleDemoNodes: GraphNode[] = [
  // STEP 1 — Suspicious Vehicle Detected (Event) + Vehicle entity + Location
  {
    id: "vev1", type: "event", label: "Suspicious Vehicle Detected", sublabel: "Porta Susa · 08:17",
    x: 280, y: 150, confidence: 0.82, delay: 0, step: 1, eventTime: "08:17",
    evidence: [
      { type: "metadata", title: "Event", detail: "Black FIAT Tipo detected near Torino Porta Susa with partial license plate and abnormally long stop in a short-stay / drop-off area.", timestamp: "2026-05-04T08:17:00Z" },
      { type: "metadata", title: "Why suspicious", detail: "1) overstay in short-stay zone; 2) ANPR captured only partial plate 'GF-7K*2'; 3) prefix matches a vehicle seen near another sensitive location in the prior 72h.", timestamp: "2026-05-04T08:17:30Z" },
    ],
    sourceTrace: [
      { source: "ANPR / City Camera", type: "log", reference: "anpr_event AE-22041 · cam ANPR-12 (Porta Susa)", detail: "OCR partial plate 'GF-7K*2' · stop duration 14m in short-stay zone", hash: "sha256:aa11…ff02", timestamp: "2026-05-04T08:17:00Z" },
    ],
  },
  {
    id: "veh1", type: "vehicle", label: "Black FIAT Tipo", sublabel: "partial plate GF-7K*2",
    x: 480, y: 150, confidence: 0.76, delay: 600, step: 1,
    evidence: [
      { type: "metadata", title: "Vehicle Descriptor", detail: "Make/model: FIAT Tipo · Color: black · Partial plate: GF-7K*2 (last 2 chars unreadable).", timestamp: "2026-05-04T08:17:05Z" },
    ],
    sourceTrace: [
      { source: "ANPR / City Camera", type: "log", reference: "anpr_event AE-22041 · partial plate", detail: "OCR confidence 0.76 on 5 of 7 characters", hash: "sha256:b2c1…aa31" },
    ],
  },
  // STEP 2 — Registered Owner
  {
    id: "vown", type: "owner", label: "Registered Owner", sublabel: "Andrea Ferraro",
    x: 680, y: 150, confidence: 0.9, delay: 1900, step: 2,
    evidence: [
      { type: "metadata", title: "Registered Owner", detail: "Andrea Ferraro · address Torino, Italy · phone +39 XXX XXX XXXX · email andrea.ferraro@example.com · bank account ITXX XXXX XXXX.", timestamp: "2026-05-04T08:18:10Z" },
    ],
    sourceTrace: [
      { source: "Vehicle Registry (MIT)", type: "log", reference: "owner_id OWN-7741", detail: "Resolved from candidate plates matching prefix GF-7K + FIAT Tipo (1 unique match after filter)", hash: "sha256:11aa…77ff", timestamp: "2026-05-04T08:18:10Z" },
    ],
  },

  // STEP 3 — Telecom + Financial evidence
  {
    id: "vcdr", type: "communications_log", label: "Recent Call Pattern", sublabel: "CDR · 14 calls / 72h",
    x: 880, y: 240, confidence: 1.0, delay: 3700, step: 3, eventTime: "07:39",
    facts: [
      { label: "Calls",    value: "14 in last 72h" },
      { label: "Peer",     value: "Recurring unknown number" },
      { label: "Last",     value: "2026-05-04 07:39 (38m before Porta Susa)" },
    ],
    evidence: [
      { type: "log", title: "Call Detail Records", detail: "Multiple calls in the last 72h to an unknown recurring number. Last call 38 minutes before the Porta Susa detection.", timestamp: "2026-05-04T07:39:00Z" },
    ],
    sourceTrace: [
      { source: "CDR / IPDR Logs", type: "log", reference: "cdr_batch CDR-2026-05-04 · 14 rows", detail: "Carrier export, recurring peer MSISDN appears 14×", hash: "sha256:08f1…44a2", timestamp: "2026-05-04T07:39:00Z" },
    ],
  },
  {
    id: "vtx", type: "evidence", label: "Suspicious Transaction", sublabel: "Transaction Evidence",
    x: 880, y: 380, confidence: 1.0, delay: 4100, step: 3, eventTime: "19:42",
    facts: [
      { label: "Amount",    value: "€2,850" },
      { label: "Recipient", value: "Warehouse service provider" },
      { label: "Time",      value: "2026-05-03 19:42" },
      { label: "Source",    value: "Banking records" },
    ],
    evidence: [
      { type: "transaction", title: "Bank Transfer", detail: "€2,850 sent to a logistics-related account (warehouse service provider) the evening before the Porta Susa event.", timestamp: "2026-05-03T19:42:00Z" },
    ],
    sourceTrace: [
      { source: "Financial Records", type: "transaction", reference: "tx_id TR-99820", detail: "Sender account ITXX XXXX XXXX (owner) → recipient 'LogiTorino Srl'", hash: "sha256:31bb…e4f7", timestamp: "2026-05-03T19:42:00Z" },
    ],
  },

  // STEP 4 — Cropped visual evidence (Deckard frame export)
  {
    id: "vcrop", type: "image_evidence", label: "Person Exiting Vehicle", sublabel: "Deckard frame · CCTV-12",
    x: 280, y: 410, confidence: 0.89, delay: 5500, step: 4, eventTime: "08:19",
    mediaImage: {
      src: new URL("../assets/vehicle-detection-porta-susa.jpg", import.meta.url).href,
      caption: "Porta Susa Cam 12 · 08:19:11 — adult male exits driver side of black FIAT Tipo",
    },
    deckardLink: {
      url: "https://deckard.example/case/CASE-2026-0504/clip/CR-22041",
      label: "Open full video in Deckard",
    },
    facts: [
      { label: "Frame ID",  value: "CR-22041" },
      { label: "Camera",    value: "porta_susa_cam_12" },
      { label: "Time",      value: "2026-05-04 08:19" },
      { label: "Confidence",value: "0.89" },
    ],
    evidence: [
      { type: "video", title: "Cropped Frame", detail: "Image of a person exiting the black FIAT Tipo, extracted from CCTV-12 by Deckard. Full video review must be performed in Deckard.", timestamp: "2026-05-04T08:19:11Z" },
    ],
    sourceTrace: [
      { source: "Deckard — CCTV-12 export", type: "image", reference: "frame_id CR-22041 / vector_id VEC-77c12", detail: "Frame export only — full video resides in Deckard", hash: "sha256:9f2a…b71c", timestamp: "2026-05-04T08:19:11Z" },
    ],
  },

  // STEP 5 — Deckard search result (visual match elsewhere)
  {
    id: "vmatch", type: "image_evidence", label: "Same Individual Detected Again", sublabel: "Deckard visual search · warehouse",
    x: 480, y: 410, confidence: 0.79, delay: 7300, step: 5, eventTime: "09:06",
    mediaImage: {
      src: new URL("../assets/deckard-warehouse-match.jpg", import.meta.url).href,
      caption: "Deckard match · logistics warehouse, Turin outskirts · 09:06:42",
    },
    deckardLink: {
      url: "https://deckard.example/case/CASE-2026-0504/match/deckard_crop_017",
      label: "Open match in Deckard",
    },
    facts: [
      { label: "Frame ID",   value: "deckard_crop_017" },
      { label: "Match conf", value: "0.79" },
      { label: "Time",       value: "2026-05-04 09:06" },
      { label: "Location",   value: "Logistics warehouse, Turin outskirts" },
    ],
    evidence: [
      { type: "metadata", title: "Deckard Visual Search", detail: "Deckard matched the cropped individual against other camera feeds and surfaced a likely second appearance near a logistics warehouse less than one hour later.", timestamp: "2026-05-04T09:06:42Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Visual Search", type: "image", reference: "match_id deckard_crop_017", detail: "Cross-feed visual NN-search · sim 0.79", hash: "sha256:7710…cc12", timestamp: "2026-05-04T09:06:42Z" },
    ],
  },
  {
    id: "vwhloc", type: "location", label: "Logistics Warehouse", sublabel: "Turin outskirts",
    x: 680, y: 320, confidence: 0.92, delay: 7700, step: 5,
    sourceTrace: [
      { source: "Geo-registry", type: "log", reference: "site_id WH-7712", detail: "Industrial warehouse, Turin outskirts", hash: "sha256:42aa…02de" },
    ],
  },

  // STEP 6 — Warehouse appearance event
  {
    id: "vev2", type: "event", label: "Warehouse Appearance", sublabel: "09:06 · Turin outskirts",
    x: 680, y: 460, confidence: 0.79, delay: 9100, step: 6, eventTime: "09:06",
    evidence: [
      { type: "metadata", title: "Spatio-temporal Event", detail: "Same individual appears near a logistics warehouse less than one hour after the Porta Susa event.", timestamp: "2026-05-04T09:06:42Z" },
    ],
    sourceTrace: [
      { source: "Deckard match metadata", type: "log", reference: "match_id deckard_crop_017", detail: "Event derived from visual match + camera geo-anchor", hash: "sha256:7710…cc12", timestamp: "2026-05-04T09:06:42Z" },
    ],
  },

  // STEP 7 — AI inference
  {
    id: "vinf", type: "person_candidate", label: "Possible Coordinated Logistics Activity", sublabel: "AI hypothesis · INF-014",
    x: 460, y: 600, confidence: 0.74, delay: 10900, step: 7, eventTime: "09:10",
    evidence: [
      { type: "metadata", title: "AI-generated Hypothesis", detail: "Vehicle detection, owner records, recent calls, suspicious financial transaction, and a second visual match together suggest possible coordinated logistics activity.", timestamp: "2026-05-04T09:10:00Z" },
    ],
    sourceTrace: [
      { source: "Reasoning Engine", type: "nlp", reference: "inference_id INF-014", detail: "Multi-evidence aggregation · 7 supporting signals · prior weight 0.74", hash: "sha256:dd31…ab90" },
    ],
  },
];

// ----- Edges -----
export const vehicleDemoEdges: GraphEdge[] = [
  // STEP 1 — event ↔ vehicle ↔ location
  { id: "ve1", source: "vev1", target: "veh1", type: "derivedFrom", label: "detected vehicle", confidence: 0.82, status: "observed", delay: 800, step: 1,
    rationaleSummary: "Vehicle descriptor extracted from the ANPR + camera event.",
    rationale: ["FIAT Tipo, black", "Partial plate GF-7K*2", "Stop duration 14m in short-stay zone"] },
  { id: "ve2", source: "vev1", target: "vloc", type: "occurredAt", label: "at",           confidence: 0.99, status: "validated", delay: 1100, step: 1,
    rationaleSummary: "Camera ANPR-12 anchored to Porta Susa perimeter.",
    rationale: ["Surveyed fixed camera", "Within geofence GF-PS-001"] },

  // STEP 2 — vehicle → owner
  { id: "ve3", source: "veh1", target: "vown", type: "linkedToProfile", label: "registered owner", confidence: 0.9, status: "observed", delay: 2200, step: 2,
    rationaleSummary: "Registry resolves the partial plate + descriptor to a single owner.",
    rationale: ["Plate prefix GF-7K + FIAT Tipo → 1 unique match", "Owner OWN-7741 (Andrea Ferraro)"] },

  // STEP 3 — owner ↔ comms / financial
  { id: "ve4", source: "vown", target: "vcdr", type: "called", label: "has call pattern", confidence: 1.0, status: "observed", delay: 3900, step: 3,
    rationaleSummary: "CDR rows attributed to the owner's MSISDN.",
    rationale: ["14 calls in 72h", "Recurring peer", "Last call 38m before Porta Susa event"] },
  { id: "ve5", source: "vown", target: "vtx", type: "sentMoneyTo", label: "made transaction", confidence: 1.0, status: "observed", delay: 4300, step: 3,
    rationaleSummary: "Bank transfer from owner's account to a warehouse service provider.",
    rationale: ["€2,850 sent on 2026-05-03 19:42", "Recipient: LogiTorino Srl"] },

  // STEP 4 — event → cropped visual evidence
  { id: "ve6", source: "vev1", target: "vcrop", type: "appearsInVideo", label: "visual evidence", confidence: 0.89, status: "observed", delay: 5700, step: 4,
    rationaleSummary: "Deckard extracted a frame showing a person exiting the vehicle.",
    rationale: ["Frame CR-22041 @ 08:19:11", "Camera porta_susa_cam_12", "Confidence 0.89"] },
  { id: "ve7", source: "vcrop", target: "veh1", type: "appearsInVideo", label: "near vehicle", confidence: 0.89, status: "observed", delay: 5900, step: 4,
    rationaleSummary: "Cropped person observed exiting driver side of the FIAT Tipo.",
    rationale: ["Spatial overlap with vehicle bbox", "Same frame as vehicle detection"] },

  // STEP 5 — Deckard search match
  { id: "ve8", source: "vcrop", target: "vmatch", type: "linkedToProfile", label: "searched in Deckard", confidence: 0.79, status: "inferred", delay: 7500, step: 5,
    rationaleSummary: "Cross-feed visual search returned a likely second appearance.",
    rationale: ["Visual NN-search across regional cameras", "Match similarity 0.79", "Time delta < 1h consistent with on-vehicle transit"] },
  { id: "ve9", source: "vmatch", target: "vwhloc", type: "occurredAt", label: "at warehouse", confidence: 0.92, status: "observed", delay: 7900, step: 5,
    rationaleSummary: "Match camera anchored to the warehouse site.",
    rationale: ["Camera geo-registry", "Site WH-7712 (Turin outskirts)"] },

  // STEP 6 — warehouse event built from match
  { id: "ve10", source: "vmatch", target: "vev2", type: "occurredAt", label: "observed at", confidence: 0.79, status: "inferred", delay: 9300, step: 6,
    rationaleSummary: "Spatio-temporal event derived from the Deckard match.",
    rationale: ["Match deckard_crop_017 @ 09:06:42", "Anchored to warehouse location"] },
  { id: "ve11", source: "vev2", target: "vwhloc", type: "occurredAt", label: "at",          confidence: 0.95, status: "validated", delay: 9500, step: 6 },

  // STEP 7 — supports → inference (all evidence supports the hypothesis)
  { id: "vi1", source: "vev1",  target: "vinf", type: "derivedFrom", label: "supports", confidence: 0.82, status: "inferred", delay: 11000, step: 7 },
  { id: "vi2", source: "veh1",  target: "vinf", type: "derivedFrom", label: "supports", confidence: 0.76, status: "inferred", delay: 11100, step: 7 },
  { id: "vi3", source: "vown",  target: "vinf", type: "derivedFrom", label: "supports", confidence: 0.9,  status: "inferred", delay: 11200, step: 7 },
  { id: "vi4", source: "vcdr",  target: "vinf", type: "derivedFrom", label: "supports", confidence: 1.0,  status: "inferred", delay: 11300, step: 7 },
  { id: "vi5", source: "vtx",   target: "vinf", type: "derivedFrom", label: "supports", confidence: 1.0,  status: "inferred", delay: 11400, step: 7 },
  { id: "vi6", source: "vcrop", target: "vinf", type: "derivedFrom", label: "supports", confidence: 0.89, status: "inferred", delay: 11500, step: 7 },
  { id: "vi7", source: "vmatch",target: "vinf", type: "derivedFrom", label: "supports", confidence: 0.79, status: "inferred", delay: 11600, step: 7 },
];

// ----- Agent log (vehicle scenario) -----
export const vehicleAgentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[] = [
  { message: "ANPR ALERT: black FIAT Tipo · partial plate GF-7K*2 · Porta Susa", delay: 0, level: "warning" },
  { message: "Anomaly: 14m stop in short-stay zone + prior sighting near sensitive site", delay: 700, level: "warning" },
  { message: "Resolving partial plate against vehicle registry...", delay: 1900, level: "info" },
  { message: "Registry MATCH: plate GF-7KQ2 → owner Andrea Ferraro (OWN-7741)", delay: 2400, level: "success" },
  { message: "CDR pull: 14 calls in 72h to a recurring unknown number", delay: 3800, level: "info" },
  { message: "Last call placed 38m before Porta Susa detection", delay: 4000, level: "warning" },
  { message: "Banking records: €2,850 sent 2026-05-03 19:42 to 'LogiTorino Srl'", delay: 4300, level: "warning" },
  { message: "Deckard: extracting frame CR-22041 — person exits driver side", delay: 5700, level: "info" },
  { message: "Deckard visual search across regional feeds...", delay: 7300, level: "info" },
  { message: "MATCH: same individual at logistics warehouse @ 09:06 (sim 0.79)", delay: 7700, level: "success" },
  { message: "Building spatio-temporal event 'Warehouse Appearance'", delay: 9300, level: "info" },
  { message: "Hypothesis assembled: possible coordinated logistics activity (0.74)", delay: 11000, level: "warning" },
  { message: "Awaiting analyst validation — 4 inferred links pending", delay: 12700, level: "info" },
  { message: "Investigation graph complete — 10 nodes, 14 relationships", delay: 13800, level: "success" },
];

// ----- Reasoning chain (vehicle scenario) -----
export const vehicleReasoningSteps = [
  { step: 1, title: "Suspicious Vehicle Detected", detail: "Black FIAT Tipo flagged at Porta Susa: overstay in short-stay zone, partial plate 'GF-7K*2', and prefix matches a vehicle seen near another sensitive site recently.", confidence: 0.82 },
  { step: 2, title: "Owner Resolution", detail: "Partial plate + make/model uniquely match plate GF-7KQ2 in MIT registry, registered to Andrea Ferraro.", confidence: 0.9 },
  { step: 3, title: "Telecom + Financial Context", detail: "14 calls in 72h to a recurring unknown number (last 38m before the event) and a €2,850 transfer to a warehouse service provider the night before.", confidence: 1.0 },
  { step: 4, title: "Visual Evidence", detail: "Deckard exports a cropped frame from CCTV-12 showing a person exiting the driver side of the FIAT Tipo at 08:19.", confidence: 0.89 },
  { step: 5, title: "Deckard Visual Search", detail: "Cross-feed visual search returns a likely second appearance of the same individual near a logistics warehouse on the Turin outskirts at 09:06.", confidence: 0.79 },
  { step: 6, title: "Warehouse Appearance Event", detail: "Spatio-temporal event built from the Deckard match anchored to warehouse coordinates.", confidence: 0.79 },
  { step: 7, title: "AI Hypothesis", detail: "Vehicle, owner, recent comms, financial transfer, and second visual match jointly support 'Possible coordinated logistics activity'.", confidence: 0.74 },
  { step: 8, title: "Analyst Validation", detail: "Inferred links remain HYPOTHESIS until promoted by the analyst.", confidence: 0.8 },
];

// ----- Timeline -----
export const vehicleTimelineEvents = [
  { time: "2026-05-03 19:42", event: "€2,850 transfer to warehouse service provider", entity: "vtx" },
  { time: "2026-05-04 07:39", event: "Last call to recurring unknown number", entity: "vcdr" },
  { time: "2026-05-04 08:17", event: "Suspicious vehicle detected at Porta Susa", entity: "vev1" },
  { time: "2026-05-04 08:18", event: "Registry resolves owner: Andrea Ferraro", entity: "vown" },
  { time: "2026-05-04 08:19", event: "Deckard frame: person exits FIAT Tipo", entity: "vcrop" },
  { time: "2026-05-04 09:06", event: "Deckard match at logistics warehouse", entity: "vmatch" },
  { time: "2026-05-04 09:10", event: "AI hypothesis assembled", entity: "vinf" },
];

// =====================================================================
// SCENARIO SELECTOR
// =====================================================================
export type SeedMode = "visual" | "vehicle";

export interface Scenario {
  mode: SeedMode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  steps: DemoStep[];
  totalMs: number;
  agentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[];
  reasoningSteps: { step: number; title: string; detail: string; confidence: number }[];
  timelineEvents: { time: string; event: string; entity: string }[];
  /** Default highlight chain when the user hits "Highlight Connection Chain" */
  defaultHighlightChain: string[];
}

export const visualScenario: Scenario = {
  mode: "visual",
  nodes: demoNodes,
  edges: demoEdges,
  steps: demoSteps,
  totalMs: demoTotalMs,
  agentLogs,
  reasoningSteps,
  timelineEvents,
  defaultHighlightChain: ["p1", "t1", "p2", "v2"],
};

export const vehicleScenario: Scenario = {
  mode: "vehicle",
  nodes: vehicleDemoNodes,
  edges: vehicleDemoEdges,
  steps: vehicleDemoSteps,
  totalMs: vehicleDemoTotalMs,
  agentLogs: vehicleAgentLogs,
  reasoningSteps: vehicleReasoningSteps,
  timelineEvents: vehicleTimelineEvents,
  defaultHighlightChain: ["vev1", "veh1", "vown", "vcrop", "vmatch", "vinf"],
};

// =====================================================================
// DEMO PLAYBACK SPEED
// ---------------------------------------------------------------------
// Multiplier applied to every node/edge/log delay and to totalMs.
//   1   = original speed
//   2   = twice as slow (recommended for live narration)
//   3   = three times slower, etc.
// Change this single value to slow the whole demo down/up.
// =====================================================================
export const DEMO_SPEED_MULTIPLIER = 4;

function scaleScenario(s: Scenario, factor: number): Scenario {
  if (factor === 1) return s;
  return {
    ...s,
    nodes: s.nodes.map((n) => ({ ...n, delay: Math.round(n.delay * factor) })),
    edges: s.edges.map((e) => ({ ...e, delay: Math.round(e.delay * factor) })),
    agentLogs: s.agentLogs.map((l) => ({ ...l, delay: Math.round(l.delay * factor) })),
    totalMs: Math.round(s.totalMs * factor),
  };
}

/**
 * Auto-fills `layer`, `timestamp`, `primarySource` on every node and
 * `probability` on every edge so existing scenario data does not need to
 * be edited by hand to comply with the multi-layer model.
 */
function normalizeScenario(s: Scenario): Scenario {
  return {
    ...s,
    nodes: s.nodes.map((n) => ({
      ...n,
      layer: getNodeLayer(n),
      timestamp: getNodeTimestamp(n),
      primarySource: getNodePrimarySource(n),
    })),
    edges: s.edges.map((e) => ({
      ...e,
      probability: getEdgeProbability(e),
    })),
  };
}

export function getScenario(mode: SeedMode): Scenario {
  const base = mode === "vehicle" ? vehicleScenario : visualScenario;
  return scaleScenario(normalizeScenario(base), DEMO_SPEED_MULTIPLIER);
}

