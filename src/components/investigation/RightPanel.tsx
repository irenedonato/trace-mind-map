import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Brain, Clock, Video, Database, CreditCard, Info, ChevronRight, GitBranch, Mic, Image as ImageIcon, Network, ShieldCheck, Link2, CheckCircle2 } from "lucide-react";
import { type EdgeStatus, type Scenario } from "@/data/demoScenario";

interface RightPanelProps {
  selectedNode: string | null;
  selectedEdge: string | null;
  onHighlightPath: (path: string[]) => void;
  scenario: Scenario;
}

type TabId = "evidence" | "reasoning" | "source" | "timeline";

const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "evidence", label: "Evidence", icon: FileText },
  { id: "reasoning", label: "Reasoning", icon: Brain },
  { id: "source", label: "Source", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Clock },
];

const edgeStatusBadge: Record<EdgeStatus, { bg: string; label: string }> = {
  observed:   { bg: "hsl(220, 14%, 45%)", label: "OBSERVED" },
  validated:  { bg: "hsl(160, 84%, 39%)", label: "VALIDATED" },
  inferred:   { bg: "hsl(38, 92%, 50%)",  label: "INFERRED" },
  hypothesis: { bg: "hsl(280, 70%, 65%)", label: "HYPOTHESIS" },
};

const evidenceIcons: Record<string, typeof Video> = {
  video: Video,
  log: Database,
  transaction: CreditCard,
  metadata: Info,
};

const sourceIcons: Record<string, typeof Video> = {
  video: Video,
  audio: Mic,
  log: Database,
  transaction: CreditCard,
  image: ImageIcon,
  vector: Network,
  nlp: Brain,
};

export function RightPanel({ selectedNode, selectedEdge, onHighlightPath, scenario }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("evidence");
  const node = scenario.nodes.find((n) => n.id === selectedNode);
  const edge = scenario.edges.find((e) => e.id === selectedEdge);
  const edgeSource = edge ? scenario.nodes.find((n) => n.id === edge.source) : undefined;
  const edgeTarget = edge ? scenario.nodes.find((n) => n.id === edge.target) : undefined;

  // Auto-switch to Source tab when an edge is selected (link details now live in Source)
  useEffect(() => {
    if (selectedEdge) setActiveTab("source");
  }, [selectedEdge]);

  // Auto-switch back to Evidence when a node is selected
  useEffect(() => {
    if (selectedNode) setActiveTab("evidence");
  }, [selectedNode]);

  return (
    <div className="w-80 border-l border-border surface-glass flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-display uppercase tracking-wider transition-all ${
              activeTab === id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <AnimatePresence mode="wait">
          {activeTab === "evidence" && (
            <motion.div key="evidence" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {node ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-0 mb-2">
                    <h3 className="font-display text-sm font-semibold text-foreground">{node.label}</h3>
                    <span className="font-display text-sm text-primary mx-1">/</span>
                    <span className="text-data text-muted-foreground">{node.sublabel}</span>
                  </div>

                  {/* Evidence card — structured facts (Camera/Time/Detection/Attribute…) */}
                  {node.facts && node.facts.length > 0 && (
                    <div className="p-3 rounded border-2 border-amber/40 bg-amber/5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-data font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber/30 text-amber-foreground" style={{ fontSize: "9px" }}>
                          {node.type === "audio_evidence" ? "Audio Evidence" : node.type === "image_evidence" ? "Image Evidence" : node.type === "video_evidence" ? "Video Evidence" : "Evidence"}
                        </span>
                        {node.eventTime && (
                          <span className="text-data font-mono text-amber" style={{ fontSize: "10px" }}>
                            {node.eventTime}
                          </span>
                        )}
                      </div>
                      <dl className="space-y-1.5">
                        {node.facts.map((f, i) => (
                          <div key={i} className="flex gap-2 text-data">
                            <dt className="text-muted-foreground/70 font-mono uppercase tracking-wider w-20 flex-shrink-0">{f.label}</dt>
                            <dd className="text-foreground/90 font-mono leading-relaxed">{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {node.evidence?.map((ev, i) => {
                    const Icon = evidenceIcons[ev.type] || Info;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 bg-secondary rounded border-dashed-primary"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground font-mono">{ev.title}</span>
                        </div>
                        <p className="text-data text-muted-foreground leading-relaxed">{ev.detail}</p>
                        <div className="text-data text-muted-foreground/60 mt-1.5">{ev.timestamp}</div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-mono">Select a node to view evidence</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 font-mono">Click any entity in the graph</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reasoning" && (
            <motion.div key="reasoning" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
              <div className="flex items-center gap-0 mb-4">
                <h3 className="font-display text-sm font-semibold text-foreground">Agent Reasoning Chain</h3>
                <span className="font-display text-sm text-primary mx-1">/</span>
              </div>
              {scenario.reasoningSteps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-6"
                >
                  {i < scenario.reasoningSteps.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary font-mono">{step.step}</span>
                  </div>
                  <div className="p-3 bg-secondary rounded border border-border mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground font-mono">{step.title}</span>
                      <span
                        className="text-data px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: step.confidence >= 0.9 ? "hsl(160, 84%, 39%)" : step.confidence >= 0.8 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                          color: "hsl(220, 20%, 7%)",
                          fontSize: "9px",
                        }}
                      >
                        {Math.round(step.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-data text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "source" && (
            <motion.div key="source" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {edge && edgeSource && edgeTarget ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-0 mb-1">
                    <h3 className="font-display text-sm font-semibold text-foreground">Link Source</h3>
                    <span className="font-display text-sm text-primary mx-1">/</span>
                    <span className="text-data text-muted-foreground">{edge.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3 text-data text-muted-foreground/70">
                    <Link2 className="w-3 h-3 text-primary" />
                    <span>Why is this link in the graph?</span>
                  </div>

                  <div className="p-3 bg-secondary rounded border border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-data text-muted-foreground/60 uppercase tracking-wider">From</div>
                        <div className="text-xs font-medium text-foreground font-mono truncate">{edgeSource.label}</div>
                        {edgeSource.sublabel && <div className="text-data text-muted-foreground truncate">{edgeSource.sublabel}</div>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-data text-muted-foreground/60 uppercase tracking-wider">To</div>
                        <div className="text-xs font-medium text-foreground font-mono truncate">{edgeTarget.label}</div>
                        {edgeTarget.sublabel && <div className="text-data text-muted-foreground truncate">{edgeTarget.sublabel}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-data px-2 py-1 rounded font-mono uppercase tracking-wider"
                      style={{
                        background: edgeStatusBadge[edge.status].bg,
                        color: "hsl(220, 20%, 7%)",
                        fontSize: "9px",
                      }}
                    >
                      {edgeStatusBadge[edge.status].label}
                    </span>
                    <span
                      className="text-data px-2 py-1 rounded font-mono"
                      style={{
                        background: edge.confidence >= 0.9 ? "hsl(160, 84%, 39%)" : edge.confidence >= 0.8 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                        color: "hsl(220, 20%, 7%)",
                        fontSize: "9px",
                      }}
                    >
                      {Math.round(edge.confidence * 100)}% confidence
                    </span>
                  </div>

                  {edge.rationaleSummary && (
                    <div className="p-3 bg-secondary rounded border-dashed-primary">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Brain className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground font-mono">AI Rationale</span>
                      </div>
                      <p className="text-data text-muted-foreground leading-relaxed">{edge.rationaleSummary}</p>
                    </div>
                  )}

                  {edge.rationale && edge.rationale.length > 0 && (
                    <div className="p-3 bg-secondary rounded border border-border">
                      <div className="text-data text-muted-foreground/70 uppercase tracking-wider mb-2">Supporting signals</div>
                      <ul className="space-y-2">
                        {edge.rationale.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-data text-foreground/90 leading-relaxed">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {edge.status === "hypothesis" && (
                    <div className="p-3 rounded border border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground font-mono">Analyst validation pending</span>
                      </div>
                      <p className="text-data text-muted-foreground leading-relaxed">
                        Promote to <span className="text-primary font-mono">VALIDATED</span> after manual review of supporting signals.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => onHighlightPath([edge.source, edge.target])}
                    className="w-full flex items-center gap-2 p-2.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-display font-medium hover:bg-primary/15 transition-colors"
                  >
                    <Network className="w-3.5 h-3.5" />
                    Highlight this link in graph
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </div>
              ) : node ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-0 mb-1">
                    <h3 className="font-display text-sm font-semibold text-foreground">Source Trace</h3>
                    <span className="font-display text-sm text-primary mx-1">/</span>
                    <span className="text-data text-muted-foreground">{node.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3 text-data text-muted-foreground/70">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span>Provenance · auditable · explainable</span>
                  </div>

                  {node.sourceTrace?.length ? (
                    <div className="relative space-y-2">
                      {node.sourceTrace.map((src, i) => {
                        const Icon = sourceIcons[src.type] || Database;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="relative pl-6"
                          >
                            {i < (node.sourceTrace!.length - 1) && (
                              <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                            )}
                            <div className="absolute left-0 top-2 w-[18px] h-[18px] rounded-full bg-secondary border border-primary/60 flex items-center justify-center">
                              <Icon className="w-2.5 h-2.5 text-primary" />
                            </div>
                            <div className="p-3 bg-secondary rounded border border-border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-foreground font-mono truncate">{src.source}</span>
                                <span className="text-data text-muted-foreground/70 uppercase tracking-wider ml-2">{src.type}</span>
                              </div>
                              <div className="text-data text-primary font-mono mb-1">{src.reference}</div>
                              {src.detail && (
                                <p className="text-data text-muted-foreground leading-relaxed">{src.detail}</p>
                              )}
                              <div className="flex items-center justify-between mt-1.5 gap-2">
                                {src.hash && (
                                  <span className="text-data text-muted-foreground/60 font-mono truncate">{src.hash}</span>
                                )}
                                {src.timestamp && (
                                  <span className="text-data text-muted-foreground/60 ml-auto">{src.timestamp}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-data text-muted-foreground/70">No source trace recorded for this node.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-mono">Select a node or link to trace its sources</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 font-mono">Video, audio, logs, transactions</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-1">
              <div className="flex items-center gap-0 mb-4">
                <h3 className="font-display text-sm font-semibold text-foreground">Event Timeline</h3>
                <span className="font-display text-sm text-primary mx-1">/</span>
              </div>
              {scenario.timelineEvents.map((ev, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onHighlightPath([ev.entity])}
                  className="w-full flex items-center gap-3 p-2.5 rounded hover:bg-secondary transition-colors text-left group"
                >
                  <div className="text-data text-muted-foreground w-28 flex-shrink-0">{ev.time}</div>
                  <div className="flex-1 text-xs text-foreground font-mono">{ev.event}</div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}

              {/* Path highlight button */}
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => onHighlightPath(scenario.defaultHighlightChain)}
                  className="w-full flex items-center gap-2 p-3 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-display font-medium hover:bg-primary/15 transition-colors"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Highlight Connection Chain
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
