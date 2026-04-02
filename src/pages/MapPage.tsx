import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, CheckCircle2, Eye, Building2, Users, Locate, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createColorIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const MARKER_COLORS = {
  lost: "hsl(0, 72%, 55%)",
  found: "hsl(145, 65%, 42%)",
  sighting: "hsl(30, 90%, 55%)",
  shelter: "hsl(260, 60%, 55%)",
  volunteer: "hsl(199, 78%, 48%)",
};

const legend = [
  { label: "Lost Pets", color: "bg-lost", icon: AlertTriangle, key: "lost" },
  { label: "Found Pets", color: "bg-found", icon: CheckCircle2, key: "found" },
  { label: "Sightings", color: "bg-sighting", icon: Eye, key: "sighting" },
  { label: "Shelters", color: "bg-shelter", icon: Building2, key: "shelter" },
];

type MapMarker = {
  id: string;
  type: "lost" | "found" | "sighting" | "shelter";
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  link?: string;
  photo?: string | null;
};

function LocateControl() {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13 });
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-4 right-4 z-[1000] rounded-full bg-card p-3 shadow-lg border border-border hover:bg-secondary transition-colors"
      title="Go to my location"
    >
      <Locate className="h-5 w-5 text-primary" />
    </button>
  );
}

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ lost: true, found: true, sighting: true, shelter: true });

  useEffect(() => {
    async function fetchData() {
      const [lostRes, foundRes, sightRes, shelterRes] = await Promise.all([
        supabase.from("lost_pets").select("id, pet_name, species, breed, last_seen_lat, last_seen_lng, last_seen_address, photos, status").eq("status", "lost"),
        supabase.from("found_pets").select("id, species, breed, color, found_lat, found_lng, found_address, photos, status").eq("status", "found"),
        supabase.from("sightings").select("id, location_lat, location_lng, location_address, notes, photo, seen_at"),
        supabase.from("shelters").select("id, name, address, phone, logo, approved").eq("approved", true),
      ]);

      const all: MapMarker[] = [];

      (lostRes.data || []).forEach((p) => {
        if (p.last_seen_lat && p.last_seen_lng) {
          all.push({
            id: p.id, type: "lost", lat: p.last_seen_lat, lng: p.last_seen_lng,
            title: `🚨 ${p.pet_name}`, subtitle: `${p.species}${p.breed ? ` • ${p.breed}` : ""} — ${p.last_seen_address || "Unknown"}`,
            link: `/pet/${p.id}`, photo: p.photos?.[0] || null,
          });
        }
      });

      (foundRes.data || []).forEach((p) => {
        if (p.found_lat && p.found_lng) {
          all.push({
            id: p.id, type: "found", lat: p.found_lat, lng: p.found_lng,
            title: `✅ Found ${p.species}`, subtitle: `${p.color}${p.breed ? ` • ${p.breed}` : ""} — ${p.found_address || "Unknown"}`,
            link: `/pet/${p.id}?type=found`, photo: p.photos?.[0] || null,
          });
        }
      });

      (sightRes.data || []).forEach((s) => {
        if (s.location_lat && s.location_lng) {
          all.push({
            id: s.id, type: "sighting", lat: s.location_lat, lng: s.location_lng,
            title: "👁️ Sighting", subtitle: s.notes || s.location_address || "No details",
            link: `/sightings`, photo: s.photo,
          });
        }
      });

      (shelterRes.data || []).forEach(() => {
        // Shelters don't have lat/lng yet — skip for now
      });

      setMarkers(all);
      setLoading(false);
    }
    fetchData();
  }, []);

  const icons = useMemo(() => ({
    lost: createColorIcon(MARKER_COLORS.lost),
    found: createColorIcon(MARKER_COLORS.found),
    sighting: createColorIcon(MARKER_COLORS.sighting),
    shelter: createColorIcon(MARKER_COLORS.shelter),
  }), []);

  const filtered = markers.filter((m) => filters[m.type]);

  const toggleFilter = (key: string) => {
    setFilters((f) => ({ ...f, [key]: !f[key as keyof typeof f] }));
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        <MapPin className="inline h-7 w-7 text-primary mr-2" />
        Interactive Map
      </h1>

      {/* Legend / Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {legend.map((item) => {
          const Icon = item.icon;
          const active = filters[item.key as keyof typeof filters];
          return (
            <button
              key={item.key}
              onClick={() => toggleFilter(item.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all ${
                active
                  ? "border-transparent bg-secondary text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground opacity-50"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${item.color}`} />
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          {loading ? (
            <div className="flex h-[65vh] items-center justify-center bg-secondary/50">
              <div className="text-center">
                <MapPin className="mx-auto mb-3 h-12 w-12 text-primary animate-pulse-soft" />
                <p className="text-lg font-heading font-bold text-foreground">Loading Map...</p>
              </div>
            </div>
          ) : (
            <div className="h-[65vh]">
              <MapContainer
                center={[39.8283, -98.5795]}
                zoom={4}
                className="h-full w-full z-0"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocateControl />
                {filtered.map((m) => (
                  <Marker key={`${m.type}-${m.id}`} position={[m.lat, m.lng]} icon={icons[m.type]}>
                    <Popup>
                      <div className="min-w-[180px]">
                        {m.photo && (
                          <img src={m.photo} alt={m.title} className="w-full h-24 object-cover rounded mb-2" />
                        )}
                        <p className="font-bold text-sm">{m.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{m.subtitle}</p>
                        {m.link && (
                          <Link to={m.link} className="text-xs text-blue-600 underline mt-2 block">
                            View Details →
                          </Link>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {legend.map((item) => {
          const count = markers.filter((m) => m.type === item.key).length;
          const Icon = item.icon;
          return (
            <Card key={item.key}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-full p-2 ${item.color}/20`}>
                  <Icon className={`h-5 w-5`} style={{ color: MARKER_COLORS[item.key as keyof typeof MARKER_COLORS] }} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
