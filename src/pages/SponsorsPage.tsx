import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Globe, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockSponsors = [
  { id: 1, name: "PetSafe Foods", tier: "Gold", website: "petsafe.com", approved: true },
  { id: 2, name: "Pawsitive Vet Clinic", tier: "Silver", website: "pawsitivevet.com", approved: true },
  { id: 3, name: "Happy Tails Supply", tier: "Bronze", website: "happytails.com", approved: true },
];

const tierColor: Record<string, string> = {
  Gold: "bg-accent text-accent-foreground",
  Silver: "bg-muted text-muted-foreground",
  Bronze: "bg-sighting/20 text-sighting",
};

export default function SponsorsPage() {
  return (
    <div className="page-container">
      <h1 className="page-title"><Megaphone className="inline h-7 w-7 text-accent mr-2" />Our Sponsors</h1>
      <p className="text-muted-foreground mb-6">Businesses helping pets get home. Interested in sponsoring? Contact us!</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockSponsors.map((s) => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-5 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                <Megaphone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
              <Badge className={`mt-2 ${tierColor[s.tier]}`}>{s.tier} Sponsor</Badge>
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1"><Globe className="h-3 w-3" />{s.website}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
