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

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  confidence: number;
  evidence?: Evidence[];
  /** Structured fact-list for evidence nodes (Camera/Time/Detection/Attribute…) */
  facts?: EvidenceFact[];
  /** Scenario-clock time of the event (e.g. "17:12") shown on the node and timeline */
  eventTime?: string;
  sourceTrace?: SourceTraceItem[];
  delay: number; // ms delay before appearing
  /** Demo progression step (1-8) this node belongs to */
  step?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  confidence: number;
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
    id: "vd1", type: "video_detection", label: "Detection #88421", sublabel: "CCTV-12 · 02:14:33",
    x: 180, y: 360, confidence: 0.93, delay: 3700, step: 3,
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
    id: "vs1", type: "voice_sample", label: "Voice Sample A-9921", sublabel: "from IG-77123 · 12s",
    x: 720, y: 280, confidence: 0.84, delay: 7300, step: 5,
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
    id: "t1", type: "transaction", label: "$47,200 Transfer", sublabel: "TX: 0x4f8a…c3d1",
    x: 700, y: 580, confidence: 0.91, delay: 11500, step: 7,
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
  { step: 1, startMs:     0, eventTime: "17:05", title: "Seed received",                       subtitle: "Vehicle · partial plate AB123 · Porta Susa · 17:00–20:00" },
  { step: 2, startMs:  1800, eventTime: "17:09", title: "Vehicle registry → owner",            subtitle: "Structured lookup resolves plate to registered owner" },
  { step: 3, startMs:  3600, eventTime: "17:42", title: "ANPR + event logs",                   subtitle: "Vehicle pinged by traffic cameras near the station" },
  { step: 4, startMs:  5400, eventTime: "17:44", title: "Deckard searches station video",      subtitle: "Vehicle + person exiting matched in CCTV feeds" },
  { step: 5, startMs:  7200, eventTime: "18:02", title: "OSINT profile candidate",             subtitle: "Public social profile linked to the candidate" },
  { step: 6, startMs:  9000, eventTime: "19:02", title: "AudioRAG speaker cluster",            subtitle: "Voice sample from social + intercepted calls clustered" },
  { step: 7, startMs: 10800, eventTime: "18:11", title: "Comms + transactions add context",    subtitle: "CDR and financial activity correlated to subject" },
  { step: 8, startMs: 12600, eventTime: "20:30", title: "Analyst validates / rejects",         subtitle: "Hypothesis links pending promotion to VALIDATED" },
];

export const vehicleDemoTotalMs = 14400;

// ----- Nodes -----
export const vehicleDemoNodes: GraphNode[] = [
  // STEP 1 — seed
  {
    id: "vc1", type: "case", label: "CASE-2026-0412", sublabel: "Torino · Porta Susa",
    x: 110, y: 150, confidence: 1.0, delay: 0, step: 1,
    evidence: [
      { type: "metadata", title: "Case Opened", detail: "Suspicious vehicle reported near Torino Porta Susa station.", timestamp: "2026-04-12T17:05:00Z" },
    ],
    sourceTrace: [
      { source: "Case Management", type: "log", reference: "case_id CASE-2026-0412", detail: "manual case creation by analyst id ANL-021", hash: "sha256:aa11…ff02", timestamp: "2026-04-12T17:05:00Z" },
    ],
  },
  {
    id: "vev1", type: "event", label: "Vehicle Sighting Report", sublabel: "12 Apr 2026 · 17:00–20:00",
    x: 280, y: 150, confidence: 1.0, delay: 400, step: 1,
    evidence: [
      { type: "metadata", title: "Seed Report", detail: "Witness report: dark FIAT Tipo, partial plate AB123, loitering near Porta Susa entrance between 17:00 and 20:00.", timestamp: "2026-04-12T17:05:30Z" },
    ],
    sourceTrace: [
      { source: "Operator Intake", type: "log", reference: "report_id RPT-77129", detail: "phone tip, transcribed by operator OP-09, geofence Porta Susa ±1km", hash: "sha256:b2c1…aa31", timestamp: "2026-04-12T17:05:30Z" },
    ],
  },
  {
    id: "veh1", type: "vehicle", label: "FIAT Tipo · AB123**", sublabel: "partial plate",
    x: 460, y: 150, confidence: 0.92, delay: 800, step: 1,
    evidence: [
      { type: "metadata", title: "Vehicle Descriptor", detail: "FIAT Tipo, dark color, plate begins with AB123, last two characters unknown.", timestamp: "2026-04-12T17:05:30Z" },
    ],
    sourceTrace: [
      { source: "Operator Intake", type: "log", reference: "report_id RPT-77129 · field 'plate'", detail: "partial plate string \"AB123\" + descriptor 'FIAT Tipo'", hash: "sha256:b2c1…aa31" },
    ],
  },
  {
    id: "vloc", type: "location", label: "Porta Susa", sublabel: "45.0729°N · 7.6660°E",
    x: 110, y: 280, confidence: 0.99, delay: 1100, step: 1,
    sourceTrace: [
      { source: "Geofence Service", type: "log", reference: "geofence_id GF-PS-001", detail: "Torino Porta Susa station perimeter, radius 1km", hash: "sha256:ce71…0042" },
    ],
  },

  // STEP 2 — vehicle registry → owner
  {
    id: "vreg", type: "vehicle_registration", label: "Vehicle Registry", sublabel: "ITV-MIT · plate AB123XY",
    x: 460, y: 280, confidence: 0.95, delay: 1900, step: 2,
    evidence: [
      { type: "log", title: "Registry Lookup", detail: "Plate prefix AB123 + descriptor FIAT Tipo → 1 unique match: AB123XY, registered to L. Bianchi.", timestamp: "2026-04-12T17:09:00Z" },
    ],
    sourceTrace: [
      { source: "Vehicle Registry (MIT)", type: "log", reference: "record_id REG-AB123XY", detail: "plate AB123XY, FIAT Tipo, registered 2019-06-11 to owner OWN-3392", hash: "sha256:11aa…77ff", timestamp: "2026-04-12T17:09:00Z" },
    ],
  },
  {
    id: "vown", type: "owner", label: "Luca Bianchi", sublabel: "owner · OWN-3392",
    x: 640, y: 280, confidence: 0.95, delay: 2300, step: 2,
    evidence: [
      { type: "metadata", title: "Registered Owner", detail: "Luca Bianchi (OWN-3392), born 1985, residence Torino. Holder of plate AB123XY since 2019.", timestamp: "2026-04-12T17:09:01Z" },
    ],
    sourceTrace: [
      { source: "Vehicle Registry (MIT)", type: "log", reference: "owner_id OWN-3392", detail: "registered owner of plate AB123XY", hash: "sha256:11aa…77ff" },
    ],
  },

  // STEP 3 — ANPR / event logs
  {
    id: "vanpr", type: "event", label: "ANPR Hit", sublabel: "Cam ANPR-07 · 17:42",
    x: 280, y: 410, confidence: 0.96, delay: 3700, step: 3,
    evidence: [
      { type: "log", title: "ANPR Read", detail: "Plate AB123XY captured by ANPR camera ANPR-07 (Corso Inghilterra) at 17:42:11, direction inbound to Porta Susa.", timestamp: "2026-04-12T17:42:11Z" },
    ],
    sourceTrace: [
      { source: "ANPR Network", type: "log", reference: "anpr_event AE-99812", detail: "plate AB123XY · cam ANPR-07 · confidence 0.96 · OCR raw 'AB123XY'", hash: "sha256:88ee…01ab", timestamp: "2026-04-12T17:42:11Z" },
    ],
  },

  // STEP 4 — Deckard video
  {
    id: "vvid", type: "video", label: "CCTV Feed #18", sublabel: "Porta Susa entrance",
    x: 110, y: 540, confidence: 0.94, delay: 5500, step: 4,
    evidence: [
      { type: "video", title: "Video Source", detail: "CCTV-18 station entrance, 4K, 6h continuous. Covers 17:00–23:00 window.", timestamp: "2026-04-12T17:00:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Camera CCTV-18", type: "video", reference: "video_id V-00018 / 6h @ 4K", detail: "ingested 2026-04-12T23:01:14Z, chain-of-custody verified", hash: "sha256:aa31…77bd" },
    ],
  },
  {
    id: "vvd", type: "video_detection", label: "Vehicle Detection", sublabel: "CCTV-18 · 17:44:02",
    x: 280, y: 540, confidence: 0.91, delay: 5800, step: 4,
    evidence: [
      { type: "video", title: "Vehicle Match", detail: "Deckard query \"FIAT Tipo plate AB123XY\" returned bbox [602,310,820,488] @ 17:44:02 with visual match score 0.91.", timestamp: "2026-04-12T17:44:02Z" },
      { type: "video", title: "Person Exiting Vehicle", detail: "0:04 after vehicle stop, an adult male exits driver side wearing a dark jacket.", timestamp: "2026-04-12T17:44:06Z" },
    ],
    sourceTrace: [
      { source: "Deckard — CCTV Feed #18", type: "video", reference: "frame 31204 @ 17:44:02", detail: "crop_id CR-91188 / vector_id VEC-77c12 / bbox [602,310,820,488]", hash: "sha256:9f2a…b71c" },
    ],
  },
  {
    id: "vpc", type: "person_candidate", label: "Driver candidate", sublabel: "PER-9921 · hypothesis",
    x: 460, y: 540, confidence: 0.78, delay: 6200, step: 4,
    evidence: [
      { type: "metadata", title: "Identity Hypothesis", detail: "Driver crop embedding NN against reference DB → top candidate matches owner Luca Bianchi at sim 0.78. Identity not confirmed.", timestamp: "2026-04-12T17:44:08Z" },
    ],
    sourceTrace: [
      { source: "Deckard VectorDB", type: "vector", reference: "embedding NN-search", detail: "candidate PER-9921 (≈ owner OWN-3392), similarity 0.78 — HYPOTHESIS", hash: "sha256:1c44…f902" },
    ],
  },

  // STEP 5 — OSINT
  {
    id: "vsoc", type: "social_profile", label: "@luca.b_torino", sublabel: "Instagram · public",
    x: 700, y: 410, confidence: 0.74, delay: 7300, step: 5,
    evidence: [
      { type: "metadata", title: "Public Profile", detail: "Public Instagram @luca.b_torino — 1,204 followers, 312 posts. Bio: 'Torino · auto · viaggi'.", timestamp: "2026-04-12T18:02:00Z" },
      { type: "video", title: "Vehicle Image Match", detail: "Post IG-44021 (2025-11-18) shows a FIAT Tipo with the same livery and a partially visible plate AB123. CLIP visual similarity 0.81.", timestamp: "2025-11-18T11:24:00Z" },
    ],
    sourceTrace: [
      { source: "OSINT — Instagram Scraper", type: "image", reference: "post_id IG-44021 / img_id IMG-3389", detail: "vehicle match, CLIP sim 0.81 vs detection crop CR-91188", hash: "sha256:b7e2…44a1" },
      { source: "Geo-tag Cluster", type: "log", reference: "geo_cluster GC-411 · Porta Susa ±400m", detail: "9 of 312 posts geo-tagged within 400m of Porta Susa", hash: "sha256:11df…aa20" },
      { source: "Hashtag Co-occurrence", type: "nlp", reference: "tag #torinodrive", detail: "shared event hashtag with 3 other PER-9921-linked accounts" },
    ],
  },
  {
    id: "vent", type: "entity", label: "Recurring location", sublabel: "Bar Centrale · Porta Susa",
    x: 880, y: 410, confidence: 0.7, delay: 7600, step: 5,
    evidence: [
      { type: "metadata", title: "Recurring Place", detail: "Entity 'Bar Centrale' extracted from 6 Instagram posts and 2 Facebook check-ins of the candidate.", timestamp: "2026-04-12T18:04:00Z" },
    ],
    sourceTrace: [
      { source: "Entity Extraction (Social)", type: "nlp", reference: "entity_id ENT-2210 · type=place", detail: "NER over 312 posts, 8 hits → 'Bar Centrale, Porta Susa'", hash: "sha256:22cd…99aa" },
    ],
  },

  // STEP 6 — Audio
  {
    id: "vvs", type: "voice_sample", label: "Voice Sample A-7714", sublabel: "from IG-44021 · 9s",
    x: 700, y: 540, confidence: 0.83, delay: 9100, step: 6,
    evidence: [
      { type: "metadata", title: "Audio Extraction", detail: "9s audio segment extracted from public Instagram video IG-44021. Subject speaks Italian with Piedmontese accent.", timestamp: "2025-11-18T11:24:14Z" },
    ],
    sourceTrace: [
      { source: "Audio Extractor", type: "audio", reference: "audio_id A-7714 @ 00:00:00–00:00:09", detail: "PCM 16kHz mono, SNR 16dB", hash: "sha256:cc92…aa15" },
    ],
  },
  {
    id: "vsp", type: "speaker", label: "Speaker SPK-211", sublabel: "AudioRAG cluster · 3 samples",
    x: 880, y: 540, confidence: 0.86, delay: 9400, step: 6,
    evidence: [
      { type: "metadata", title: "Speaker Cluster", detail: "AudioRAG clustered the OSINT sample with 2 intercepted calls into Speaker SPK-211 — intra-cluster sim ≥ 0.84.", timestamp: "2026-04-12T19:02:00Z" },
    ],
    sourceTrace: [
      { source: "AudioRAG", type: "audio", reference: "speaker_id SPK-211 / cluster size 3", detail: "voiceprint clustering, intra-cluster sim ≥ 0.84, source: A-7714 + A-00701 + A-00702", hash: "sha256:55de…1c09" },
    ],
  },

  // STEP 7 — Comms + transactions
  {
    id: "vcl", type: "communications_log", label: "CDR Batch", sublabel: "9 calls · 6h",
    x: 460, y: 410, confidence: 0.9, delay: 10900, step: 7,
    evidence: [
      { type: "log", title: "Call Detail Records", detail: "9 outgoing calls from +39 011 555 0418 in the 17:00–23:00 window, 4 of them within 500m of Porta Susa.", timestamp: "2026-04-12T17:18:00Z" },
    ],
    sourceTrace: [
      { source: "CDR / IPDR Logs", type: "log", reference: "cdr_batch CDR-2026-04-12 / lines 22014–22022", detail: "carrier export, 9 outgoing calls, 4 within geofence", hash: "sha256:08f1…44a2" },
    ],
  },
  {
    id: "vdev", type: "device", label: "+39 011 555 0418", sublabel: "device · MSISDN",
    x: 640, y: 150, confidence: 0.81, delay: 11200, step: 7,
    evidence: [
      { type: "log", title: "Device Attribution", detail: "Voiceprint of caller matches Speaker SPK-211 — sim 0.86. Subscriber: prepaid, no formal record.", timestamp: "2026-04-12T17:18:12Z" },
    ],
    sourceTrace: [
      { source: "AudioRAG", type: "audio", reference: "audio_id A-00701 @ 00:00:08", detail: "voiceprint match to SPK-211, sim 0.86", hash: "sha256:55de…1c09" },
    ],
  },
  {
    id: "vtx", type: "transaction_record", label: "€2,400 cash withdrawal", sublabel: "TX: TR-44821",
    x: 820, y: 150, confidence: 0.88, delay: 11600, step: 7,
    evidence: [
      { type: "transaction", title: "ATM Withdrawal", detail: "€2,400 withdrawn at ATM (Via Cernaia, 50m from Porta Susa) at 18:11 from card ending ***3392 — same owner as the vehicle.", timestamp: "2026-04-12T18:11:00Z" },
    ],
    sourceTrace: [
      { source: "Financial Records", type: "transaction", reference: "tx_id TR-44821 / ledger row 99201", detail: "card ***3392 → cash €2,400 · ATM near Porta Susa", hash: "sha256:31bb…e4f7" },
    ],
  },
];

// ----- Edges -----
export const vehicleDemoEdges: GraphEdge[] = [
  // STEP 1 wiring
  { id: "ve_c_ev",   source: "vc1",  target: "vev1", type: "partOfCase", label: "seed of",      confidence: 1.0,  status: "observed",  delay: 600,  step: 1,
    rationaleSummary: "Sighting report registered as the initial seed of the case.",
    rationale: ["Case CASE-2026-0412 opened by analyst ANL-021", "Report RPT-77129 attached as first artifact"] },
  { id: "ve_ev_veh", source: "vev1", target: "veh1", type: "derivedFrom", label: "describes",   confidence: 0.92, status: "observed",  delay: 1000, step: 1,
    rationaleSummary: "Vehicle descriptor extracted from the witness report.",
    rationale: ["Free-text descriptor 'FIAT Tipo, dark, AB123…'", "Operator OP-09 transcription"] },
  { id: "ve_veh_loc", source: "veh1", target: "vloc", type: "occurredAt", label: "spotted at",  confidence: 0.9,  status: "observed",  delay: 1300, step: 1,
    rationaleSummary: "Sighting geofenced inside Porta Susa perimeter.",
    rationale: ["Geofence GF-PS-001 (Porta Susa ±1km)", "Witness location matches station entrance"] },

  // STEP 2 — registry → owner
  { id: "ve_veh_reg", source: "veh1", target: "vreg", type: "derivedFrom", label: "registry lookup", confidence: 0.95, status: "observed", delay: 2100, step: 2,
    rationaleSummary: "Plate prefix AB123 + descriptor uniquely matches one registry record.",
    rationale: ["Single registry hit AB123XY for FIAT Tipo with prefix AB123", "MIT vehicle registry export"] },
  { id: "ve_reg_own", source: "vreg", target: "vown", type: "linkedToProfile", label: "registered to", confidence: 0.95, status: "observed", delay: 2500, step: 2,
    rationaleSummary: "Vehicle registry resolves owner identity.",
    rationale: ["Owner OWN-3392 (Luca Bianchi) holds plate AB123XY since 2019", "Direct structured-source attribution"] },

  // STEP 3 — ANPR
  { id: "ve_veh_anpr", source: "veh1", target: "vanpr", type: "occurredAt", label: "ANPR hit",   confidence: 0.96, status: "observed", delay: 3900, step: 3,
    rationaleSummary: "Plate captured by ANPR camera near Porta Susa during the seed window.",
    rationale: ["Plate AB123XY read by ANPR-07 at 17:42:11", "Direction inbound to Porta Susa", "Confidence 0.96"] },
  { id: "ve_anpr_loc", source: "vanpr", target: "vloc", type: "occurredAt", label: "near",       confidence: 0.99, status: "validated", delay: 4200, step: 3,
    rationaleSummary: "ANPR-07 is anchored to the Porta Susa perimeter.",
    rationale: ["ANPR-07 surveyed location", "Within geofence GF-PS-001"] },

  // STEP 4 — Deckard
  { id: "ve_vid_vd",  source: "vvid", target: "vvd",  type: "appearsInVideo", label: "produced detection", confidence: 0.91, status: "observed", delay: 5900, step: 4,
    rationaleSummary: "Top match for Deckard vehicle query in CCTV-18.",
    rationale: ["Frame 31204 @ 17:44:02", "Visual match score 0.91 vs query 'FIAT Tipo AB123XY'"] },
  { id: "ve_veh_vd",  source: "veh1", target: "vvd",  type: "appearsInVideo", label: "matched in",        confidence: 0.91, status: "observed", delay: 6100, step: 4,
    rationaleSummary: "Detected vehicle matches the seed vehicle by plate + appearance.",
    rationale: ["Plate AB123XY readable in detection crop", "Body shape consistent with FIAT Tipo"] },
  { id: "ve_vd_pc",   source: "vvd",  target: "vpc",  type: "linkedToProfile", label: "person exiting",   confidence: 0.78, status: "inferred", inferred: true, delay: 6400, step: 4,
    rationaleSummary: "Person observed exiting driver side; tentative identity match to owner.",
    rationale: ["Adult male exits driver side at 17:44:06", "Crop NN sim 0.78 vs reference of OWN-3392", "Not enough to validate identity"] },
  { id: "ve_pc_own",  source: "vpc",  target: "vown", type: "linkedToProfile", label: "candidate ≈ owner", confidence: 0.78, status: "hypothesis", delay: 6700, step: 4,
    rationaleSummary: "Driver candidate may be the registered owner — pending validation.",
    rationale: ["Visual similarity 0.78 (below VALIDATED threshold)", "Driver of owner-registered vehicle is a prior", "Identity not confirmed"] },

  // STEP 5 — OSINT
  { id: "ve_pc_soc",  source: "vpc",  target: "vsoc", type: "linkedToProfile", label: "linked to profile", confidence: 0.74, status: "hypothesis", inferred: true, delay: 7500, step: 5,
    rationaleSummary: "Multiple weak signals link the driver candidate to public Instagram @luca.b_torino. Identity not confirmed.",
    rationale: [
      "Same FIAT Tipo with partial plate AB123 visible in IG-44021 (CLIP sim 0.81)",
      "9 of 312 posts geo-tagged within 400m of Porta Susa",
      "Shared event hashtag #torinodrive with 3 other PER-9921-linked accounts",
      "Analyst validation pending",
    ] },
  { id: "ve_soc_ent", source: "vsoc", target: "vent", type: "derivedFrom", label: "mentions place",       confidence: 0.7,  status: "inferred", inferred: true, delay: 7800, step: 5,
    rationaleSummary: "Recurring location entity extracted via NER.",
    rationale: ["8 NER hits for 'Bar Centrale' across posts/check-ins", "Located within Porta Susa perimeter"] },

  // STEP 6 — Audio
  { id: "ve_soc_vs",  source: "vsoc", target: "vvs",  type: "containsVoice", label: "contains voice",     confidence: 0.83, status: "observed", delay: 9200, step: 6,
    rationaleSummary: "9s audio extracted from public Instagram video.",
    rationale: ["Source post IG-44021 contains in-frame speech", "16kHz mono, SNR 16dB"] },
  { id: "ve_vs_sp",   source: "vvs",  target: "vsp",  type: "matchesSpeaker", label: "matches speaker",   confidence: 0.86, status: "inferred", inferred: true, delay: 9500, step: 6,
    rationaleSummary: "AudioRAG clusters voice sample with intercepted calls.",
    rationale: ["Voiceprint A-7714 vs centroid SPK-211, sim 0.86", "Cluster size 3 (OSINT + 2 CDR)"] },
  { id: "ve_sp_pc",   source: "vsp",  target: "vpc",  type: "linkedToProfile", label: "candidate speaker", confidence: 0.8,  status: "hypothesis", inferred: true, delay: 9800, step: 6,
    rationaleSummary: "Speaker cluster tentatively attributed to driver candidate.",
    rationale: [
      "Voice sample originates from profile linked to PER-9921",
      "Other cluster members are calls from device co-located with detection",
      "Identity attribution remains a HYPOTHESIS",
    ] },

  // STEP 7 — Comms + transactions
  { id: "ve_cl_dev",  source: "vcl",  target: "vdev", type: "called", label: "originates from",           confidence: 0.99, status: "observed", delay: 11000, step: 7,
    rationaleSummary: "All CDR rows originate from this MSISDN.",
    rationale: ["MSISDN +39 011 555 0418 present on all 9 CDRs"] },
  { id: "ve_dev_sp",  source: "vdev", target: "vsp",  type: "matchesSpeaker", label: "voiceprint",        confidence: 0.86, status: "inferred", inferred: true, delay: 11300, step: 7,
    rationaleSummary: "Caller voiceprint matches Speaker SPK-211.",
    rationale: ["AudioRAG sim 0.86 vs SPK-211", "2 intercepted calls contributed to the cluster"] },
  { id: "ve_cl_loc",  source: "vcl",  target: "vloc", type: "occurredAt", label: "near station",          confidence: 0.9,  status: "observed", delay: 11500, step: 7,
    rationaleSummary: "4 of the 9 calls geolocate within Porta Susa perimeter.",
    rationale: ["Cell-tower triangulation places 4 calls within 500m", "Window matches the seed time range"] },
  { id: "ve_own_tx",  source: "vown", target: "vtx",  type: "sentMoneyTo", label: "card activity",        confidence: 0.88, status: "observed", delay: 11800, step: 7,
    rationaleSummary: "ATM withdrawal from card belonging to the registered owner.",
    rationale: ["Card ***3392 → owner OWN-3392", "€2,400 cash at 18:11"] },
  { id: "ve_tx_loc",  source: "vtx",  target: "vloc", type: "occurredAt", label: "at",                    confidence: 0.95, status: "observed", delay: 12000, step: 7,
    rationaleSummary: "ATM is 50m from Porta Susa, inside the geofence.",
    rationale: ["ATM Via Cernaia surveyed location", "Within geofence GF-PS-001"] },
];

// ----- Agent log (vehicle scenario) -----
export const vehicleAgentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[] = [
  { message: "Case CASE-2026-0412 opened — suspicious vehicle near Porta Susa", delay: 0, level: "info" },
  { message: "Seed: FIAT Tipo, partial plate AB123, 12 Apr 2026 17:00–20:00", delay: 600, level: "info" },
  { message: "Querying vehicle registry for prefix AB123 + FIAT Tipo...", delay: 1900, level: "info" },
  { message: "Registry MATCH: plate AB123XY → owner Luca Bianchi (OWN-3392)", delay: 2400, level: "success" },
  { message: "ANPR network scan in seed window...", delay: 3700, level: "info" },
  { message: "ANPR HIT: AB123XY captured by ANPR-07 at 17:42:11 (inbound)", delay: 4000, level: "success" },
  { message: "Deckard query: 'FIAT Tipo plate AB123XY' across station feeds", delay: 5500, level: "info" },
  { message: "MATCH: vehicle in CCTV-18 @ 17:44:02 — visual score 0.91", delay: 5900, level: "success" },
  { message: "Person exits driver side — candidate sim 0.78 vs OWN-3392 — HYPOTHESIS", delay: 6500, level: "warning" },
  { message: "OSINT match: public Instagram @luca.b_torino — vehicle + geo + tags", delay: 7400, level: "warning" },
  { message: "NER: recurring entity 'Bar Centrale' extracted from 8 posts", delay: 7800, level: "info" },
  { message: "Extracting 9s voice sample A-7714 from public post IG-44021", delay: 9200, level: "info" },
  { message: "AudioRAG: voice sample joins speaker cluster SPK-211 (3 samples)", delay: 9500, level: "success" },
  { message: "CDR batch: 9 calls from +39 011 555 0418 in 6h, 4 within geofence", delay: 11000, level: "info" },
  { message: "Voiceprint of MSISDN matches SPK-211 — sim 0.86", delay: 11300, level: "warning" },
  { message: "ALERT: €2,400 ATM withdrawal from card ***3392 (50m from station)", delay: 11800, level: "warning" },
  { message: "Awaiting analyst review — 4 hypothesis links pending validation", delay: 12700, level: "info" },
  { message: "Investigation graph complete — 14 entities, 21 relationships", delay: 13800, level: "success" },
];

// ----- Reasoning chain (vehicle scenario) -----
export const vehicleReasoningSteps = [
  { step: 1, title: "Vehicle Seed", detail: "Sighting report opens case CASE-2026-0412: suspicious FIAT Tipo, partial plate AB123, near Porta Susa, 17:00–20:00.", confidence: 0.92 },
  { step: 2, title: "Registry → Owner", detail: "Plate prefix + descriptor uniquely match plate AB123XY in MIT registry, registered to Luca Bianchi (OWN-3392).", confidence: 0.95 },
  { step: 3, title: "ANPR Confirmation", detail: "ANPR-07 captures plate AB123XY at 17:42:11 inbound to Porta Susa — independent structured confirmation of presence.", confidence: 0.96 },
  { step: 4, title: "Deckard Visual Match", detail: "CCTV-18 shows the vehicle at 17:44:02 (sim 0.91) and a male exits driver side. Driver candidate ≈ owner with sim 0.78 — HYPOTHESIS.", confidence: 0.78 },
  { step: 5, title: "OSINT Profile", detail: "Public Instagram @luca.b_torino surfaces via vehicle image match (CLIP 0.81), geo-cluster around Porta Susa, and shared event hashtag.", confidence: 0.74 },
  { step: 6, title: "AudioRAG Speaker Cluster", detail: "AudioRAG clusters a 9s OSINT voice sample with 2 intercepted calls into Speaker SPK-211.", confidence: 0.86 },
  { step: 7, title: "Comms & Financial Context", detail: "MSISDN +39 011 555 0418 voiceprint matches SPK-211; €2,400 ATM withdrawal from owner's card 50m from the station within seed window.", confidence: 0.88 },
  { step: 8, title: "Analyst Validation", detail: "4 HYPOTHESIS links (driver≈owner, candidate↔social, speaker↔candidate, person-exiting) remain pending analyst validation.", confidence: 0.80 },
];

// ----- Timeline -----
export const vehicleTimelineEvents = [
  { time: "2026-04-12 17:05", event: "Sighting reported — FIAT Tipo near Porta Susa", entity: "vev1" },
  { time: "2026-04-12 17:09", event: "Registry resolves plate AB123XY → Luca Bianchi", entity: "vown" },
  { time: "2026-04-12 17:42", event: "ANPR-07 captures plate AB123XY inbound", entity: "vanpr" },
  { time: "2026-04-12 17:44", event: "Deckard match in CCTV-18 — driver exits vehicle", entity: "vvd" },
  { time: "2026-04-12 18:02", event: "OSINT match: @luca.b_torino (Instagram)", entity: "vsoc" },
  { time: "2026-04-12 18:11", event: "€2,400 ATM withdrawal near station", entity: "vtx" },
  { time: "2026-04-12 19:02", event: "AudioRAG cluster SPK-211 formed (3 samples)", entity: "vsp" },
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
  defaultHighlightChain: ["veh1", "vown", "vpc", "vsoc"],
};

export function getScenario(mode: SeedMode): Scenario {
  return mode === "vehicle" ? vehicleScenario : visualScenario;
}

