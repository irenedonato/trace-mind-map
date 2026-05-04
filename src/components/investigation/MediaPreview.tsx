import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, ExternalLink } from "lucide-react";
import { type Scenario } from "@/data/demoScenario";

interface MediaPreviewProps {
  selectedNode: string | null;
  scenario: Scenario;
  onClose: () => void;
}

export function MediaPreview({ selectedNode, scenario, onClose }: MediaPreviewProps) {
  const node = scenario.nodes.find((n) => n.id === selectedNode);
  const media = node?.mediaImage;

  return (
    <AnimatePresence>
      {node && media && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-20 right-[336px] z-40 w-[420px] surface-glass border border-primary/30 rounded-lg shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 20px 60px -10px hsl(220 80% 5% / 0.8), 0 0 0 1px hsl(var(--primary) / 0.2)" }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/60">
            <div className="flex items-center gap-2 min-w-0">
              <Camera className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-data font-mono uppercase tracking-wider text-foreground truncate">
                {node.label} · Frame Preview
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-background/40 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Image */}
          <div className="relative bg-black">
            <img
              src={media.src}
              alt={media.caption || node.label}
              className="w-full h-auto block"
              draggable={false}
            />
            {/* CCTV overlay corners */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/80" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/80" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/80" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/80" />
              {node.eventTime && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-background/70 border border-primary/40 text-data font-mono text-primary" style={{ fontSize: "10px" }}>
                  REC ● {node.eventTime}
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          {media.caption && (
            <div className="px-3 py-2 text-data font-mono text-muted-foreground border-t border-border">
              {media.caption}
            </div>
          )}

          {/* External Deckard action */}
          {node.deckardLink && (
            <a
              href={node.deckardLink.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-primary/10 hover:bg-primary/15 transition-colors text-primary text-data font-mono uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                {node.deckardLink.label}
              </span>
              <span className="text-muted-foreground/70 normal-case tracking-normal">deckard ↗</span>
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
