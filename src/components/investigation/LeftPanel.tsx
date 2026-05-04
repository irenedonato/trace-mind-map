import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Zap, ChevronDown } from "lucide-react";
import type { SeedMode } from "@/data/demoScenario";

interface LeftPanelProps {
  onLaunch: () => void;
  isRunning: boolean;
  seedMode: SeedMode;
  onSeedModeChange: (mode: SeedMode) => void;
  totalMs: number;
}

export function LeftPanel({ onLaunch, isRunning, seedMode, totalMs }: LeftPanelProps) {
  const [seedValue, setSeedValue] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("");

  // Reset seed inputs when the mode changes
  useEffect(() => {
    if (seedMode === "vehicle") {
      setSeedValue("Black FIAT Tipo · partial plate GF-7K*2");
      setTimeRange("4 May 2026 · 08:00–10:00");
    } else {
      setSeedValue('"man wearing a red sweatshirt"');
      setTimeRange("72h lookback");
    }
  }, [seedMode]);

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-0 mb-1">
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">
            Investigation Seed
          </h2>
          <span className="font-display text-sm text-primary">/</span>
        </div>
        <p className="text-xs text-muted-foreground">Provide initial data to start the investigation</p>
      </div>

      {/* Seed Input */}
      <div className="px-4 space-y-3">
        <div>
          <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Seed Data</label>
          <input
            value={seedValue}
            onChange={(e) => setSeedValue(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 bg-secondary border-dashed-primary rounded text-data text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
            placeholder={seedMode === "vehicle" ? "Plate / descriptor..." : "Enter seed value..."}
          />
        </div>

        {/* Filters */}
        <div className="space-y-2.5">
          <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Filters</label>

          <div className="flex items-center gap-2 p-2.5 bg-secondary border border-border rounded">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-data text-muted-foreground">Time Range</span>
              <div className="text-data text-foreground">{timeRange}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-secondary border border-border rounded">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-data text-muted-foreground">Location</span>
              <div className="text-data text-foreground">Torino Stazione Porta Susa</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Data Sources */}
        <div className="space-y-2">
          <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Data Sources</label>
          <div className="space-y-1.5">
            {([
              {
                name: "Video Intelligence — Deckard",
                primary: true,
                badge: "Vector DB",
                tooltip:
                  "Bimodal embedding search: query by image or text (e.g. 'man with red shirt' or 'FIAT Tipo plate AB123'). Returns crops + video source, timestamp, frame id, crop id, embedding id, bbox, confidence.",
              },
              {
                name: "Voice Intelligence — AudioRAG",
                primary: true,
                badge: "Vector DB",
                tooltip:
                  "Vector DB of voice embeddings from recorded calls and audio. Query by voice sample or semantic prompt; returns matching speakers, source recording, timestamp, segment id, embedding id, confidence.",
              },
              {
                name: "Entity Extraction — Calls / Messages / Social",
                primary: true,
                badge: "AI NLP",
                tooltip:
                  "AI-analyzed calls, messages and social media data. Extracts entities (persons, orgs, locations, phones, accounts), relations, sentiment and topics from transcripts and chat logs.",
              },
              { name: "Vehicle Registry (MIT)", structured: seedMode === "vehicle" },
              { name: "ANPR Network", structured: seedMode === "vehicle" },
              { name: "Communications Logs (CDR / IPDR)", structured: true },
              { name: "Financial / Transaction Records", structured: true },
              { name: "CCTV Network (847 feeds)" },
            ] as { name: string; primary?: boolean; badge?: string; tooltip?: string; structured?: boolean }[]).map((src) => (
              <div
                key={src.name}
                className="flex items-center gap-2 text-xs"
                title={src.tooltip}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    src.primary
                      ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                      : src.structured
                      ? "bg-sky-400"
                      : "bg-emerald"
                  }`}
                />
                <span
                  className={`font-mono text-[11px] ${
                    src.primary ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {src.name}
                </span>
                {src.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono text-primary border border-primary/30 bg-primary/5 rounded uppercase tracking-wider">
                    {src.badge}
                  </span>
                )}
                {!src.badge && src.structured && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono text-sky-400 border border-sky-400/30 bg-sky-400/5 rounded uppercase tracking-wider">
                    Structured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <div className="mt-auto p-4">
        <motion.button
          onClick={onLaunch}
          disabled={isRunning}
          whileHover={!isRunning ? { scale: 1.02 } : {}}
          whileTap={!isRunning ? { scale: 0.98 } : {}}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded font-display font-semibold text-sm tracking-wide transition-all ${
            isRunning
              ? "bg-primary/20 text-primary/60 cursor-not-allowed"
              : "bg-primary text-primary-foreground glow-primary hover:brightness-110"
          }`}
        >
          <Zap className="w-4 h-4" />
          {isRunning ? "Investigation Running..." : "Launch Investigation"}
        </motion.button>

        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: totalMs / 1000, ease: "linear" }}
                />
              </div>
              <p className="text-data text-muted-foreground mt-1.5 text-center">
                Agents active • Correlating sources...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
