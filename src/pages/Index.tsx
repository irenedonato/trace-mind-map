import { useState, useCallback, useMemo } from "react";
import { LeftPanel } from "@/components/investigation/LeftPanel";
import { InvestigationGraph } from "@/components/investigation/InvestigationGraph";
import { RightPanel } from "@/components/investigation/RightPanel";
import { AgentActivityBar } from "@/components/investigation/AgentActivityBar";
import { MediaPreview } from "@/components/investigation/MediaPreview";
import { getScenario, type SeedMode } from "@/data/demoScenario";

const Index = () => {
  const [seedMode, setSeedMode] = useState<SeedMode>("vehicle");
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);

  const scenario = useMemo(() => getScenario(seedMode), [seedMode]);

  const handleLaunch = useCallback(() => {
    setIsRunning(true);
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightPath([]);
  }, []);

  const handleSeedModeChange = useCallback((mode: SeedMode) => {
    setSeedMode(mode);
    setIsRunning(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightPath([]);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedEdge(null);
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleEdgeClick = useCallback((edgeId: string) => {
    setSelectedNode(null);
    setSelectedEdge((prev) => (prev === edgeId ? null : edgeId));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar — Deckard style */}
      <header className="h-11 border-b border-border bg-card flex items-center px-5 justify-between flex-shrink-0">
        <div className="flex items-center gap-0">
          <span className="font-display text-base font-bold tracking-wider text-foreground">NOESIS</span>
          <span className="font-display text-base font-light text-primary mx-0.5">/</span>
          <span className="font-display text-sm font-normal text-muted-foreground">Cognitive Investigation Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-data text-muted-foreground">v2.4.1</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
            <span className="text-data text-emerald">System Operational</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          onLaunch={handleLaunch}
          isRunning={isRunning}
          seedMode={seedMode}
          onSeedModeChange={handleSeedModeChange}
          totalMs={scenario.totalMs}
        />
        <InvestigationGraph
          isRunning={isRunning}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          highlightPath={highlightPath}
          onEdgeClick={handleEdgeClick}
          selectedEdge={selectedEdge}
          scenario={scenario}
        />
        <RightPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onHighlightPath={setHighlightPath}
          scenario={scenario}
        />
      </div>

      {/* Floating media preview (e.g. CCTV frame for Vehicle Detection) */}
      <MediaPreview selectedNode={selectedNode} scenario={scenario} onClose={() => setSelectedNode(null)} />

      {/* Agent activity */}
      <AgentActivityBar isRunning={isRunning} scenario={scenario} />
    </div>
  );
};

export default Index;
