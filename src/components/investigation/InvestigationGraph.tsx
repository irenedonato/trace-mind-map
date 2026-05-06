import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Video, Banknote, Smartphone, MapPin, AtSign,
  Briefcase, Calendar, UserSearch, ScanFace, Crop, FileText, Tag, Mic, Volume2, MessageSquare,
  Car, ClipboardList, IdCard, Fingerprint, FileSearch, Camera, Headphones, Image as ImageIcon,
} from "lucide-react";
import { type GraphNode, type GraphEdge, type EdgeStatus, type NodeType, type Scenario } from "@/data/demoScenario";


interface InvestigationGraphProps {
  isRunning: boolean;
  onNodeClick: (nodeId: string) => void;
  selectedNode: string | null;
  highlightPath: string[];
  onEdgeClick: (edgeId: string) => void;
  selectedEdge: string | null;
  scenario: Scenario;
}

const nodeIcons: Record<NodeType, typeof User> = {
  case: Briefcase,
  event: Calendar,
  person_candidate: UserSearch,
  video: Video,
  video_detection: ScanFace,
  crop: Crop,
  social_profile: AtSign,
  document: FileText,
  entity: Tag,
  voice_sample: Mic,
  speaker: Volume2,
  communications_log: MessageSquare,
  transaction: Banknote,
  transaction_record: Banknote,
  location: MapPin,
  vehicle: Car,
  vehicle_registration: ClipboardList,
  owner: IdCard,
  evidence: FileSearch,
  video_evidence: Camera,
  audio_evidence: Headphones,
  image_evidence: ImageIcon,
  person: User,
  device: Smartphone,
  social: AtSign,
};

// Color semantics:
// YELLOW  → Visual evidence (video / CCTV / images)
// BLUE    → Physical entities (vehicles, locations, devices, events)
// PURPLE  → People / identities / correlations / inferences
// ORANGE  → Financial activity
// GREY    → Telecom / metadata signals
const COLOR = {
  yellow: "hsl(48, 96%, 60%)",
  blue:   "hsl(212, 90%, 60%)",
  purple: "hsl(280, 70%, 65%)",
  orange: "hsl(20, 90%, 58%)",
  grey:   "hsl(220, 10%, 60%)",
};

const nodeColors: Record<NodeType, string> = {
  // visual evidence
  video: COLOR.yellow,
  video_detection: COLOR.yellow,
  crop: COLOR.yellow,
  video_evidence: COLOR.yellow,
  image_evidence: COLOR.yellow,
  evidence: COLOR.yellow,
  // physical entities + events
  vehicle: COLOR.blue,
  vehicle_registration: COLOR.blue,
  location: COLOR.blue,
  device: COLOR.blue,
  event: COLOR.blue,
  // people / identities / correlations / inferences
  person: COLOR.purple,
  person_candidate: COLOR.purple,
  owner: COLOR.purple,
  social_profile: COLOR.purple,
  social: COLOR.purple,
  speaker: COLOR.purple,
  voice_sample: COLOR.purple,
  audio_evidence: COLOR.purple,
  case: COLOR.purple,
  entity: COLOR.purple,
  // financial
  transaction: COLOR.orange,
  transaction_record: COLOR.orange,
  // telecom / metadata
  communications_log: COLOR.grey,
  document: COLOR.grey,
};

const edgeStatusStyle: Record<EdgeStatus, { stroke: string; dash: string; label: string }> = {
  observed:   { stroke: "hsl(220, 14%, 50%)", dash: "none",  label: "observed" },
  validated:  { stroke: "hsl(160, 84%, 45%)", dash: "none",  label: "validated" },
  inferred:   { stroke: "hsl(38, 92%, 55%)",  dash: "6 4",   label: "inferred" },
  hypothesis: { stroke: "hsl(280, 70%, 70%)", dash: "2 4",   label: "hypothesis" },
};

const NODE_RADIUS = 28;
const LABEL_WIDTH = 132;
const MIN_DISTANCE = 150; // minimum centre-to-centre distance

// Simple iterative collision avoidance — pushes overlapping nodes apart
// without changing the overall layout structure.
function relaxPositions(nodes: GraphNode[], minDist = MIN_DISTANCE, iterations = 60) {
  const pos = nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i];
        const b = pos[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        if (d < minDist) {
          const overlap = (minDist - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * overlap;
          a.y -= uy * overlap;
          b.x += ux * overlap;
          b.y += uy * overlap;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const map: Record<string, { x: number; y: number }> = {};
  for (const p of pos) map[p.id] = { x: p.x, y: p.y };
  return map;
}

export function InvestigationGraph({ isRunning, onNodeClick, selectedNode, highlightPath, onEdgeClick, selectedEdge, scenario }: InvestigationGraphProps) {
  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<GraphEdge[]>([]);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    setVisibleNodes([]);
    setVisibleEdges([]);
    if (!isRunning) return;

    const nodeTimers = scenario.nodes.map((node) =>
      setTimeout(() => {
        setVisibleNodes((prev) => [...prev, node]);
      }, node.delay)
    );

    const edgeTimers = scenario.edges.map((edge) =>
      setTimeout(() => {
        setVisibleEdges((prev) => [...prev, edge]);
      }, edge.delay)
    );

    return () => {
      nodeTimers.forEach(clearTimeout);
      edgeTimers.forEach(clearTimeout);
    };
  }, [isRunning, scenario]);

  // Resolve overlapping positions for the full scenario (stable layout).
  const positions = useMemo(() => relaxPositions(scenario.nodes), [scenario]);
  const getPos = useCallback((id: string) => positions[id], [positions]);

  const getNode = useCallback((id: string) => visibleNodes.find((n) => n.id === id), [visibleNodes]);

  const isInPath = (id: string) => highlightPath.includes(id);

  // Edges connected to selected/hovered node — to highlight on selection
  const connectedEdgeIds = useMemo(() => {
    const focus = selectedNode || hoveredNode;
    if (!focus) return new Set<string>();
    return new Set(scenario.edges.filter((e) => e.source === focus || e.target === focus).map((e) => e.id));
  }, [selectedNode, hoveredNode, scenario]);

  // Bounding box from relaxed positions.
  const bbox = useMemo(() => {
    const pts = Object.values(positions);
    if (!pts.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }, [positions]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const TOP_PAD = 32;
  const BOTTOM_PAD = 88;
  const SIDE_PAD = 48;
  const graphW = bbox.maxX - bbox.minX;
  const graphH = bbox.maxY - bbox.minY;
  const availableW = Math.max(0, size.w - SIDE_PAD * 2);
  const availableH = Math.max(0, size.h - TOP_PAD - BOTTOM_PAD);
  const offsetX = size.w > 0 ? SIDE_PAD + (availableW - graphW) / 2 - bbox.minX : 0;
  const offsetY = size.h > 0 ? TOP_PAD + (availableH - graphH) / 2 - bbox.minY : 0;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden dot-grid">
      {/* Empty state */}
      {!isRunning && visibleNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-dashed-primary flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-mono">Configure seed data and launch investigation</p>
            <p className="text-muted-foreground/50 text-xs mt-1 font-mono">Graph will expand as agents discover relationships</p>
          </div>
        </div>
      )}

      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="hsl(220, 10%, 50%)" opacity="0.5" />
          </marker>
          <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="hsl(262, 70%, 58%)" />
          </marker>
        </defs>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
        <AnimatePresence>
          {visibleEdges.map((edge) => {
            const source = getNode(edge.source);
            const target = getNode(edge.target);
            if (!source || !target) return null;
            const sp = getPos(edge.source);
            const tp = getPos(edge.target);
            if (!sp || !tp) return null;

            const inPath = isInPath(edge.source) && isInPath(edge.target);
            const isEdgeSelected = selectedEdge === edge.id;
            const isEdgeHovered = hoveredEdge === edge.id;
            const isConnected = connectedEdgeIds.has(edge.id);
            const showLabel = isEdgeSelected || isEdgeHovered || isConnected || inPath;
            const midX = (sp.x + tp.x) / 2;
            const midY = (sp.y + tp.y) / 2;

            const style = edgeStatusStyle[edge.status] ?? edgeStatusStyle.observed;
            const strokeColor = isEdgeSelected
              ? "hsl(262, 70%, 70%)"
              : inPath
              ? "hsl(262, 70%, 58%)"
              : style.stroke;
            const dimmed = (selectedNode || hoveredNode) && !isConnected && !inPath && !isEdgeSelected && !isEdgeHovered;
            return (
              <motion.g
                key={edge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: dimmed ? 0.18 : 1 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdgeClick(edge.id);
                }}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge((id) => (id === edge.id ? null : id))}
                style={{ cursor: "pointer" }}
              >
                {/* Invisible thick hit area */}
                <line x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y} stroke="transparent" strokeWidth={16} />
                <line
                  x1={sp.x}
                  y1={sp.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={strokeColor}
                  strokeWidth={isEdgeSelected || isEdgeHovered ? 2.5 : inPath ? 2 : 1.25}
                  strokeDasharray={inPath || isEdgeSelected ? "none" : style.dash}
                  opacity={isEdgeSelected || isEdgeHovered ? 1 : inPath ? 1 : 0.55}
                  markerEnd={inPath || isEdgeSelected ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                  style={{ pointerEvents: "none" }}
                />
                {showLabel && (
                  <g style={{ pointerEvents: "none" }}>
                    <rect
                      x={midX - 36}
                      y={midY - 8}
                      width="72"
                      height="16"
                      rx="3"
                      fill="hsl(220, 18%, 10%)"
                      opacity="0.92"
                      stroke={style.stroke}
                      strokeOpacity="0.4"
                      strokeWidth={0.75}
                    />
                    <text x={midX} y={midY + 3} textAnchor="middle" fill={style.stroke} fontSize="8" fontFamily="'JetBrains Mono', monospace" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {style.label}
                    </text>
                  </g>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
        </g>
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {visibleNodes.map((node) => {
          const Icon = nodeIcons[node.type];
          const isSelected = selectedNode === node.id;
          const isHovered = hoveredNode === node.id;
          const inPath = isInPath(node.id);
          const isEvidence =
            node.type === "evidence" ||
            node.type === "video_evidence" ||
            node.type === "audio_evidence" ||
            node.type === "image_evidence";
          const typeColor = nodeColors[node.type];
          const pos = getPos(node.id) ?? { x: node.x, y: node.y };
          const dimmed = (selectedNode || hoveredNode) && !isSelected && !isHovered && !inPath;

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: dimmed ? 0.35 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute cursor-pointer group"
              style={{
                left: pos.x - NODE_RADIUS + offsetX,
                top: pos.y - NODE_RADIUS + offsetY,
              }}
              onClick={() => onNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode((id) => (id === node.id ? null : id))}
            >
              {/* Glow ring */}
              {(isSelected || inPath || isHovered) && (
                <motion.div
                  className={`absolute -inset-2 ${isEvidence ? "rounded-lg" : "rounded-full"}`}
                  style={{ background: `radial-gradient(circle, ${typeColor}55, transparent)` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Node shape */}
              <div
                className={`relative w-14 h-14 ${
                  isEvidence ? "rounded-lg" : "rounded-full"
                } border-2 flex items-center justify-center transition-all ${
                  isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                } group-hover:brightness-125`}
                style={{
                  background: `${typeColor}33`,
                  borderColor: typeColor,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: typeColor }} />
              </div>

              {/* Event-time chip */}
              {node.eventTime && (
                <div
                  className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: "hsl(220, 18%, 12%)",
                    border: `1px solid ${typeColor}`,
                    color: typeColor,
                    fontSize: "9px",
                    lineHeight: "11px",
                  }}
                >
                  {node.eventTime}
                </div>
              )}

              {/* Label — fixed width, max 2 lines, ellipsis */}
              <div
                className={`absolute top-full ${isEvidence ? "mt-2.5" : "mt-1.5"} left-1/2 -translate-x-1/2 text-center pointer-events-none`}
                style={{ width: LABEL_WIDTH }}
              >
                <div
                  className="text-[11px] font-medium text-foreground font-mono leading-tight"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                  title={node.label}
                >
                  {node.label}
                </div>
                {node.sublabel && (
                  <div
                    className="text-[10px] text-muted-foreground font-mono leading-tight mt-0.5"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordBreak: "break-word",
                    }}
                    title={node.sublabel}
                  >
                    {node.sublabel}
                  </div>
                )}
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Color + edge legend */}
      {visibleEdges.length > 0 && (
        <div className="absolute bottom-3 right-3 surface-glass border border-border rounded px-3 py-2 text-[9px] font-mono space-y-2 z-10">
          <div>
            <div className="text-muted-foreground uppercase tracking-wider mb-1">Node type</div>
            {[
              { c: COLOR.yellow, l: "visual evidence" },
              { c: COLOR.blue,   l: "physical / location" },
              { c: COLOR.purple, l: "people / inference" },
              { c: COLOR.orange, l: "financial" },
              { c: COLOR.grey,   l: "telecom / metadata" },
            ].map((it) => (
              <div key={it.l} className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: it.c }} />
                <span className="text-foreground/80">{it.l}</span>
              </div>
            ))}
          </div>
          <div className="pt-1 border-t border-border">
            <div className="text-muted-foreground uppercase tracking-wider mb-1">Edge status</div>
            {(Object.entries(edgeStatusStyle) as [EdgeStatus, typeof edgeStatusStyle[EdgeStatus]][]).map(([key, s]) => (
              <div key={key} className="flex items-center gap-2">
                <svg width="22" height="6">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={s.stroke} strokeWidth="2" strokeDasharray={s.dash} />
                </svg>
                <span className="text-foreground/80">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
