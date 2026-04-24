import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FileText, Phone, CreditCard, MapPin, Clock, Zap, ChevronDown, Car, Eye } from "lucide-react";
import type { SeedMode } from "@/data/demoScenario";

interface LeftPanelProps {
  onLaunch: () => void;
  isRunning: boolean;
  seedMode: SeedMode;
  onSeedModeChange: (mode: SeedMode) => void;
  totalMs: number;
}

const visualSeedTypes = [
  { icon: Camera, label: "Image / Video", id: "image" },
  { icon: FileText, label: "Text / Name", id: "text" },
  { icon: Phone, label: "Phone Number", id: "phone" },
  { icon: CreditCard, label: "Account / TX", id: "account" },
];

const vehicleSeedTypes = [
  { icon: Car, label: "License Plate", id: "plate" },
  { icon: FileText, label: "Vehicle Descr.", id: "descriptor" },
  { icon: Camera, label: "ANPR / CCTV", id: "anpr" },
  { icon: Phone, label: "Witness Tip", id: "tip" },
];

export function LeftPanel({ onLaunch, isRunning, seedMode, onSeedModeChange, totalMs }: LeftPanelProps) {
  const seedTypes = seedMode === "vehicle" ? vehicleSeedTypes : visualSeedTypes;
  const [selectedSeed, setSelectedSeed] = useState<string>(seedTypes[0].id);
  const [seedValue, setSeedValue] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("");

  // Reset seed inputs when the mode changes
  useEffect(() => {
    if (seedMode === "vehicle") {
      setSelectedSeed("plate");
      setSeedValue("FIAT Tipo · plate AB123**");
      setTimeRange("12 Apr 2026 · 17:00–20:00");
    } else {
      setSelectedSeed("text");
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
        <p className="text-xs text-muted-foreground">Select scenario and provide initial data</p>
      </div>

      {/* Seed Mode Toggle */}
      <div className="p-4 pb-0 space-y-2">
        <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Scenario</label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary rounded">
          <button
            onClick={() => onSeedModeChange("visual")}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-mono transition-all ${
              seedMode === "visual"
                ? "bg-primary text-primary-foreground font-medium shadow"
                : "text-muted-foreground hover:text-foreground"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual clue
          </button>
          <button
            onClick={() => onSeedModeChange("vehicle")}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-mono transition-all ${
              seedMode === "vehicle"
                ? "bg-primary text-primary-foreground font-medium shadow"
                : "text-muted-foreground hover:text-foreground"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Car className="w-3.5 h-3.5" />
            Vehicle
          </button>
        </div>
      </div>

      {/* Seed Type Selection */}
      <div className="p-4 space-y-2">
        <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Input Type</label>
        <div className="grid grid-cols-2 gap-2">
          {seedTypes.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => setSelectedSeed(id)}
              className={`flex items-center gap-2 p-2.5 rounded text-xs transition-all ${
                selectedSeed === id
                  ? "bg-primary/10 text-primary border border-primary/40 font-medium"
                  : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate font-mono text-[11px]">{label}</span>
            </button>
          ))}
        </div>
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
