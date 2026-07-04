import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Upload, Loader2, Search, Phone, Mail, Globe, MapPin, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 18;

type Partner = {
  id: string;
  name: string;
  type: string;
  county: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
};

const PARTNER_TYPES = [
  "rescue", "vet", "shelter", "hospital", "animal control", "foster group", "rural partner",
];

const typeColor: Record<string, string> = {
  rescue: "bg-found/10 text-found",
  vet: "bg-primary/10 text-primary",
  shelter: "bg-shelter/10 text-shelter",
  hospital: "bg-lost/10 text-lost",
  "animal control": "bg-sighting/10 text-sighting",
  "foster group": "bg-accent/10 text-accent",
  "rural partner": "bg-volunteer/10 text-volunteer",
};

export default function AlabamaPartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "county">("name");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPartners();
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
        .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
    }
  }, [user]);

  const loadPartners = async () => {
    // Signed-in users see full contact details; anon calls the safe RPC that omits email/phone.
    if (user) {
      const { data } = await supabase
        .from("alabama_partners")
        .select("id, name, type, county, email, phone, website")
        .order("name");
      setPartners(((data as any) || []) as Partner[]);
    } else {
      const { data } = await supabase.rpc("get_public_alabama_partners" as any);
      const sorted = ((data as any[]) || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setPartners(sorted as Partner[]);
    }
    setLoading(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      toast.error("CSV must have a header row and at least one data row.");
      setUploading(false);
      return;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
    const nameIdx = header.indexOf("name");
    const typeIdx = header.indexOf("type");
    const countyIdx = header.indexOf("county");
    const emailIdx = header.indexOf("email");
    const phoneIdx = header.indexOf("phone");
    const websiteIdx = header.indexOf("website");

    if (nameIdx === -1) {
      toast.error("CSV must have a 'name' column.");
      setUploading(false);
      return;
    }

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = cols[nameIdx];
      if (!name) continue;
      rows.push({
        name,
        type: (typeIdx !== -1 ? cols[typeIdx] : "rescue") || "rescue",
        county: countyIdx !== -1 ? cols[countyIdx] || null : null,
        email: emailIdx !== -1 ? cols[emailIdx] || null : null,
        phone: phoneIdx !== -1 ? cols[phoneIdx] || null : null,
        website: websiteIdx !== -1 ? cols[websiteIdx] || null : null,
      });
    }

    if (rows.length === 0) {
      toast.error("No valid rows found in CSV.");
      setUploading(false);
      return;
    }

    const { error } = await supabase.from("alabama_partners").insert(rows);
    if (error) {
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`Imported ${rows.length} Alabama partners!`);
      loadPartners();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deletePartner = async (id: string) => {
    const { error } = await supabase.from("alabama_partners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Partner removed");
      setPartners((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const counties = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => { if (p.county) set.add(p.county); });
    return Array.from(set).sort();
  }, [partners]);

  const filtered = useMemo(() => {
    let list = partners.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.county && p.county.toLowerCase().includes(search.toLowerCase()));
      const matchType = !typeFilter || p.type === typeFilter;
      const matchCounty = !countyFilter || p.county === countyFilter;
      return matchSearch && matchType && matchCounty;
    });
    list = [...list].sort((a, b) => {
      if (sortOrder === "county") {
        return (a.county || "").localeCompare(b.county || "") || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [partners, search, typeFilter, countyFilter, sortOrder]);

  useEffect(() => { setPage(1); }, [search, typeFilter, countyFilter, sortOrder]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-container">
      <SEO title="Alabama Pet Partners — Lost Furry Friend Alerts" description="Directory of Alabama rescues, vets, shelters, hospitals, and animal control to help find lost pets." />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="page-title mb-0">
          <Building2 className="inline h-7 w-7 text-primary mr-2" />
          Alabama Partners
        </h1>
        {isAdmin && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button
              variant="hero"
              className="rounded-xl"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? "Importing..." : "Import CSV"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Rescues, vets, shelters, hospitals, animal control, foster groups, and rural partners across Alabama.
        {isAdmin && " Upload a CSV with columns: name, type, county, email, phone, website."}
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or county..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {PARTNER_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={countyFilter}
          onChange={(e) => setCountyFilter(e.target.value)}
        >
          <option value="">All Counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "name" | "county")}
        >
          <option value="name">Sort: Name</option>
          <option value="county">Sort: County</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {partners.length === 0 ? "No Alabama partners yet. Import a CSV to get started." : "No matches found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((p) => (
            <Card key={p.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-bold text-foreground text-sm">{p.name}</h3>
                  {isAdmin && (
                    <button onClick={() => deletePartner(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Badge className={`text-xs mb-3 ${typeColor[p.type] || "bg-secondary text-secondary-foreground"}`}>
                  {p.type}
                </Badge>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {p.county && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{p.county}</p>}
                  {p.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.phone}</p>}
                  {p.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{p.email}</p>}
                  {p.website && (
                    <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                      <Globe className="h-3 w-3" />{p.website}
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
