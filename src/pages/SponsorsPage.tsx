import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Globe, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockSponsors = [
  { id: 1, name: "PetSafe Foods", tier: "Platinum", website: "petsafe.com", approved: true },
  { id: 2, name: "Pawsitive Vet Clinic", tier: "Gold", website: "pawsitivevet.com", approved: true },
  { id: 3, name: "Happy Tails Supply", tier: "Silver", website: "happytails.com", approved: true },
  { id: 4, name: "Local Pet Shop", tier: "Bronze", website: "localpets.com", approved: true },
];

const tierColor: Record<string, string> = {
  Platinum: "bg-primary text-primary-foreground",
  Gold: "bg-accent text-accent-foreground",
  Silver: "bg-muted text-foreground",
  Bronze: "bg-sighting/20 text-sighting",
};

const tierBenefits: Record<string, string[]> = {
  Bronze: ["Logo on sponsors page", "Link to your website"],
  Silver: ["Everything in Bronze", "Social media shoutout", "Logo on monthly newsletter"],
  Gold: ["Everything in Silver", "Featured sponsor badge", "Logo on homepage"],
  Platinum: ["Everything in Gold", "Top placement everywhere", "Custom co-branded campaign", "Direct shelter partnership"],
};

export default function SponsorsPage() {
  return (
    <div className="page-container">
      <h1 className="page-title"><Megaphone className="inline h-7 w-7 text-accent mr-2" />Our Sponsors</h1>
      <p className="text-muted-foreground mb-6">Businesses helping pets get home. Interested in sponsoring? Contact us!</p>

      {/* Sponsor Tiers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {(["Bronze", "Silver", "Gold", "Platinum"] as const).map((tier) => (
          <Card key={tier} className={`card-hover ${tier === "Platinum" ? "border-primary shadow-lg" : ""}`}>
            <CardContent className="p-5">
              <Badge className={`mb-3 ${tierColor[tier]}`}>{tier}</Badge>
              <h3 className="font-heading font-bold text-foreground mb-2">{tier} Sponsor</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                {tierBenefits[tier].map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <Crown className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="w-full rounded-lg text-xs">
                Become a {tier} Sponsor
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Sponsors */}
      <h2 className="text-xl font-bold font-heading text-foreground mb-4">Current Sponsors</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockSponsors.map((s) => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-5 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                <Megaphone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
              <Badge className={`mt-2 ${tierColor[s.tier]}`}>{s.tier} Sponsor</Badge>
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Globe className="h-3 w-3" />{s.website}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
