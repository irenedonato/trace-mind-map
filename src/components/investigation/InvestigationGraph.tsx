import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Video, Banknote, Smartphone, MapPin, AtSign } from "lucide-react";
import { demoNodes, demoEdges, type GraphNode, type GraphEdge, type EdgeStatus } from "@/data/demoScenario";

interface InvestigationGraphProps {
  isRunning: boolean;
  onNodeClick: (nodeId: string) => void;
  selectedNode: string | null;
  highlightPath: string[];
  onEdgeClick: (edgeId: string) => void;
  selectedEdge: string | null;
}

const nodeIcons: Record<string, typeof User> = {
  person: User,
  video: Video,
  transaction: Banknote,
  device: Smartphone,
  location: MapPin,
  social: AtSign,
};

const nodeColors: Record<string, string> = {
  person: "hsl(262, 70%, 58%)",
  video: "hsl(160, 84%, 39%)",
  transaction: "hsl(38, 92%, 50%)",
  device: "hsl(220, 10%, 50%)",
  location: "hsl(0, 84%, 60%)",
  social: "hsl(200, 80%, 55%)",
};

const nodeBgClass: Record<string, string> = {
  person: "bg-primary/20 border-primary/50",
  video: "bg-emerald/20 border-emerald/50",
  transaction: "bg-amber/20 border-amber/50",
  device: "bg-muted border-muted-foreground/30",
  location: "bg-crimson/20 border-crimson/50",
  social: "bg-sky-500/20 border-sky-500/50",
};

const edgeStatusStyle: Record<EdgeStatus, { stroke: string; dash: string; label: string }> = {
  observed:   { stroke: "hsl(220, 14%, 45%)", dash: "none",  label: "OBSERVED" },
  validated:  { stroke: "hsl(160, 84%, 39%)", dash: "none",  label: "VALIDATED" },
  inferred:   { stroke: "hsl(38, 92%, 50%)",  dash: "6 4",   label: "INFERRED" },
  hypothesis: { stroke: "hsl(280, 70%, 65%)", dash: "2 4",   label: "HYPOTHESIS" },
};

export function InvestigationGraph({ isRunning, onNodeClick, selectedNode, highlightPath, onEdgeClick, selectedEdge }: InvestigationGraphProps) {
  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    if (!isRunning) {
      setVisibleNodes([]);
      setVisibleEdges([]);
      return;
    }

    const nodeTimers = demoNodes.map((node) =>
      setTimeout(() => {
        setVisibleNodes((prev) => [...prev, node]);
      }, node.delay)
    );

    const edgeTimers = demoEdges.map((edge) =>
      setTimeout(() => {
        setVisibleEdges((prev) => [...prev, edge]);
      }, edge.delay)
    );

    return () => {
      nodeTimers.forEach(clearTimeout);
      edgeTimers.forEach(clearTimeout);
    };
  }, [isRunning]);

  const getNode = useCallback((id: string) => visibleNodes.find((n) => n.id === id), [visibleNodes]);

  const isInPath = (id: string) => highlightPath.includes(id);

  return (
    <div className="flex-1 relative overflow-hidden dot-grid">
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

        <AnimatePresence>
          {visibleEdges.map((edge) => {
            const source = getNode(edge.source);
            const target = getNode(edge.target);
            if (!source || !target) return null;

            const inPath = isInPath(edge.source) && isInPath(edge.target);
            const isEdgeSelected = selectedEdge === edge.id;
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            const style = edgeStatusStyle[edge.status] ?? edgeStatusStyle.observed;
            const strokeColor = isEdgeSelected
              ? "hsl(262, 70%, 70%)"
              : inPath
              ? "hsl(262, 70%, 58%)"
              : style.stroke;
            return (
              <motion.g
                key={edge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdgeClick(edge.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {/* Invisible thick hit area for easier clicking */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="transparent"
                  strokeWidth={16}
                />
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={strokeColor}
                  strokeWidth={isEdgeSelected ? 3 : inPath ? 2 : 1.5}
                  strokeDasharray={inPath || isEdgeSelected ? "none" : style.dash}
                  opacity={isEdgeSelected ? 1 : inPath ? 1 : 0.7}
                  markerEnd={inPath || isEdgeSelected ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={midX - 38}
                  y={midY - 18}
                  width="76"
                  height="32"
                  rx="3"
                  fill="hsl(220, 18%, 10%)"
                  opacity="0.9"
                  stroke={isEdgeSelected ? strokeColor : "transparent"}
                  strokeWidth={isEdgeSelected ? 1 : 0}
                />
                <text x={midX} y={midY - 5} textAnchor="middle" fill="hsl(220, 10%, 65%)" fontSize="9" fontFamily="'JetBrains Mono', monospace" style={{ pointerEvents: "none" }}>
                  {edge.label}
                </text>
                <text x={midX} y={midY + 8} textAnchor="middle" fill={style.stroke} fontSize="8" fontFamily="'JetBrains Mono', monospace" style={{ letterSpacing: "0.05em", pointerEvents: "none" }}>
                  {style.label}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {visibleNodes.map((node) => {
          const Icon = nodeIcons[node.type];
          const isSelected = selectedNode === node.id;
          const inPath = isInPath(node.id);

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute cursor-pointer group"
              style={{ left: node.x - 28, top: node.y - 28 }}
              onClick={() => onNodeClick(node.id)}
            >
              {/* Glow ring */}
              {(isSelected || inPath) && (
                <motion.div
                  className="absolute -inset-2 rounded-full"
                  style={{ background: `radial-gradient(circle, ${nodeColors[node.type]}33, transparent)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Node circle */}
              <div
                className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${nodeBgClass[node.type]} ${
                  isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                } group-hover:brightness-125`}
              >
                <Icon className="w-5 h-5" style={{ color: nodeColors[node.type] }} />
              </div>

              {/* Label */}
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                <div className="text-xs font-medium text-foreground font-mono">{node.label}</div>
                {node.sublabel && (
                  <div className="text-data text-muted-foreground">{node.sublabel}</div>
                )}
              </div>

              {/* Confidence badge */}
              <div
                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-data font-medium"
                style={{
                  background: node.confidence >= 0.9 ? "hsl(160, 84%, 39%)" : node.confidence >= 0.8 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                  color: "hsl(220, 20%, 7%)",
                  fontSize: "9px",
                }}
              >
                {Math.round(node.confidence * 100)}%
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Edge status legend */}
      {visibleEdges.length > 0 && (
        <div className="absolute bottom-3 right-3 surface-glass border border-border rounded px-3 py-2 text-[9px] font-mono space-y-1 z-10">
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
      )}
    </div>
  );
}
