import { useState } from "react";
import { Search, X, AlertTriangle, CheckCircle2, Eye, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Result = { id: string; type: string; title: string; subtitle: string; link: string };

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const doSearch = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const term = `%${q}%`;

    const [lost, found, shelters] = await Promise.all([
      supabase.from("lost_pets").select("id, pet_name, species, breed").ilike("pet_name", term).limit(5),
      supabase.from("found_pets").select("id, species, breed, color").or(`species.ilike.${term},color.ilike.${term},breed.ilike.${term}`).limit(5),
      supabase.from("shelters").select("id, name, address").ilike("name", term).eq("approved", true).limit(5),
    ]);

    const r: Result[] = [];
    (lost.data || []).forEach((p) => r.push({ id: p.id, type: "lost", title: `🚨 ${p.pet_name}`, subtitle: `${p.species}${p.breed ? ` • ${p.breed}` : ""}`, link: "/my-pets" }));
    (found.data || []).forEach((p) => r.push({ id: p.id, type: "found", title: `✅ Found ${p.species}`, subtitle: `${p.color}${p.breed ? ` • ${p.breed}` : ""}`, link: "/report-found" }));
    (shelters.data || []).forEach((s) => r.push({ id: s.id, type: "shelter", title: s.name, subtitle: s.address, link: "/shelters" }));

    setResults(r);
    setSearching(false);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    setOpen(v.length >= 2);
    doSearch(v);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pets, shelters..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-9 pr-8"
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && (
        <Card className="absolute top-full mt-1 w-full z-50 shadow-lg max-h-72 overflow-y-auto">
          <CardContent className="p-2">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{searching ? "Searching..." : "No results found"}</p>
            ) : (
              results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.link}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
