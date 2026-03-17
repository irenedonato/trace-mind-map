import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Circle } from "lucide-react";
import { agentLogs } from "@/data/demoScenario";

interface AgentActivityBarProps {
  isRunning: boolean;
}

interface LogEntry {
  message: string;
  level: "info" | "warning" | "success";
  timestamp: string;
}

const levelColors: Record<string, string> = {
  info: "text-muted-foreground",
  warning: "text-amber",
  success: "text-emerald",
};

const dotColors: Record<string, string> = {
  info: "bg-muted-foreground",
  warning: "bg-amber",
  success: "bg-emerald",
};

export function AgentActivityBar({ isRunning }: AgentActivityBarProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning) {
      setLogs([]);
      return;
    }

    const timers = agentLogs.map((log) =>
      setTimeout(() => {
        const now = new Date();
        const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        setLogs((prev) => [...prev, { ...log, timestamp: ts }]);
      }, log.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isRunning]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [logs]);

  return (
    <div className="h-9 border-t border-border bg-card flex items-center px-3 gap-3 overflow-hidden">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Terminal className="w-3 h-3 text-muted-foreground" />
        <span className="text-data text-muted-foreground uppercase tracking-wider">Agent Log</span>
        {isRunning && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-emerald"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      <div className="w-px h-4 bg-border flex-shrink-0" />

      <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-thin flex items-center gap-4">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Circle className={`w-1.5 h-1.5 fill-current ${dotColors[log.level]}`} />
              <span className="text-data text-muted-foreground/60">{log.timestamp}</span>
              <span className={`text-data ${levelColors[log.level]}`}>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
