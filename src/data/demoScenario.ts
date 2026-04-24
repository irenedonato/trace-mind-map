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
  | "location"
  // legacy aliases — kept for backwards compatibility with existing demo data
  | "person"
  | "device"
  | "social";

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
}

export const demoSteps: DemoStep[] = [
  { step: 1, startMs:     0, title: "Seed received",                 subtitle: "Analyst submits semantic query + filters" },
  { step: 2, startMs:  1800, title: "Deckard searches station video",subtitle: "Bimodal text→image search across 847 feeds" },
  { step: 3, startMs:  3600, title: "Subject detected across cameras", subtitle: "Same crop re-identified in multiple feeds" },
  { step: 4, startMs:  5400, title: "OSINT profile candidate found", subtitle: "Public Instagram match — garment + geo + tags" },
  { step: 5, startMs:  7200, title: "Public video contains voice sample", subtitle: "Audio segment extracted from social media post" },
  { step: 6, startMs:  9000, title: "AudioRAG creates speaker cluster", subtitle: "Voiceprint clustered across calls + public audio" },
  { step: 7, startMs: 10800, title: "Logs and transaction records add context", subtitle: "CDR + financial records correlated to subject" },
  { step: 8, startMs: 12600, title: "Analyst validates / rejects hypotheses", subtitle: "Hypothesis links promoted to VALIDATED or rejected" },
];

export const demoTotalMs = 14400;

// =====================================================================
// NODES
// =====================================================================
export const demoNodes: GraphNode[] = [
  // ---- STEP 1 — Seed received ----
  {
    id: "c1", type: "case", label: "CASE-2024-0314", sublabel: "Torino · Porta Susa",
    x: 120, y: 80, confidence: 1.0, delay: 0, step: 1,
    evidence: [
      { type: "metadata", title: "Case Opened", detail: "Investigation case opened by analyst on duty. Scope: 72h lookback, area Torino Porta Susa.", timestamp: "2024-03-14T02:14:00Z" },
    ],
    sourceTrace: [
      { source: "Case Management", type: "log", reference: "case_id CASE-2024-0314", detail: "manual case creation by analyst id ANL-014", hash: "sha256:7711…ee01", timestamp: "2024-03-14T02:14:00Z" },
    ],
  },
  {
    id: "ev1", type: "event", label: "Semantic Seed", sublabel: "\"man in red sweatshirt\"",
    x: 280, y: 80, confidence: 1.0, delay: 400, step: 1,
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
