import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Circle,
  useMap,
} from "react-leaflet";
import { MARIA, SHELTERS, CONTACTS, type Shelter } from "@/data/demo";
import { EMPOWER_ZIPS, EMPOWER_TOTAL_COUNTY, EMPOWER_SOURCE } from "@/data/zipOverlay";
import { scoreShelterForMap } from "@/agents/matchingAgent";
import { useDemo } from "@/context/DemoContext";

// Hard-coded pin colors per spec
const PIN_COLORS: Record<string, string> = {
  shelter_001: "hsl(var(--safe))",
  shelter_002: "hsl(var(--danger))",
  shelter_003: "hsl(var(--amber))",
  shelter_004: "hsl(var(--amber))",
  shelter_005: "hsl(var(--danger))",
};

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 36],
    popupAnchor: [0, -32],
    html: `<div class="sr-marker"><div class="sr-marker-pin" style="background:${color}"></div></div>`,
  });
}

function userIcon(emergency: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div class="sr-pulse-dot ${emergency ? "sr-pulse-dot--danger" : ""}"></div>`,
  });
}

function familyIcon() {
  return L.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:hsl(var(--safe));border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  });
}

/** Match score label for shelter tooltips */
function scoreLabel(score: number): string {
  if (score >= 80) return `Match: ${score}% ✓`;
  if (score >= 50) return `Match: ${score}%`;
  return `Match: ${score}% — Not recommended`;
}

function FixSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function MapView() {
  const { mode } = useDemo();
  const isDisaster = mode === "DISASTER_ACTIVE";

  return (
    <MapContainer
      center={[30.2672, -97.7431]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <FixSize />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {EMPOWER_ZIPS.map((z) => (
        <Circle
          key={z.zip}
          center={[z.lat, z.lng]}
          radius={Math.max(900, z.count * 5)}
          pathOptions={{
            color: "hsl(var(--amber))",
            fillColor: "hsl(var(--amber))",
            fillOpacity: isDisaster ? 0.36 : 0.2,
            weight: 1,
          }}
        >
          <Tooltip>
            <strong>ZIP {z.zip}</strong>
            <br />
            {z.count} electricity-dependent residents
          </Tooltip>
        </Circle>
      ))}

      {SHELTERS.map((s: Shelter) => {
        const score = scoreShelterForMap(MARIA, s);
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pinIcon(PIN_COLORS[s.id] ?? "hsl(var(--amber))")}
          >
            <Tooltip direction="top" offset={[0, -32]}>
              <strong>{s.name}</strong>
              <br />
              {s.distanceMiles} mi · {s.backupPower ? "Backup power ✓" : "No backup ✗"}
              <br />
              <strong>{scoreLabel(score)}</strong>
            </Tooltip>
          </Marker>
        );
      })}

      {/* Family / emergency contact dots */}
      {CONTACTS.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={familyIcon()}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <strong>{c.name}</strong> ({c.relationship})
            <br />
            {c.distanceMiles} mi · {c.status === "safe" ? "Safe ✓" : "Nearby"}
          </Tooltip>
        </Marker>
      ))}

      <Marker position={[MARIA.lat, MARIA.lng]} icon={userIcon(isDisaster)}>
        <Tooltip permanent direction="right" offset={[14, 0]}>
          <strong>You — Maria</strong>
        </Tooltip>
      </Marker>
    </MapContainer>
  );
}

/** emPOWER legend overlay — positioned by MapScreen */
export function EmPOWERLegend() {
  return (
    <div className="rounded-card bg-navy/90 p-3 backdrop-blur-sm ring-1 ring-white/10" style={{ maxWidth: 220 }}>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-amber">
        ⚡ emPOWER Data
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: "hsl(var(--amber))", opacity: 0.5 }}
          aria-hidden
        />
        <span className="text-[13px] text-white">
          Electricity-dependent residents
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Travis County: {EMPOWER_TOTAL_COUNTY.toLocaleString()}+ total
      </p>
      <p className="text-[11px] italic text-muted-foreground">
        {EMPOWER_SOURCE}
      </p>
    </div>
  );
}
