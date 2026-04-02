import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Check, Zap, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PremiumBadge from "@/components/PremiumBadge";

const features = [
  "Instant push alerts when a pet is reported near you",
  "State-wide alert coverage (25-mile radius vs 5-mile)",
  "Priority listing in search results",
  "Boost your lost pet report to the top",
  "Unlimited photo uploads",
  "Premium badge next to your name",
  "Ad-free experience",
];

// Note: Replace with actual Stripe price ID after creating the product in Stripe dashboard
const PREMIUM_PRICE_ID = "price_1TEM6rCn19AGQAKoNBZwp9gm";

export default function PremiumPage() {
  const { user, isPremium, subscriptionEnd } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode: "subscription", priceId: PREMIUM_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Failed to start checkout: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  };

  return (
    <div className="page-container max-w-2xl text-center">
      <Crown className="mx-auto mb-4 h-14 w-14 text-accent" />
      <h1 className="page-title">Upgrade to Premium</h1>
      <p className="text-muted-foreground mb-8">Get the best tools to find your pet faster.</p>

      {isPremium && (
        <Card className="mb-6 border-accent bg-accent/5">
          <CardContent className="p-4 flex items-center justify-center gap-2">
            <PremiumBadge />
            <p className="text-sm font-semibold text-foreground">
              You're a Premium member!
              {subscriptionEnd && (
                <span className="text-muted-foreground font-normal">
                  {" "}Renews {new Date(subscriptionEnd).toLocaleDateString()}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-accent/30 shadow-lg">
        <CardContent className="p-8">
          <div className="mb-6">
            <span className="text-4xl font-extrabold font-heading text-foreground">$15</span>
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
          {!isPremium ? (
            <Button
              variant="hero"
              size="lg"
              className="w-full rounded-xl py-6 text-lg bg-accent hover:bg-accent/90"
              onClick={handleSubscribe}
              disabled={loading}
            >
              <Zap className="h-5 w-5 mr-2" />
              {loading ? "Loading..." : "Start Premium"}
            </Button>
          ) : (
            <Button variant="outline" size="lg" className="w-full rounded-xl py-6 text-lg" disabled>
              <Star className="h-5 w-5 mr-2" />
              Current Plan
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-3">Cancel anytime. Your support keeps us running.</p>
        </CardContent>
      </Card>
    </div>
  );
}
