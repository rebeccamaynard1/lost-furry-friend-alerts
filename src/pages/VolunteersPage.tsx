import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, Plus, Loader2, Wrench, Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Pagination from "@/components/Pagination";
import CountyPicker from "@/components/CountyPicker";

type Volunteer = {
  id: string;
  name: string;
  county: string | null;
  phone: string | null;
  email: string | null;
  skills: string | null;
  availability: string | null;
  created_at?: string;
};

const PAGE_SIZE = 12;

export default function VolunteersPage() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", county: "", phone: "", email: "", skills: "", availability: "" });
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "name">("newest");
  const [page, setPage] = useState(1);

  const load = () => {
    supabase.from("volunteers").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setVolunteers((data as Volunteer[]) || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("volunteers").insert({
      user_id: user.id,
      name: form.name,
      county: form.county || null,
      phone: form.phone || null,
      email: form.email || null,
      skills: form.skills || null,
      availability: form.availability || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("You're now a volunteer! 🎉");
      setOpen(false);
      setForm({ name: "", county: "", phone: "", email: "", skills: "", availability: "" });
      load();
    }
    setSubmitting(false);
  };

  const counties = useMemo(() => {
    const set = new Set<string>();
    volunteers.forEach((v) => { if (v.county) set.add(v.county); });
    return Array.from(set).sort();
  }, [volunteers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = volunteers.filter((v) => {
      const matchSearch = !q || v.name.toLowerCase().includes(q) || (v.skills?.toLowerCase().includes(q) ?? false);
      const matchCounty = !countyFilter || v.county === countyFilter;
      return matchSearch && matchCounty;
    });
    list = [...list].sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return list;
  }, [volunteers, search, countyFilter, sortOrder]);

  useEffect(() => { setPage(1); }, [search, countyFilter, sortOrder]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-container">
      <SEO title="Volunteers — Lost Furry Friend Alerts" description="Meet the volunteers helping reunite lost pets with their families. Join the community today." />
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
              <CountyPicker value={form.county} onChange={(v) => setForm({ ...form, county: v })} placeholder="Select your county *" />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Skills (e.g. Drone Pilot, Trapping)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <Input placeholder="Availability (e.g. Weekends, Evenings)" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
              <Button onClick={handleRegister} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Register
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or skills..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)}>
          <option value="">All Counties</option>
          {counties.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "name")}>
          <option value="newest">Newest first</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{volunteers.length === 0 ? "No volunteers yet. Be the first!" : "No matches found."}</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((v) => (
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
                    {v.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{v.email}</p>}
                    {v.availability && <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{v.availability}</p>}
                    {v.skills && <p className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5" />{v.skills}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
