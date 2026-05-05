import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Prefs = {
  lost_nearby: boolean;
  found_nearby: boolean;
  sighting_nearby: boolean;
  pet_match: boolean;
  new_message: boolean;
  approval: boolean;
};

const DEFAULT_PREFS: Prefs = {
  lost_nearby: true,
  found_nearby: true,
  sighting_nearby: true,
  pet_match: true,
  new_message: true,
  approval: true,
};

const PREF_LABELS: { key: keyof Prefs; label: string }[] = [
  { key: "lost_nearby", label: "Lost pet near you" },
  { key: "found_nearby", label: "Found pet near you" },
  { key: "sighting_nearby", label: "Sighting near you" },
  { key: "pet_match", label: "Match found for your pet" },
  { key: "new_message", label: "New message received" },
  { key: "approval", label: "Shelter/Volunteer approval" },
];

export default function NotificationSettingsPage() {
  const { user, isPremium } = useAuth();
  const [radius, setRadius] = useState(5);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("alert_radius_miles, notification_prefs")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRadius(data.alert_radius_miles || 5);
          if (data.notification_prefs) {
            setPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs as Partial<Prefs>) });
          }
        }
        setLoading(false);
      });
  }, [user]);

  const togglePref = (key: keyof Prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ alert_radius_miles: radius, notification_prefs: prefs })
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Notification settings saved!");
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="page-container text-center py-20">
        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Sign in to manage notifications.</p>
        <Button asChild variant="hero"><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="page-title mb-0">Notification Settings</h1>
          <p className="text-sm text-muted-foreground">Control how you receive alerts.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Alert Radius</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Receive alerts for lost and found pets within this distance.
              {!isPremium && " Upgrade to Premium for up to 25 miles."}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Radius: <strong>{radius} miles</strong></span>
                <span className="text-muted-foreground">Max: {isPremium ? "25" : "10"} miles</span>
              </div>
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={1}
                max={isPremium ? 25 : 10}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Alert Types</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {PREF_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`pref-${key}`} className="text-sm text-foreground cursor-pointer">{label}</Label>
                <Switch
                  id={`pref-${key}`}
                  checked={prefs[key]}
                  onCheckedChange={() => togglePref(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl py-5" size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
