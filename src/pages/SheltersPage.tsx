import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Phone, Globe, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockShelters = [
  { id: 1, name: "Happy Paws Rescue", address: "123 Main St, Austin, TX", phone: "(512) 555-0100", website: "happypaws.org", approved: true },
  { id: 2, name: "Second Chance Animal Shelter", address: "456 Oak Ave, Denver, CO", phone: "(720) 555-0200", website: "secondchance.org", approved: true },
  { id: 3, name: "Furry Friends Haven", address: "789 Elm St, Portland, OR", phone: "(503) 555-0300", website: "", approved: false },
];

export default function SheltersPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">
        <Building2 className="inline h-7 w-7 text-shelter mr-2" />
        Shelters & Rescues
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockShelters.map((s) => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
                {s.approved && <Badge className="bg-found text-primary-foreground text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>}
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{s.address}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.phone}</p>
                {s.website && <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{s.website}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
