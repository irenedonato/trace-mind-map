import { useState, useCallback } from "react";
import { LeftPanel } from "@/components/investigation/LeftPanel";
import { InvestigationGraph } from "@/components/investigation/InvestigationGraph";
import { RightPanel } from "@/components/investigation/RightPanel";
import { AgentActivityBar } from "@/components/investigation/AgentActivityBar";
import { Shield } from "lucide-react";

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);

  const handleLaunch = useCallback(() => {
    setIsRunning(true);
    setSelectedNode(null);
    setHighlightPath([]);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-10 border-b border-border bg-card flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-foreground">NOESIS</span>
          <span className="text-data text-muted-foreground ml-1">Cognitive Investigation Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-data text-muted-foreground">v2.4.1</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
            <span className="text-data text-emerald">System Operational</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel onLaunch={handleLaunch} isRunning={isRunning} />
        <InvestigationGraph
          isRunning={isRunning}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          highlightPath={highlightPath}
        />
        <RightPanel selectedNode={selectedNode} onHighlightPath={setHighlightPath} />
      </div>

      {/* Agent activity */}
      <AgentActivityBar isRunning={isRunning} />
    </div>
  );
};

export default Index;
