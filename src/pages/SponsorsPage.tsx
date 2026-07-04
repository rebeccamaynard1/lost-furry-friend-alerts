import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Globe, Crown, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Pagination from "@/components/Pagination";

const SPONSOR_PAGE_SIZE = 12;

type Sponsor = {
  id: string;
  business_name: string;
  logo: string | null;
  website: string | null;
  tier: string | null;
  email: string | null;
};

const tierColor: Record<string, string> = {
  platinum: "bg-primary text-primary-foreground",
  gold: "bg-accent text-accent-foreground",
  silver: "bg-muted text-foreground",
  bronze: "bg-sighting/20 text-sighting",
};

const tierBenefits: Record<string, string[]> = {
  bronze: ["Logo on sponsors page", "Link to your website"],
  silver: ["Everything in Bronze", "Social media shoutout", "Logo on monthly newsletter"],
  gold: ["Everything in Silver", "Featured sponsor badge", "Logo on homepage"],
  platinum: ["Everything in Gold", "Top placement everywhere", "Custom co-branded campaign", "Direct shelter partnership"],
};

export default function SponsorsPage() {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ business_name: "", website: "", tier: "bronze", email: "" });
  const [tierFilter, setTierFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase.from("sponsors_public" as any).select("id, business_name, logo, website, tier").order("created_at").then(({ data }) => {
      setSponsors(data || []);
      setLoading(false);
    });
  }, []);

  const handleRegister = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.business_name) { toast.error("Business name is required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("sponsors").insert({
      user_id: user.id,
      business_name: form.business_name,
      website: form.website || null,
      email: form.email || null,
      tier: form.tier,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Sponsor application submitted! Pending admin approval.");
      setOpen(false);
      setForm({ business_name: "", website: "", tier: "bronze", email: "" });
    }
    setSubmitting(false);
  };

  const filteredSponsors = useMemo(
    () => (tierFilter ? sponsors.filter((s) => s.tier === tierFilter) : sponsors),
    [sponsors, tierFilter]
  );
  useEffect(() => { setPage(1); }, [tierFilter]);
  const pagedSponsors = filteredSponsors.slice((page - 1) * SPONSOR_PAGE_SIZE, page * SPONSOR_PAGE_SIZE);

  return (
    <div className="page-container">
      <SEO title="Our Sponsors — Lost Furry Friend Alerts" description="Businesses helping pets get home. Become a sponsor and support our nationwide pet recovery network." />
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0"><Megaphone className="inline h-7 w-7 text-accent mr-2" />Our Sponsors</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Become a Sponsor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Sponsor Application</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Business Name *" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRegister} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-muted-foreground mb-6">Businesses helping pets get home.</p>

      {/* Sponsor Tiers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => (
          <Card key={tier} className={`card-hover ${tier === "platinum" ? "border-primary shadow-lg" : ""}`}>
            <CardContent className="p-5">
              <Badge className={`mb-3 ${tierColor[tier]}`}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
              <h3 className="font-heading font-bold text-foreground mb-2">{tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsor</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                {tierBenefits[tier].map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <Crown className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Sponsors */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold font-heading text-foreground">Current Sponsors</h2>
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="">All Tiers</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredSponsors.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{sponsors.length === 0 ? "No sponsors yet. Be the first!" : "No sponsors match this tier."}</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pagedSponsors.map((s) => (
              <Card key={s.id} className="card-hover">
                <CardContent className="p-5 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {s.logo ? <img src={s.logo} alt={s.business_name} className="h-full w-full object-cover" /> : <Megaphone className="h-7 w-7 text-primary" />}
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{s.business_name}</h3>
                  {s.tier && <Badge className={`mt-2 ${tierColor[s.tier] || "bg-secondary text-secondary-foreground"}`}>{s.tier.charAt(0).toUpperCase() + s.tier.slice(1)}</Badge>}
                  {s.website && (
                    <a href={s.website.startsWith("http") ? s.website : `https://${s.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1 hover:text-primary">
                      <Globe className="h-3 w-3" />{s.website}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={SPONSOR_PAGE_SIZE} total={filteredSponsors.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
