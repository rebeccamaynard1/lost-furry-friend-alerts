import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Shield, PawPrint, Eye, Phone, MapPin, Heart } from "lucide-react";

const guides = [
  {
    title: "How to Keep Your Pet Safe",
    icon: Shield,
    color: "text-primary",
    items: [
      "Always keep a collar with ID tags on your pet",
      "Microchip your pet and keep registration up to date",
      "Keep recent, clear photos of your pet on your phone",
      "Make sure your yard is secure — check for gaps in fences",
      "Never leave your pet unattended in public areas",
      "Consider a GPS tracker collar for adventurous pets",
      "Spay/neuter your pet to reduce roaming behavior",
      "Train your pet to respond to recall commands",
    ],
  },
  {
    title: "What to Do If Your Pet Goes Missing",
    icon: PawPrint,
    color: "text-lost",
    items: [
      "Report immediately on Lost Furry Friend Alerts",
      "Search your neighborhood — call their name",
      "Leave familiar items outside (bed, toys, worn clothes)",
      "Contact local shelters and animal control",
      "Post on social media and community groups",
      "Put up flyers in your neighborhood",
      "Check your pet's microchip is registered to your current info",
      "Don't give up — pets have been found weeks or months later",
    ],
  },
  {
    title: "What to Do If You Find a Pet",
    icon: Eye,
    color: "text-found",
    items: [
      "Report found pet on Fur Babies Lost & Found",
      "Check for a collar with ID tags",
      "Take the pet to a vet or shelter to scan for a microchip",
      "Post clear photos on our app and social media",
      "Keep the pet safe — in your home or local shelter",
      "Do NOT give the pet away — the owner may be searching",
      "Check our map for nearby lost pet reports that match",
      "Be patient — verification may take time",
    ],
  },
  {
    title: "How to Use This App",
    icon: HelpCircle,
    color: "text-accent",
    items: [
      "Report Lost Pet: Fill out the form with pet details and photos",
      "Report Found Pet: Submit details of a pet you've found",
      "Sightings: Spotted a loose pet? Submit a quick sighting report",
      "Map: View all lost pets, found pets, and sightings in your area",
      "Messages: Chat directly with other users",
      "Premium: Get instant alerts and statewide notifications",
      "Donate: Help us keep this service free for families",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="page-container max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="page-title mb-0">Help & Safety Guides</h1>
          <p className="text-sm text-muted-foreground">Everything you need to know about keeping pets safe.</p>
        </div>
      </div>

      <div className="space-y-6">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title}>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${guide.color}`} />
                  {guide.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guide.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Phone className="mx-auto mb-2 h-8 w-8 text-primary" />
          <p className="font-heading font-bold text-foreground">Emergency?</p>
          <p className="text-sm text-muted-foreground mt-1">
            If you see an injured or dangerous animal, call your local Animal Control or 911.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
