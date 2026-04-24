export type NodeType = "person" | "video" | "transaction" | "device" | "location" | "social";
export type EdgeType = "appearsInVideo" | "called" | "sentMoneyTo" | "locatedAt" | "connectedTo" | "linkedToProfile";
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
  /** Short human-readable summary shown in the link inspector. */
  rationaleSummary?: string;
  /** Bullet-list reasons why this link exists (for explainability). */
  rationale?: string[];
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
  {
    id: "s1", type: "social", label: "@mario.r_88", sublabel: "Instagram · public",
    x: 560, y: 470, confidence: 0.71, delay: 4400,
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
];

export const demoEdges: GraphEdge[] = [
  {
    id: "e1", source: "p1", target: "v1", type: "appearsInVideo", label: "matched in",
    confidence: 0.93, status: "observed", inferred: false, delay: 1000,
    rationaleSummary: "Direct visual match returned by Deckard semantic search.",
    rationale: [
      "Top-1 crop returned for query \"man wearing a red sweatshirt\"",
      "Visual match score 0.93 against CCTV Feed #12 frame 4123",
      "Bounding box [412,188,540,402] @ 02:14:33 UTC",
      "Chain-of-custody verified on source video",
    ],
  },
  {
    id: "e2", source: "p1", target: "l1", type: "locatedAt", label: "located at",
    confidence: 0.99, status: "validated", inferred: false, delay: 1400,
    rationaleSummary: "Camera geo-registry resolves CCTV Feed #12 to a fixed surveyed location.",
    rationale: [
      "CCTV Feed #12 is anchored to a surveyed fixed camera",
      "Geo-registry coordinates 45.0921°N, 7.6700°E (Aurora, Torino)",
      "Validated by camera metadata cam_meta CCTV-12",
    ],
  },
  {
    id: "e3", source: "p1", target: "d1", type: "connectedTo", label: "uses device",
    confidence: 0.82, status: "hypothesis", inferred: false, delay: 2000,
    rationaleSummary: "Voiceprint similarity + co-located CDR activity. Identity not confirmed.",
    rationale: [
      "Burner phone active near Aurora at the crop timestamp window",
      "AudioRAG voiceprint A-00882 matches PER-4821 with similarity 0.88",
      "14 outgoing calls in 72h to a single counterpart — operational pattern",
      "No subscriber record — attribution remains a hypothesis",
    ],
  },
  {
    id: "e4", source: "p1", target: "v2", type: "appearsInVideo", label: "detected in",
    confidence: 0.89, status: "inferred", inferred: true, delay: 2800,
    rationaleSummary: "Same crop embedding re-identified across feeds.",
    rationale: [
      "Embedding nearest-neighbor search across 847 feeds",
      "Re-identification in CCTV Feed #47 (Centro Torino) — sim 0.89",
      "Time delta consistent with on-foot transit Aurora → Centro",
    ],
  },
  {
    id: "e5", source: "p1", target: "t1", type: "sentMoneyTo", label: "sent $47.2K",
    confidence: 0.91, status: "observed", inferred: false, delay: 3600,
    rationaleSummary: "Wire transfer originated from account linked to PER-4821.",
    rationale: [
      "Source account ***4821 resolves to candidate PER-4821",
      "Wire amount $47,200, ledger row 88213",
      "AML rule R-17 raised structuring flag",
    ],
  },
  {
    id: "e6", source: "t1", target: "p2", type: "sentMoneyTo", label: "received by",
    confidence: 0.91, status: "observed", inferred: false, delay: 4200,
    rationaleSummary: "Recipient account holder resolved via financial records.",
    rationale: [
      "Recipient account ***7293 mapped to PER-7293 (Elena Vasquez)",
      "Confirmed by ledger row 88213 / tx 0x4f8a…c3d1",
    ],
  },
  {
    id: "e7", source: "p2", target: "v2", type: "appearsInVideo", label: "detected in",
    confidence: 0.74, status: "hypothesis", inferred: true, delay: 4600,
    rationaleSummary: "Visual similarity to a reference crop — pending analyst validation.",
    rationale: [
      "Crop CR-91188 in CCTV Feed #47 @ 09:47:11 UTC",
      "Embedding similarity 0.74 vs PER-7293 reference",
      "Below 0.80 threshold — flagged as hypothesis",
    ],
  },
  {
    id: "e8", source: "p1", target: "s1", type: "linkedToProfile", label: "linked to profile",
    confidence: 0.71, status: "hypothesis", inferred: true, delay: 5000,
    rationaleSummary: "Multiple weak signals link PER-4821 to public Instagram @mario.r_88. Identity not confirmed.",
    rationale: [
      "Same red sweatshirt visible in public Instagram post IG-77123 (CLIP sim 0.84)",
      "5 of 87 posts geo-tagged within 300m of Torino Porta Susa — same location pattern",
      "Shared event hashtag #aurora_torino_night with 2 other PER-4821-linked accounts",
      "Analyst validation pending",
    ],
  },
];

export const agentLogs: { message: string; delay: number; level: "info" | "warning" | "success" }[] = [
  { message: "Initializing investigation from semantic seed...", delay: 0, level: "info" },
  { message: "Deckard query: \"man wearing a red sweatshirt\" → searching 847 feeds", delay: 400, level: "info" },
  { message: "MATCH: top-1 crop in CCTV Feed #12 — visual score 0.93", delay: 800, level: "success" },
  { message: "Geolocating source feed → Aurora, Torino (45.0921°N, 7.6700°E)", delay: 1200, level: "info" },
  { message: "Embedding NN-search → candidate identity Mario Rossi (PER-4821) sim 0.86 — HYPOTHESIS", delay: 1500, level: "warning" },
  { message: "Scanning CDR records for devices co-located with crop timestamp...", delay: 1900, level: "info" },
  { message: "Burner phone +39 011 555 0147 linked — 14 calls in 72h window", delay: 2200, level: "warning" },
  { message: "Cross-referencing crop embedding across 847 video feeds...", delay: 2600, level: "info" },
  { message: "MATCH: same subject re-identified in CCTV Feed #47 (Centro, Torino) — sim 0.89", delay: 3000, level: "success" },
  { message: "Correlating transaction 0x4f8a...c3d1 with account ***4821", delay: 3400, level: "info" },
  { message: "ALERT: $47,200 wire transfer flagged — structuring pattern detected", delay: 3800, level: "warning" },
  { message: "Recipient identified: Elena Vasquez (PER-7293) — Inferred link", delay: 4200, level: "success" },
  { message: "ALERT: Elena Vasquez detected in Centro Torino at 09:47 UTC — co-location confirmed", delay: 4800, level: "warning" },
  { message: "Investigation graph complete — 7 entities, 7 relationships identified", delay: 5400, level: "success" },
];

export const timelineEvents = [
  { time: "2024-03-13 18:22", event: "First burner phone call detected", entity: "d1" },
  { time: "2024-03-14 02:14", event: "Deckard match — \"man with red sweatshirt\" in CCTV Feed #12", entity: "p1" },
  { time: "2024-03-14 06:33", event: "$47,200 wire transfer initiated", entity: "t1" },
  { time: "2024-03-14 08:00", event: "CCTV Feed #47 recording begins", entity: "v2" },
  { time: "2024-03-14 09:47", event: "Elena Vasquez detected in Centro Torino", entity: "p2" },
];

export const reasoningSteps = [
  { step: 1, title: "Semantic Seed Query", detail: "Analyst submitted Deckard query \"man wearing a red sweatshirt\". Bimodal text→image search returned top crop in CCTV Feed #12 with visual match score 0.93.", confidence: 0.93 },
  { step: 2, title: "Visual Semantic Match", detail: "Visual semantic match: subject wearing red sweatshirt detected across multiple cameras. Identity not confirmed.", confidence: 0.86 },
  { step: 3, title: "Device Association", detail: "CDR analysis surfaces burner phone +39 011 555 0147 active near the crop timestamp and location. 14 outgoing calls to a single number in 72h suggests operational comms.", confidence: 0.82 },
  { step: 4, title: "Cross-Feed Re-identification", detail: "Same crop embedding re-identified in CCTV Feed #47 (Centro Torino) 7 hours later, sim 0.89. Movement pattern suggests deliberate transit.", confidence: 0.89 },
  { step: 5, title: "Financial Link Discovered", detail: "Wire transfer of $47,200 from account linked to PER-4821 → ***7293. Structuring characteristics — split amounts below reporting threshold.", confidence: 0.91 },
  { step: 6, title: "Second Subject Inferred", detail: "Recipient ***7293 resolves to Elena Vasquez (PER-7293), subsequently detected in CCTV Feed #47 at 09:47 UTC — 3h after the candidate's presence at the same location. INFERRED: coordination.", confidence: 0.74 },
];
