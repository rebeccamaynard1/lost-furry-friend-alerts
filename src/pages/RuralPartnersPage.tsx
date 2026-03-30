import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TreePine, MapPin, Camera, Plus, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Partner = {
  id: string;
  name: string;
  county: string | null;
  hunting_area: string | null;
  email: string | null;
  trail_cam_uploads: string[] | null;
};

export default function RuralPartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", county: "", hunting_area: "", email: "" });

  useEffect(() => {
    supabase.from("rural_partners").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setPartners(data || []);
      setLoading(false);
    });
  }, []);

  const handleRegister = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("rural_partners").insert({
      user_id: user.id,
      name: form.name,
      county: form.county || null,
      hunting_area: form.hunting_area || null,
      email: form.email || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Registered as rural partner! 🌲");
      setOpen(false);
      setForm({ name: "", county: "", hunting_area: "" });
      supabase.from("rural_partners").select("*").order("created_at", { ascending: false }).then(({ data }) => setPartners(data || []));
    }
    setSubmitting(false);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0"><TreePine className="inline h-7 w-7 text-found mr-2" />Rural Partners</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Join</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Join as Rural Partner</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Your Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="County" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
              <Input placeholder="Hunting Area / Region" value={form.hunting_area} onChange={(e) => setForm({ ...form, hunting_area: e.target.value })} />
              <Button onClick={handleRegister} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Register
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-muted-foreground mb-6">Hunters and rural community members helping track lost pets in remote areas.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : partners.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <TreePine className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No rural partners yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {partners.map((p) => (
            <Card key={p.id} className="card-hover">
              <CardContent className="p-5">
                <h3 className="font-heading font-bold text-foreground mb-2">{p.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {p.county && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{p.county}</p>}
                  {p.hunting_area && <p className="flex items-center gap-2"><TreePine className="h-3.5 w-3.5" />{p.hunting_area}</p>}
                  <p className="flex items-center gap-2"><Camera className="h-3.5 w-3.5" />{p.trail_cam_uploads?.length || 0} trail cam uploads</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
