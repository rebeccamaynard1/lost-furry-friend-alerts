import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Camera, MapPin, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const mockSightings = [
  { id: 1, species: "Dog", color: "Brown", location: "Oak Park, IL", time: "2 hours ago", notes: "Small dog running near the park entrance" },
  { id: 2, species: "Cat", color: "Black and white", location: "Austin, TX", time: "5 hours ago", notes: "Cat hiding under a porch on Elm St" },
  { id: 3, species: "Dog", color: "Golden", location: "Denver, CO", time: "1 day ago", notes: "Friendly golden retriever near the lake trail" },
];

export default function SightingsPage() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">
          <Eye className="inline h-7 w-7 text-sighting mr-2" />
          Sightings
        </h1>
        <Button variant="hero" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Report Sighting
        </Button>
      </div>

      <div className="space-y-4">
        {mockSightings.map((s) => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="rounded-lg bg-sighting/10 p-3 flex-shrink-0">
                <Camera className="h-5 w-5 text-sighting" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold font-heading text-foreground">{s.species}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">{s.color}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.notes}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>
                  <span>{s.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
