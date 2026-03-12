import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, PawPrint } from "lucide-react";
import logo from "@/assets/littlefoot-logo-1.png";

const amounts = [5, 10, 25, 50, 100];

export default function DonatePage() {
  return (
    <div className="page-container max-w-2xl text-center">
      <img src={logo} alt="Little Foot" className="mx-auto mb-4 h-20 w-20 object-contain" />
      <h1 className="page-title">
        <Heart className="inline h-7 w-7 text-lost mr-2" />
        Donate
      </h1>
      <p className="text-muted-foreground mb-8">
        Your donation helps keep Fur Babies Lost & Found free for every family.
        100% goes toward alerts, server costs, and community support.
      </p>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-heading font-bold text-lg mb-4 text-foreground">Choose an amount</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {amounts.map((a) => (
              <Button key={a} variant="outline" className="text-lg font-bold py-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                ${a}
              </Button>
            ))}
          </div>
          <Button variant="hero" size="lg" className="w-full rounded-xl py-6 text-lg">
            <Heart className="h-5 w-5 mr-2" />
            Donate Now
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            <PawPrint className="inline h-3 w-3 mr-1" />
            In honor of Little Foot
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
