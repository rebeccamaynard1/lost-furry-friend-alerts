import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Check, Zap } from "lucide-react";

const features = [
  "Instant push alerts when a pet is reported near you",
  "State-wide alert coverage",
  "Priority listing in search results",
  "Unlimited photo uploads",
  "Video verification badge",
  "Direct shelter contact",
  "Ad-free experience",
];

export default function PremiumPage() {
  return (
    <div className="page-container max-w-2xl text-center">
      <Crown className="mx-auto mb-4 h-14 w-14 text-accent" />
      <h1 className="page-title">Upgrade to Premium</h1>
      <p className="text-muted-foreground mb-8">Get the best tools to find your pet faster.</p>

      <Card className="border-accent/30 shadow-lg">
        <CardContent className="p-8">
          <div className="mb-6">
            <span className="text-4xl font-extrabold font-heading text-foreground">$4.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 text-left mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-found mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="hero" size="lg" className="w-full rounded-xl py-6 text-lg bg-accent hover:bg-accent/90">
            <Zap className="h-5 w-5 mr-2" />
            Start Premium
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Cancel anytime. Your support keeps us running.</p>
        </CardContent>
      </Card>
    </div>
  );
}
