import { Card, CardContent } from "@/components/ui/card";
import { TreePine, MapPin, Camera } from "lucide-react";

const mockPartners = [
  { id: 1, name: "Jake T.", county: "Garfield County, CO", area: "White River National Forest", uploads: 12 },
  { id: 2, name: "Bobby L.", county: "Ozark County, MO", area: "Mark Twain National Forest", uploads: 8 },
];

export default function RuralPartnersPage() {
  return (
    <div className="page-container">
      <h1 className="page-title"><TreePine className="inline h-7 w-7 text-found mr-2" />Rural Partners</h1>
      <p className="text-muted-foreground mb-6">Hunters and rural community members helping track lost pets in remote areas.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {mockPartners.map((p) => (
          <Card key={p.id} className="card-hover">
            <CardContent className="p-5">
              <h3 className="font-heading font-bold text-foreground mb-2">{p.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{p.county}</p>
                <p className="flex items-center gap-2"><TreePine className="h-3.5 w-3.5" />{p.area}</p>
                <p className="flex items-center gap-2"><Camera className="h-3.5 w-3.5" />{p.uploads} trail cam uploads</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
