import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, Clock } from "lucide-react";

const mockVolunteers = [
  { id: 1, name: "Maria G.", county: "Travis County, TX", skills: "Search & Rescue, Trapping", availability: "Weekends" },
  { id: 2, name: "James R.", county: "Denver County, CO", skills: "Drone Pilot, Photography", availability: "Evenings" },
  { id: 3, name: "Linda K.", county: "Multnomah County, OR", skills: "Social Media, Flyer Distribution", availability: "Flexible" },
];

export default function VolunteersPage() {
  return (
    <div className="page-container">
      <h1 className="page-title"><Users className="inline h-7 w-7 text-volunteer mr-2" />Volunteers</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockVolunteers.map((v) => (
          <Card key={v.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-volunteer/10 flex items-center justify-center">
                  <span className="font-bold text-volunteer">{v.name[0]}</span>
                </div>
                <h3 className="font-heading font-bold text-foreground">{v.name}</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{v.county}</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{v.availability}</p>
                <p className="text-xs mt-2">{v.skills}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
