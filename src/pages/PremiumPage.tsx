import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Check, Zap, Star, Settings, Rocket, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PremiumBadge from "@/components/PremiumBadge";
import SEO from "@/components/SEO";

type BoostRow = {
  id: string;
  tier: string;
  radius_miles: number;
  duration_days: number;
  purchased_at: string;
  expires_at: string;
};

const features = [
  "Instant push alerts when a pet is reported near you",
  "State-wide alert coverage (25-mile radius vs 5-mile)",
  "Priority listing in search results",
  "Boost your lost pet report to the top",
  "Unlimited photo uploads",
  "Premium badge next to your name",
  "Ad-free experience",
];

const PREMIUM_PRICE_ID = "price_1ThR8wCn19AGQAKoFPzPYQXh";

const BOOSTS = [
  {
    id: "standard",
    name: "Alert Boost — Standard",
    price: "$10",
    priceId: "price_1ThR93Cn19AGQAKo7L2lYlna",
    icon: TrendingUp,
    description: "One-time boost to push your lost pet report to the top of search and alert feeds.",
    perks: [
      "Top placement for 3 days",
      "Wider 15-mile alert radius",
      "Highlighted listing card",
    ],
  },
  {
    id: "extended",
    name: "Alert Boost — Extended",
    price: "$20",
    priceId: "price_1ThR94Cn19AGQAKomoFmagza",
    icon: Rocket,
    description: "Extended one-time boost with wider reach and longer top-of-feed placement.",
    perks: [
      "Top placement for 7 days",
      "State-wide 25-mile alert radius",
      "Featured on the home page",
    ],
  },
];

export default function PremiumPage() {
  const { user, isPremium, subscriptionEnd } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState<string | null>(null);
  const [boosts, setBoosts] = useState<BoostRow[]>([]);

  useEffect(() => {
    if (!user) {
      setBoosts([]);
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("alert_boosts")
        .select("id, tier, radius_miles, duration_days, purchased_at, expires_at")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false })
        .limit(10);
      if (!error && data) setBoosts(data as BoostRow[]);
    };
    load();
  }, [user]);

  const handleBuyBoost = async (priceId: string, id: string) => {
    if (!user) {
      toast.error("Please sign in first.");
      navigate("/login");
      return;
    }
    setBoostLoading(id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode: "payment", priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Failed to start checkout: " + (err.message || "Unknown error"));
    }
    setBoostLoading(null);
  };

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

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Failed to open subscription manager: " + (err.message || "Unknown error"));
    }
    setPortalLoading(false);
  };

  return (
    <div className="page-container max-w-2xl text-center">
      <SEO title="Premium Membership — Lost Furry Friend Alerts" description="Upgrade to Premium for instant alerts, state-wide notifications, priority listings, and more reach." />
      <Crown className="mx-auto mb-4 h-14 w-14 text-accent" />
      <h1 className="page-title">Upgrade to Premium</h1>
      <p className="text-muted-foreground mb-8">Get the best tools to find your pet faster.</p>

      {isPremium && (
        <Card className="mb-6 border-accent bg-accent/5">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <PremiumBadge />
              <p className="text-sm font-semibold text-foreground">
                You're a Premium member!
                {subscriptionEnd && (
                  <span className="text-muted-foreground font-normal">
                    {" "}Renews {new Date(subscriptionEnd).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              <Settings className="h-4 w-4 mr-1" />
              {portalLoading ? "Loading..." : "Manage Subscription"}
            </Button>
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

      <div className="mt-12 text-left">
        <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-2">
          One-Time Alert Boosts
        </h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          Not ready for Premium? Give a single lost pet report extra reach.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {BOOSTS.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.id} className="border-accent/20 hover:border-accent/50 transition-colors">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="font-heading font-bold text-lg text-foreground">{b.name}</h3>
                  </div>
                  <div className="mb-3">
                    <span className="text-3xl font-extrabold font-heading text-foreground">{b.price}</span>
                    <span className="text-muted-foreground text-sm"> one-time</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{b.description}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {b.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-found mt-0.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => handleBuyBoost(b.priceId, b.id)}
                    disabled={boostLoading === b.id}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {boostLoading === b.id ? "Loading..." : `Buy ${b.price} Boost`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
