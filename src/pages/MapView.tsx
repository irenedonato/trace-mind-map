import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ScanLine,
  Smartphone,
  PhoneCall,
  Banknote,
  Crosshair,
  Filter,
  Radio,
  Eye,
  GitBranch,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------- Source taxonomy ----------
type SourceType = "cctv" | "anpr" | "mobile" | "call" | "financial";

const SOURCE_META: Record<
  SourceType,
  { label: string; short: string; Icon: typeof Camera; svg: string }
> = {
  cctv: {
    label: "CCTV",
    short: "CCTV",
    Icon: Camera,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h13l4-3v13l-4-3H2z"/><circle cx="8.5" cy="11" r="1.5"/></svg>`,
  },
  anpr: {
    label: "ANPR",
    short: "ANPR",
    Icon: ScanLine,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/></svg>`,
  },
  mobile: {
    label: "Mobile / Cell",
    short: "CELL",
    Icon: Smartphone,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>`,
  },
  call: {
    label: "Call / CDR",
    short: "CALL",
    Icon: PhoneCall,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  },
  financial: {
    label: "Financial",
    short: "FIN",
    Icon: Banknote,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  },
};

// ---------- Event model ----------
type Event = {
  id: string;
  name: string;
  source: SourceType;
  evidence: string;
  time: string; // HH:MM Zulu
  date: string; // short
  coords: [number, number];
  confidence: number; // 0..1
  observed: boolean; // true=detection, false=inferred presence
  refId: string; // e.g. CAM-47 / ANPR-12 / CDR-882
};

const events: Event[] = [
  {
    id: "e1",
    name: "Porta Susa",
    source: "cctv",
    evidence: "Subject re-identified — red sweatshirt match (Deckard sim 0.91)",
    time: "02:14",
    date: "04 MAY",
    coords: [45.0729, 7.666],
    confidence: 0.94,
    observed: true,
    refId: "CAM-12",
  },
  {
    id: "e2",
    name: "San Carlo",
    source: "cctv",
    evidence: "CCTV Feed #47 — facial re-id, frame 18420",
    time: "09:47",
    date: "04 MAY",
    coords: [45.0686, 7.683],
    confidence: 0.88,
    observed: true,
    refId: "CAM-47",
  },
  {
    id: "e3",
    name: "Aurora",
    source: "mobile",
    evidence: "IMSI ping — cell tower TIM-AUR-03, dwell 14 min",
    time: "11:20",
    date: "04 MAY",
    coords: [45.0921, 7.67],
    confidence: 0.62,
    observed: false,
    refId: "CELL-AUR03",
  },
  {
    id: "e4",
    name: "Lingotto",
    source: "anpr",
    evidence: "ANPR hit — partial plate GF-7K*2, black FIAT Tipo",
    time: "14:05",
    date: "04 MAY",
    coords: [45.0309, 7.6645],
    confidence: 0.81,
    observed: true,
    refId: "ANPR-09",
  },
  {
    id: "e5",
    name: "SS11 — Borgaro",
    source: "call",
    evidence: "Outgoing call to +39 348••• 22 — handover tower BRG-02",
    time: "16:38",
    date: "04 MAY",
    coords: [45.115, 7.717],
    confidence: 0.55,
    observed: false,
    refId: "CDR-882",
  },
  {
    id: "e6",
    name: "ID Logistics — Settimo",
    source: "financial",
    evidence: "POS transaction · fuel station 800m gate · €72.40",
    time: "17:12",
    date: "04 MAY",
    coords: [45.137, 7.772],
    confidence: 0.9,
    observed: true,
    refId: "FIN-3340",
  },
];

// Segments connect i → i+1; inferred when either endpoint is inferred OR time gap is large
type Segment = { from: Event; to: Event; inferred: boolean; confidence: number };
const segments: Segment[] = events.slice(0, -1).map((from, i) => {
  const to = events[i + 1];
  const inferred = !from.observed || !to.observed;
  const confidence = Math.min(from.confidence, to.confidence);
  return { from, to, inferred, confidence };
});

// ---------- Custom Leaflet icon ----------
const PURPLE = "hsl(270, 85%, 68%)";
const PURPLE_DIM = "hsl(270, 60%, 55%)";
const AMBER = "hsl(38, 92%, 60%)";

function makeMarkerIcon(ev: Event, index: number, dimmed: boolean) {
  const color = ev.observed ? PURPLE : AMBER;
  const ring = ev.observed ? "rgba(168,85,247,0.18)" : "rgba(245,158,11,0.15)";
  const fill = ev.observed ? color : "transparent";
  const stroke = color;
  const dashed = ev.observed ? "" : `stroke-dasharray="2 2"`;
  const opacity = dimmed ? 0.25 : 1;
  const conf = Math.round(ev.confidence * 100);
  const meta = SOURCE_META[ev.source];

  // SVG marker: outer confidence ring + inner badge with source glyph
  const ringR = 18 + Math.round(ev.confidence * 8); // bigger = more confident halo
  const html = `
  <div style="position:relative; opacity:${opacity}; transform:translate(-50%,-50%); width:0; height:0;">
    <svg width="${ringR * 2}" height="${ringR * 2}" style="position:absolute; left:-${ringR}px; top:-${ringR}px; pointer-events:none;">
      <circle cx="${ringR}" cy="${ringR}" r="${ringR - 2}" fill="${ring}" stroke="${color}" stroke-opacity="0.5" stroke-width="1" ${dashed} />
    </svg>
    <div style="
      position:absolute; left:-13px; top:-13px;
      width:26px; height:26px; border-radius:50%;
      background: ${ev.observed ? "rgba(15,12,28,0.95)" : "rgba(15,12,28,0.85)"};
      border: 1.5px ${ev.observed ? "solid" : "dashed"} ${stroke};
      box-shadow: 0 0 12px ${color}55, inset 0 0 6px ${color}33;
      display:flex; align-items:center; justify-content:center;
      color:${color};
      font-family: 'JetBrains Mono', monospace;
    ">
      ${meta.svg}
    </div>
    <div style="
      position:absolute; left:14px; top:-22px;
      display:flex; align-items:center; gap:4px;
      padding:2px 6px;
      background: rgba(10,8,20,0.92);
      border:1px solid ${color}66;
      border-left:2px solid ${color};
      color:#e6e3f0;
      font-family:'JetBrains Mono', monospace;
      font-size:9.5px;
      letter-spacing:0.04em;
      white-space:nowrap;
      line-height:1.1;
      backdrop-filter: blur(4px);
    ">
      <span style="color:${color}; font-weight:600;">${String(index + 1).padStart(2,"0")}</span>
      <span style="opacity:0.55;">·</span>
      <span>${ev.time}Z</span>
      <span style="opacity:0.55;">·</span>
      <span style="color:${color};">${meta.short}</span>
      <span style="opacity:0.5;">·</span>
      <span style="opacity:0.85;">c${conf}</span>
    </div>
  </div>`;

  return L.divIcon({
    html,
    className: "noesis-marker",
    iconSize: [0, 0],
  });
}

// ---------- Page ----------
const ALL_SOURCES: SourceType[] = ["cctv", "anpr", "mobile", "call", "financial"];

export default function MapView() {
  const [active, setActive] = useState<Set<SourceType>>(new Set(ALL_SOURCES));
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NOESIS — Geospatial Intelligence · Torino";
  }, []);

  const visibleEvents = useMemo(
    () => events.filter((e) => active.has(e.source)),
    [active]
  );

  const visibleSegments = useMemo(
    () => segments.filter((s) => active.has(s.from.source) && active.has(s.to.source)),
    [active]
  );

  const toggle = (s: SourceType) => {
    setActive((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      if (n.size === 0) return new Set(ALL_SOURCES);
      return n;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground">
      {/* Top bar */}
      <header className="h-11 border-b border-border bg-card flex items-center px-5 justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0">
            <span className="font-display text-base font-bold tracking-wider text-foreground">NOESIS</span>
            <span className="font-display text-base font-light text-primary mx-0.5">/</span>
            <span className="font-display text-sm font-normal text-muted-foreground">
              GEOINT · Torino AOR
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/70 px-2 py-0.5 border border-border rounded">
            OP-ID: NS-2026-0512
          </span>
          <span className="font-mono text-[10px] text-emerald px-2 py-0.5 border border-emerald/40 bg-emerald/5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" /> LIVE
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-data text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Investigation
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — intel timeline */}
        <aside className="w-80 border-r border-border bg-card flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-sm font-semibold tracking-wide flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />
              Entity Trail · Subject A
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reconstructed movement chain from multi-source detections
            </p>
            <div className="flex gap-3 mt-3 text-[10px] font-mono">
              <div>
                <div className="text-muted-foreground/70">EVENTS</div>
                <div className="text-foreground">{events.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground/70">OBSERVED</div>
                <div className="text-primary">{events.filter(e => e.observed).length}</div>
              </div>
              <div>
                <div className="text-muted-foreground/70">INFERRED</div>
                <div className="text-amber-400">{events.filter(e => !e.observed).length}</div>
              </div>
              <div>
                <div className="text-muted-foreground/70">WINDOW</div>
                <div className="text-foreground">14h58m</div>
              </div>
            </div>
          </div>

          <ol className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {events.map((ev, i) => {
              const meta = SOURCE_META[ev.source];
              const Icon = meta.Icon;
              const isHover = hovered === ev.id;
              return (
                <li
                  key={ev.id}
                  onMouseEnter={() => setHovered(ev.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group relative pl-2 pr-2 py-2 rounded border transition-colors cursor-pointer ${
                    isHover
                      ? "border-primary/60 bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`w-6 h-6 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold border ${
                          ev.observed
                            ? "bg-primary/15 border-primary/60 text-primary"
                            : "bg-amber-400/10 border-amber-400/50 text-amber-400 border-dashed"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {i < events.length - 1 && (
                        <div
                          className={`flex-1 w-px my-1 min-h-[14px] ${
                            ev.observed && events[i + 1].observed
                              ? "bg-primary/40"
                              : "bg-amber-400/30"
                          }`}
                          style={{
                            backgroundImage:
                              ev.observed && events[i + 1].observed
                                ? undefined
                                : "linear-gradient(180deg, currentColor 50%, transparent 0)",
                            backgroundSize: "1px 5px",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className={`w-3 h-3 flex-shrink-0 ${ev.observed ? "text-primary" : "text-amber-400"}`} />
                          <span className="font-display text-[13px] font-medium truncate">
                            {ev.name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-primary whitespace-nowrap">
                          {ev.time}Z
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {ev.evidence}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[9.5px]">
                        <span
                          className={`px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                            ev.observed
                              ? "border-primary/40 text-primary bg-primary/5"
                              : "border-amber-400/40 text-amber-400 bg-amber-400/5 border-dashed"
                          }`}
                        >
                          {ev.observed ? "OBSERVED" : "INFERRED"}
                        </span>
                        <span className="text-muted-foreground/70">{meta.short}·{ev.refId}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <span className="text-muted-foreground/60">conf</span>
                          <span
                            className={
                              ev.confidence >= 0.8
                                ? "text-emerald"
                                : ev.confidence >= 0.6
                                ? "text-amber-400"
                                : "text-red-400"
                            }
                          >
                            {Math.round(ev.confidence * 100)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Filters */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <span className="font-display text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Source Filter
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SOURCES.map((s) => {
                const meta = SOURCE_META[s];
                const Icon = meta.Icon;
                const on = active.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-all ${
                      on
                        ? "bg-primary/10 border-primary/50 text-primary"
                        : "bg-secondary/40 border-border text-muted-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {meta.short}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAP */}
        <div className="flex-1 relative">
          <MapContainer
            center={[45.085, 7.715]}
            zoom={12}
            scrollWheelZoom
            zoomControl={false}
            className="h-full w-full"
            style={{ background: "hsl(240 18% 6%)" }}
          >
            <TileLayer
              attribution='&copy; OSM &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              opacity={0.55}
            />

            {/* Segments */}
            {visibleSegments.map((seg, i) => (
              <Polyline
                key={`seg-${i}`}
                positions={[seg.from.coords, seg.to.coords]}
                pathOptions={{
                  color: seg.inferred ? AMBER : PURPLE,
                  weight: seg.inferred ? 1.6 : 2.4,
                  opacity: 0.45 + seg.confidence * 0.45,
                  dashArray: seg.inferred ? "4 6" : undefined,
                  lineCap: "round",
                }}
              />
            ))}

            {/* Confidence halos */}
            {visibleEvents.map((ev) => (
              <CircleMarker
                key={`halo-${ev.id}`}
                center={ev.coords}
                radius={6 + ev.confidence * 10}
                pathOptions={{
                  color: ev.observed ? PURPLE : AMBER,
                  fillColor: ev.observed ? PURPLE : AMBER,
                  fillOpacity: 0.05 + (1 - ev.confidence) * 0.06,
                  weight: 0.6,
                  opacity: 0.35,
                  dashArray: ev.observed ? undefined : "2 3",
                }}
              />
            ))}

            {/* Labeled markers */}
            {visibleEvents.map((ev, i) => (
              <Marker
                key={ev.id}
                position={ev.coords}
                icon={makeMarkerIcon(ev, events.indexOf(ev), hovered !== null && hovered !== ev.id)}
                eventHandlers={{
                  mouseover: () => setHovered(ev.id),
                  mouseout: () => setHovered(null),
                }}
              >
                <Tooltip direction="bottom" offset={[0, 18]} opacity={1} className="noesis-tt">
                  <div className="font-mono text-[10.5px] leading-tight">
                    <div className="text-primary font-semibold mb-0.5">
                      EVT-{String(i + 1).padStart(3, "0")} · {ev.name}
                    </div>
                    <div className="text-foreground/90">{ev.evidence}</div>
                    <div className="mt-1 flex gap-2 text-muted-foreground">
                      <span>{ev.date} {ev.time}Z</span>
                      <span>·</span>
                      <span>{SOURCE_META[ev.source].label}</span>
                      <span>·</span>
                      <span>{ev.refId}</span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      {ev.coords[0].toFixed(4)}°N · {ev.coords[1].toFixed(4)}°E ·{" "}
                      <span className={ev.observed ? "text-primary" : "text-amber-400"}>
                        {ev.observed ? "OBSERVED" : "INFERRED"}
                      </span>{" "}
                      · conf {Math.round(ev.confidence * 100)}%
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{ev.name}</div>
                    <div>{ev.evidence}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* HUD overlays */}
          <div className="pointer-events-none absolute inset-0">
            {/* corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-primary/60" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-primary/60" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-primary/60" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-primary/60" />

            {/* AOR header chip */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-card/85 border border-border backdrop-blur-md rounded font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
              <Radio className="w-3 h-3 text-primary" />
              AOR · TORINO METRO · 45.085°N 7.715°E · ZOOM 12
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-card/90 border border-border backdrop-blur-md rounded px-3 py-2 flex items-center gap-4 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">OBSERVED</span>
              <span className="w-6 h-px bg-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-amber-400" />
              <span className="text-muted-foreground">INFERRED</span>
              <span
                className="w-6 h-px"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${AMBER} 50%, transparent 0)`,
                  backgroundSize: "4px 1px",
                }}
              />
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              halo size = confidence
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">conf:</span>
              <span className="text-emerald">≥80</span>
              <span className="text-amber-400">60-79</span>
              <span className="text-red-400">&lt;60</span>
            </div>
          </div>

          {/* Scale-ish chip */}
          <div className="absolute top-3 right-3 mt-7 bg-card/85 border border-border backdrop-blur-md rounded px-2 py-1 font-mono text-[9.5px] text-muted-foreground">
            GRID · WGS84 · UTM 32T
          </div>
        </div>
      </div>

      {/* Tooltip override */}
      <style>{`
        .leaflet-container { background: hsl(240 18% 6%) !important; }
        .leaflet-tooltip.noesis-tt {
          background: rgba(10, 8, 20, 0.95);
          border: 1px solid hsl(var(--border));
          border-left: 2px solid ${PURPLE};
          color: hsl(var(--foreground));
          padding: 6px 8px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          border-radius: 2px;
        }
        .leaflet-tooltip.noesis-tt::before { display: none; }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: hsl(240 18% 8%);
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
        }
        .noesis-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
