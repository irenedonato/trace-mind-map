import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Brain, Clock, Video, Database, CreditCard, Info, ChevronRight } from "lucide-react";
import { demoNodes, reasoningSteps, timelineEvents } from "@/data/demoScenario";

interface RightPanelProps {
  selectedNode: string | null;
  onHighlightPath: (path: string[]) => void;
}

type TabId = "evidence" | "reasoning" | "timeline";

const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "evidence", label: "Evidence", icon: FileText },
  { id: "reasoning", label: "Reasoning", icon: Brain },
  { id: "timeline", label: "Timeline", icon: Clock },
];

const evidenceIcons: Record<string, typeof Video> = {
  video: Video,
  log: Database,
  transaction: CreditCard,
  metadata: Info,
};

export function RightPanel({ selectedNode, onHighlightPath }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("evidence");
  const node = demoNodes.find((n) => n.id === selectedNode);

  return (
    <div className="w-80 border-l border-border surface-glass flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium uppercase tracking-wider transition-all ${
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
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{node.label}</h3>
                    <span className="text-data text-muted-foreground ml-auto">{node.sublabel}</span>
                  </div>

                  {node.evidence?.map((ev, i) => {
                    const Icon = evidenceIcons[ev.type] || Info;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 bg-secondary rounded border border-border"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">{ev.title}</span>
                        </div>
                        <p className="text-data text-muted-foreground leading-relaxed">{ev.detail}</p>
                        <div className="text-data text-muted-foreground/60 mt-1.5 font-mono">{ev.timestamp}</div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a node to view evidence</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Click any entity in the graph</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reasoning" && (
            <motion.div key="reasoning" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground mb-4">Agent Reasoning Chain</h3>
              {reasoningSteps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-6"
                >
                  {/* Line connector */}
                  {i < reasoningSteps.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary">{step.step}</span>
                  </div>
                  <div className="p-3 bg-secondary rounded border border-border mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{step.title}</span>
                      <span
                        className="text-data px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: step.confidence >= 0.9 ? "hsl(160, 84%, 39%)" : step.confidence >= 0.8 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                          color: "hsl(220, 25%, 5%)",
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

          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground mb-4">Event Timeline</h3>
              {timelineEvents.map((ev, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onHighlightPath([ev.entity])}
                  className="w-full flex items-center gap-3 p-2.5 rounded hover:bg-secondary transition-colors text-left group"
                >
                  <div className="text-data text-muted-foreground w-28 flex-shrink-0">{ev.time}</div>
                  <div className="flex-1 text-xs text-foreground">{ev.event}</div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}

              {/* Path highlight button */}
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => onHighlightPath(["p1", "t1", "p2", "v2"])}
                  className="w-full flex items-center gap-2 p-3 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
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
