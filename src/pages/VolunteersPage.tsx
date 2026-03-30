import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, Plus, Loader2, Wrench, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Volunteer = {
  id: string;
  name: string;
  county: string | null;
  phone: string | null;
  skills: string | null;
  availability: string | null;
};

export default function VolunteersPage() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", county: "", phone: "", skills: "", availability: "" });

  useEffect(() => {
    supabase.from("volunteers").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setVolunteers(data || []);
      setLoading(false);
    });
  }, []);

  const handleRegister = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("volunteers").insert({
      user_id: user.id,
      name: form.name,
      county: form.county || null,
      phone: form.phone || null,
      skills: form.skills || null,
      availability: form.availability || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("You're now a volunteer! 🎉");
      setOpen(false);
      setForm({ name: "", county: "", phone: "", skills: "", availability: "" });
      supabase.from("volunteers").select("*").order("created_at", { ascending: false }).then(({ data }) => setVolunteers(data || []));
    }
    setSubmitting(false);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0"><Users className="inline h-7 w-7 text-volunteer mr-2" />Volunteers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Join as Volunteer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Volunteer Registration</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Your Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="County (e.g. Travis County, TX)" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Skills (e.g. Drone Pilot, Trapping)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <Input placeholder="Availability (e.g. Weekends, Evenings)" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
              <Button onClick={handleRegister} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Register
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : volunteers.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No volunteers yet. Be the first!</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volunteers.map((v) => (
            <Card key={v.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-volunteer/10 flex items-center justify-center">
                    <span className="font-bold text-volunteer">{v.name[0]}</span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{v.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {v.county && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{v.county}</p>}
                  {v.availability && <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{v.availability}</p>}
                  {v.skills && <p className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5" />{v.skills}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
