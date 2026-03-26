import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/littlefoot-logo-1.png";

const amounts = [5, 10, 25, 50, 100];

export default function DonatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!user) {
      toast.error("Please sign in to donate.");
      navigate("/login");
      return;
    }

    const amount = selected || (custom ? parseInt(custom) : 0);
    if (!amount || amount < 1) {
      toast.error("Please select or enter an amount.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: { amount: amount * 100 }, // Convert to cents
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Donation failed: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  };

  return (
    <div className="page-container max-w-2xl text-center">
      <img src={logo} alt="Little Foot" className="mx-auto mb-4 h-20 w-20 object-contain" />
      <h1 className="page-title">
        <Heart className="inline h-7 w-7 text-lost mr-2" />
        Donate
      </h1>
      <p className="text-muted-foreground mb-8">
        Your donation helps keep Lost Furry Friend Alerts free for every family.
        100% goes toward alerts, server costs, and community support.
      </p>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-heading font-bold text-lg mb-4 text-foreground">Choose an amount</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            {amounts.map((a) => (
              <Button
                key={a}
                variant={selected === a ? "hero" : "outline"}
                className="text-lg font-bold py-6 rounded-xl transition-colors"
                onClick={() => { setSelected(a); setCustom(""); }}
              >
                ${a}
              </Button>
            ))}
          </div>
          <div className="mb-6">
            <input
              type="number"
              min="1"
              placeholder="Custom amount ($)"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
            />
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full rounded-xl py-6 text-lg"
            onClick={handleDonate}
            disabled={loading}
          >
            <Heart className="h-5 w-5 mr-2" />
            {loading ? "Processing..." : "Donate Now"}
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
