import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertTriangle, CheckCircle2, Eye, Building2, Users } from "lucide-react";

const legend = [
  { label: "Lost Pets", color: "bg-lost", icon: AlertTriangle },
  { label: "Found Pets", color: "bg-found", icon: CheckCircle2 },
  { label: "Sightings", color: "bg-sighting", icon: Eye },
  { label: "Shelters", color: "bg-shelter", icon: Building2 },
  { label: "Volunteers", color: "bg-volunteer", icon: Users },
];

export default function MapPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">
        <MapPin className="inline h-7 w-7 text-primary mr-2" />
        Interactive Map
      </h1>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {legend.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className={`h-3 w-3 rounded-full ${item.color}`} />
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Map Placeholder */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-[60vh] items-center justify-center bg-secondary/50">
            <div className="text-center">
              <MapPin className="mx-auto mb-3 h-12 w-12 text-primary animate-pulse-soft" />
              <p className="text-lg font-heading font-bold text-foreground">Map Loading...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Interactive map with lost pets, found pets, sightings, and shelters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
