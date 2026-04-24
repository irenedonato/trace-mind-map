export type NodeType = "person" | "video" | "transaction" | "device" | "location";
export type EdgeType = "appearsInVideo" | "called" | "sentMoneyTo" | "locatedAt" | "connectedTo";
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
  delay: number;
}

export interface Evidence {
  type: "video" | "log" | "transaction" | "metadata";
  title: string;
  detail: string;
  timestamp: string;
}

export interface SourceTraceItem {
  source: string; // e.g. "Deckard — CCTV Feed #12"
  type: "video" | "audio" | "log" | "transaction" | "image" | "vector" | "nlp";
  reference: string; // e.g. "frame 4123 @ 02:34", "audio_id A-882", "log line 14"
  detail?: string;
  hash?: string; // integrity hash for auditability
  timestamp?: string;
}

export const demoNodes: GraphNode[] = [
  {
    id: "p1", type: "person", label: "Mario Rossi", sublabel: "candidate · PER-4821",
    x: 400, y: 300, confidence: 0.86, delay: 0,
    evidence: [
      { type: "metadata", title: "Semantic Query (Deckard)", detail: "Query: \"man wearing a red sweatshirt\" — bimodal text→image search across 847 feeds", timestamp: "2024-03-14T02:14:30Z" },
      { type: "video", title: "CCTV Feed #12 — Aurora (Torino)", detail: "Top-1 crop returned by Deckard at 02:14:33 UTC, visual match score 0.93", timestamp: "2024-03-14T02:14:33Z" },
      { type: "metadata", title: "Identity Hypothesis", detail: "Crop embedding nearest-neighbor against reference DB → candidate 'Mario Rossi' (PER-4821), similarity 0.86 — pending analyst validation", timestamp: "2024-03-14T02:14:35Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Semantic Query", type: "nlp", reference: "query_id Q-55812 · \"man wearing a red sweatshirt\"", detail: "bimodal text→image search, 847 feeds, top-K=20, visual reasoning: red upper garment + male presenting", hash: "sha256:3d12…a90f", timestamp: "2024-03-14T02:14:30Z" },
      { source: "Deckard — CCTV Feed #12", type: "video", reference: "frame 4123 @ 02:14:33", detail: "crop_id CR-88421 / vector_id VEC-22a91 / bbox [412,188,540,402] · query match 0.93", hash: "sha256:9f2a…b71c", timestamp: "2024-03-14T02:14:33Z" },
      { source: "Deckard VectorDB", type: "vector", reference: "embedding NN-search vs reference crops", detail: "candidate identity PER-4821 (Mario Rossi), similarity 0.86 — HYPOTHESIS, awaiting analyst validation", hash: "sha256:1c44…f902" },
    ],
  },
  {
    id: "v1", type: "video", label: "CCTV Feed #12", sublabel: "Aurora — Torino",
    x: 200, y: 180, confidence: 0.95, delay: 800,
    evidence: [
      { type: "video", title: "Video Source", detail: "Duration: 4h 22m, Resolution: 4K, Location: 45.0921°N, 7.6700°E (Aurora, Torino)", timestamp: "2024-03-14T00:00:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Camera CCTV-12", type: "video", reference: "video_id V-00012 / 4h22m @ 4K", detail: "ingested 2024-03-14T00:02:11Z, chain-of-custody verified", hash: "sha256:aa31…77bd", timestamp: "2024-03-14T00:00:00Z" },
    ],
  },
  {
    id: "v2", type: "video", label: "CCTV Feed #47", sublabel: "Centro / San Carlo — Torino",
    x: 650, y: 140, confidence: 0.89, delay: 2400,
    evidence: [
      { type: "video", title: "Video Source", detail: "Duration: 8h 15m, Resolution: 1080p, Location: 45.0686°N, 7.6830°E (Centro, Torino)", timestamp: "2024-03-14T08:00:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — Camera CCTV-47", type: "video", reference: "video_id V-00047 / 8h15m @ 1080p", detail: "ingested 2024-03-14T08:01:44Z", hash: "sha256:42c0…91ee", timestamp: "2024-03-14T08:00:00Z" },
    ],
  },
  {
    id: "d1", type: "device", label: "+39 011 555 0147", sublabel: "Burner Phone",
    x: 180, y: 440, confidence: 0.82, delay: 1600,
    evidence: [
      { type: "log", title: "Call Log Intercept", detail: "14 calls to +39 011 555 0283 in 72h window. Average duration: 47s", timestamp: "2024-03-13T18:22:00Z" },
    ],
    sourceTrace: [
      { source: "CDR / IPDR Logs", type: "log", reference: "cdr_batch CDR-2024-03-13 / lines 14882–14895", detail: "carrier export, 14 outgoing calls, avg 47s", hash: "sha256:08f1…44a2", timestamp: "2024-03-13T18:22:00Z" },
      { source: "AudioRAG", type: "audio", reference: "audio_id A-00882 @ 00:00:12", detail: "voiceprint match to PER-4821, similarity 0.88", hash: "sha256:55de…1c09" },
    ],
  },
  {
    id: "t1", type: "transaction", label: "$47,200 Transfer", sublabel: "TX: 0x4f8a...c3d1",
    x: 450, y: 520, confidence: 0.91, delay: 3200,
    evidence: [
      { type: "transaction", title: "Wire Transfer Record", detail: "From: Acct ***4821 → Acct ***7293. Flagged: structuring pattern detected", timestamp: "2024-03-14T06:33:12Z" },
    ],
    sourceTrace: [
      { source: "Financial Records", type: "transaction", reference: "tx_id 0x4f8a…c3d1 / ledger row 88213", detail: "wire transfer, amount $47,200, structuring flag raised by AML rule R-17", hash: "sha256:31bb…e4f7", timestamp: "2024-03-14T06:33:12Z" },
      { source: "AML Engine", type: "nlp", reference: "rule R-17 / case AML-99021", detail: "pattern: 4 sub-threshold transfers in 18h window" },
    ],
  },
  {
    id: "p2", type: "person", label: "Elena Vasquez", sublabel: "ID: PER-7293",
    x: 700, y: 380, confidence: 0.74, delay: 4000,
    evidence: [
      { type: "video", title: "CCTV Feed #47 — Centro / San Carlo (Torino)", detail: "Subject detected at 09:47:11 UTC, confidence 74%", timestamp: "2024-03-14T09:47:11Z" },
      { type: "metadata", title: "Inferred Association", detail: "Linked via financial transaction and overlapping location data", timestamp: "2024-03-14T09:50:00Z" },
    ],
    sourceTrace: [
      { source: "Deckard — CCTV Feed #47", type: "video", reference: "frame 14021 @ 09:47:11", detail: "crop_id CR-91188 / vector_id VEC-44f02 / bbox [188,210,322,468]", hash: "sha256:6a09…b218", timestamp: "2024-03-14T09:47:11Z" },
      { source: "Financial Records", type: "transaction", reference: "tx_id 0x4f8a…c3d1 / recipient acct ***7293", detail: "account holder resolved → PER-7293", hash: "sha256:31bb…e4f7" },
      { source: "Entity Extraction (Social)", type: "nlp", reference: "post_id SM-77123", detail: "alias 'E.V.' co-occurring with PER-4821 in 3 posts" },
    ],
  },
  {
    id: "l1", type: "location", label: "45.0921°N 7.6700°E", sublabel: "Aurora — Torino",
    x: 100, y: 300, confidence: 0.99, delay: 1200,
    sourceTrace: [
      { source: "Camera Geo-registry", type: "log", reference: "cam_meta CCTV-12", detail: "fixed geolocation 45.0921°N, 7.6700°E — Aurora, Torino (surveyed)", hash: "sha256:ce71…0042" },
    ],
  },
];

export const demoEdges: GraphEdge[] = [
  { id: "e1", source: "p1", target: "v1", type: "appearsInVideo", label: "matched in", confidence: 0.93, status: "observed", inferred: false, delay: 1000 },
  { id: "e2", source: "p1", target: "l1", type: "locatedAt", label: "located at", confidence: 0.99, status: "validated", inferred: false, delay: 1400 },
  { id: "e3", source: "p1", target: "d1", type: "connectedTo", label: "uses device", confidence: 0.82, status: "hypothesis", inferred: false, delay: 2000 },
  { id: "e4", source: "p1", target: "v2", type: "appearsInVideo", label: "detected in", confidence: 0.89, status: "inferred", inferred: true, delay: 2800 },
  { id: "e5", source: "p1", target: "t1", type: "sentMoneyTo", label: "sent $47.2K", confidence: 0.91, status: "observed", inferred: false, delay: 3600 },
  { id: "e6", source: "t1", target: "p2", type: "sentMoneyTo", label: "received by", confidence: 0.91, status: "observed", inferred: false, delay: 4200 },
  { id: "e7", source: "p2", target: "v2", type: "appearsInVideo", label: "detected in", confidence: 0.74, status: "hypothesis", inferred: true, delay: 4600 },
];

export const agentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[] = [
  { message: "Initializing investigation from video seed...", delay: 0, level: "info" },
  { message: "Running facial recognition on CCTV Feed #12", delay: 400, level: "info" },
  { message: "MATCH: Subject identified as Marcus Chen (PER-4821) — Confidence: 97%", delay: 800, level: "success" },
  { message: "Geolocating source feed → Aurora, Torino (45.0921°N, 7.6700°E)", delay: 1200, level: "info" },
  { message: "Scanning CDR records for associated devices...", delay: 1600, level: "info" },
  { message: "Burner phone +39 011 555 0147 linked — 14 calls in 72h window", delay: 2000, level: "warning" },
  { message: "Cross-referencing subject across 847 video feeds...", delay: 2400, level: "info" },
  { message: "MATCH: Subject detected in CCTV Feed #47 (Centro, Torino) — Confidence: 89%", delay: 2800, level: "success" },
  { message: "Correlating transaction 0x4f8a...c3d1 with account ***4821", delay: 3200, level: "info" },
  { message: "ALERT: $47,200 wire transfer flagged — structuring pattern detected", delay: 3600, level: "warning" },
  { message: "Recipient identified: Elena Vasquez (PER-7293) — Inferred link", delay: 4000, level: "success" },
  { message: "ALERT: Elena Vasquez detected in Centro Torino at 09:47 UTC — co-location confirmed", delay: 4600, level: "warning" },
  { message: "Investigation graph complete — 7 entities, 7 relationships identified", delay: 5200, level: "success" },
];

export const timelineEvents = [
  { time: "2024-03-13 18:22", event: "First burner phone call detected", entity: "d1" },
  { time: "2024-03-14 02:14", event: "Marcus Chen detected in CCTV Feed #12", entity: "p1" },
  { time: "2024-03-14 06:33", event: "$47,200 wire transfer initiated", entity: "t1" },
  { time: "2024-03-14 08:00", event: "CCTV Feed #47 recording begins", entity: "v2" },
  { time: "2024-03-14 09:47", event: "Elena Vasquez detected in Centro Torino", entity: "p2" },
];

export const reasoningSteps = [
  { step: 1, title: "Seed Entity Identified", detail: "Facial recognition matched subject in CCTV Feed #12 with 97% confidence. Subject identified as Marcus Chen (PER-4821) from national database.", confidence: 0.97 },
  { step: 2, title: "Device Association", detail: "CDR analysis reveals burner phone +39 011 555 0147 associated with subject. 14 outgoing calls to a single number within 72-hour window suggests operational communication pattern.", confidence: 0.82 },
  { step: 3, title: "Cross-Feed Detection", detail: "Subject re-identified in CCTV Feed #47 (Centro Torino) 7 hours after initial detection. Movement pattern suggests deliberate transit between locations.", confidence: 0.89 },
  { step: 4, title: "Financial Link Discovered", detail: "Wire transfer of $47,200 from account linked to PER-4821 to account ***7293. Transaction exhibits structuring characteristics — split amounts below reporting threshold.", confidence: 0.91 },
  { step: 5, title: "Second Subject Inferred", detail: "Recipient account ***7293 linked to Elena Vasquez (PER-7293). Subject subsequently detected in CCTV Feed #47 at 09:47 UTC — 3 hours after Marcus Chen's presence at same location. INFERRED: Coordination between subjects.", confidence: 0.74 },
];
