import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { DemoStep } from "@/data/demoScenario";

interface StepIndicatorProps {
  isRunning: boolean;
  steps: DemoStep[];
  totalMs: number;
}

export function StepIndicator({ isRunning, steps, totalMs }: StepIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const e = now - start;
      setElapsed(e);
      if (e < totalMs + 1500) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, totalMs]);

  const currentStep =
    [...steps].reverse().find((s) => elapsed >= s.startMs)?.step ?? 0;
  const active = isRunning ? currentStep : 0;
  const progress = Math.min(elapsed / totalMs, 1);

  return (
    <div className="absolute top-3 left-3 right-3 z-10 surface-glass border border-border rounded-md p-2.5">
      <div className="flex items-stretch gap-1">
        {steps.map((s) => {
          const done = isRunning && active > s.step;
          const isActive = isRunning && active === s.step;
          return (
            <div
              key={s.step}
              className={`flex-1 min-w-0 px-2 py-1.5 rounded border transition-colors ${
                isActive
                  ? "bg-primary/15 border-primary/60"
                  : done
                  ? "bg-emerald/10 border-emerald/40"
                  : "bg-secondary/40 border-border"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono flex-shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-emerald text-background"
                      : "bg-secondary border border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-2.5 h-2.5" /> : s.step}
                </div>
                <span
                  className={`font-display text-[10px] uppercase tracking-wider truncate ${
                    isActive
                      ? "text-foreground"
                      : done
                      ? "text-emerald"
                      : "text-muted-foreground/70"
                  }`}
                >
                  {s.title}
                </span>
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-primary ml-auto flex-shrink-0"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isRunning && active > 0 && (
        <div className="mt-2 flex items-center gap-3">
          <div className="text-data text-muted-foreground font-mono flex-1 truncate">
            <span className="text-primary">Step {active}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            {steps[active - 1].subtitle}
          </div>
          <div className="w-32 h-1 bg-secondary rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-data text-muted-foreground/70 font-mono w-10 text-right">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
