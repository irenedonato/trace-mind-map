import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + bundlers)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Waypoint = {
  id: string;
  name: string;
  sublabel: string;
  time: string;
  coords: [number, number];
};

// Spatial movement chain reconstructed from the scenario, in Torino
const waypoints: Waypoint[] = [
  { id: "wp1", name: "Porta Susa", sublabel: "Initial CCTV detection · subject in red sweatshirt", time: "02:14", coords: [45.0729, 7.6660] },
  { id: "wp2", name: "Centro / San Carlo", sublabel: "Re-identification — CCTV Feed #47", time: "09:47", coords: [45.0686, 7.6830] },
  { id: "wp3", name: "Aurora", sublabel: "Vehicle observation — black FIAT Punto", time: "11:20", coords: [45.0921, 7.6700] },
  { id: "wp4", name: "Lingotto", sublabel: "ANPR ping — partial plate GF-7K*2", time: "14:05", coords: [45.0309, 7.6645] },
  { id: "wp5", name: "ID Logistics — Settimo Torinese", sublabel: "Final destination · logistics site", time: "17:12", coords: [45.1370, 7.7720] },
];

const path: [number, number][] = waypoints.map((w) => w.coords);

export default function MapView() {
  useEffect(() => {
    document.title = "NOESIS — Spatial Movements · Torino";
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar — matches Index style */}
      <header className="h-11 border-b border-border bg-card flex items-center px-5 justify-between flex-shrink-0">
        <div className="flex items-center gap-0">
          <span className="font-display text-base font-bold tracking-wider text-foreground">NOESIS</span>
          <span className="font-display text-base font-light text-primary mx-0.5">/</span>
          <span className="font-display text-sm font-normal text-muted-foreground">Spatial Movements · Torino</span>
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
        {/* Side panel with waypoints */}
        <aside className="w-80 border-r border-border bg-card flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Movement Timeline
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reconstructed spatial trail of subject and vehicle
            </p>
          </div>

          <ol className="p-4 space-y-3">
            {waypoints.map((wp, i) => (
              <li key={wp.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-data font-bold flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary))]">
                    {i + 1}
                  </div>
                  {i < waypoints.length - 1 && (
                    <div className="flex-1 w-px bg-border my-1" />
                  )}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-medium text-foreground">{wp.name}</span>
                    <span className="text-data text-primary">{wp.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{wp.sublabel}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
                    {wp.coords[0].toFixed(4)}°N · {wp.coords[1].toFixed(4)}°E
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[45.0703, 7.6869]}
            zoom={12}
            scrollWheelZoom
            className="h-full w-full"
            style={{ background: "hsl(var(--background))" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Polyline
              positions={path}
              pathOptions={{ color: "hsl(280, 70%, 65%)", weight: 3, opacity: 0.85, dashArray: "6 6" }}
            />
            {waypoints.map((wp, i) => (
              <Marker key={wp.id} position={wp.coords}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">#{i + 1} · {wp.name}</div>
                    <div className="text-[11px]">{wp.sublabel}</div>
                    <div className="text-[10px] mt-1 opacity-70">{wp.time}</div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -30]} opacity={0.9} permanent>
                  <span className="font-mono text-[10px]">{i + 1} · {wp.time}</span>
                </Tooltip>
              </Marker>
            ))}
            {waypoints.map((wp) => (
              <CircleMarker
                key={`pulse-${wp.id}`}
                center={wp.coords}
                radius={10}
                pathOptions={{ color: "hsl(280, 70%, 65%)", fillColor: "hsl(280, 70%, 65%)", fillOpacity: 0.15, weight: 1 }}
              />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
