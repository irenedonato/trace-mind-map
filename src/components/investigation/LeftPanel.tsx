import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FileText, Phone, CreditCard, MapPin, Clock, Zap, ChevronDown } from "lucide-react";

interface LeftPanelProps {
  onLaunch: () => void;
  isRunning: boolean;
}

const seedTypes = [
  { icon: Camera, label: "Image / Video", id: "image" },
  { icon: FileText, label: "Text / Name", id: "text" },
  { icon: Phone, label: "Phone Number", id: "phone" },
  { icon: CreditCard, label: "Account / TX", id: "account" },
];

export function LeftPanel({ onLaunch, isRunning }: LeftPanelProps) {
  const [selectedSeed, setSelectedSeed] = useState("image");
  const [seedValue, setSeedValue] = useState("CCTV_Feed_12_frame_8847.png");

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
        <p className="text-xs text-muted-foreground">Select input type and provide initial data</p>
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
            placeholder="Enter seed value..."
          />
        </div>

        {/* Filters */}
        <div className="space-y-2.5">
          <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Filters</label>
          
          <div className="flex items-center gap-2 p-2.5 bg-secondary border border-border rounded">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-data text-muted-foreground">Time Range</span>
              <div className="text-data text-foreground">72h lookback</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-secondary border border-border rounded">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-data text-muted-foreground">Location</span>
              <div className="text-data text-foreground">Chicago Metro</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Data Sources */}
        <div className="space-y-2">
          <label className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Data Sources</label>
          <div className="space-y-1.5">
            {["CCTV Network (847 feeds)", "CDR / Call Logs", "Financial Records", "Vehicle Registry"].map((src) => (
              <div key={src} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
                <span className="text-muted-foreground font-mono text-[11px]">{src}</span>
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
                  transition={{ duration: 6, ease: "easeOut" }}
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
