import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Phone, Globe, CheckCircle2, Loader2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Pagination from "@/components/Pagination";

type Shelter = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  approved: boolean | null;
  created_at?: string;
};

const PAGE_SIZE = 12;

export default function SheltersPage() {
  const { user } = useAuth();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", website: "" });
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "newest">("name");
  const [page, setPage] = useState(1);

  const load = () => {
    supabase.from("shelters").select("*").eq("approved", true).order("name").then(({ data }) => {
      setShelters((data as Shelter[]) || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!form.name || !form.address) { toast.error("Name and address are required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("shelters").insert({
      user_id: user.id,
      name: form.name,
      address: form.address,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Shelter registered! Pending admin approval.");
      setOpen(false);
      setForm({ name: "", address: "", phone: "", email: "", website: "" });
    }
    setSubmitting(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = shelters.filter((s) =>
      !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [shelters, search, sortOrder]);

  useEffect(() => { setPage(1); }, [search, sortOrder]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-container">
      <SEO title="Shelters & Rescues — Lost Furry Friend Alerts" description="Find verified animal shelters and rescues helping reunite lost pets with their families." />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="page-title mb-0">
          <Building2 className="inline h-7 w-7 text-shelter mr-2" />Shelters & Rescues
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Register Shelter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Register Your Shelter</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Shelter Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <Button onClick={handleRegister} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Register Shelter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or address..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "name" | "newest")}>
          <option value="name">Name (A–Z)</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{shelters.length === 0 ? "No approved shelters yet." : "No matches found."}</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((s) => (
              <Card key={s.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-heading font-bold text-foreground">{s.name}</h3>
                    <Badge className="bg-found text-primary-foreground text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{s.address}</p>
                    {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.phone}</p>}
                    {s.website && (
                      <a href={s.website.startsWith("http") ? s.website : `https://${s.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="h-3.5 w-3.5" />{s.website}
                      </a>
                    )}
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
