import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Plus, AlertTriangle, CheckCircle2, Heart, Loader2, Share2, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

type LostPet = {
  id: string; pet_name: string; species: string; breed: string | null;
  status: string; date_lost: string; photos: string[] | null;
  contact_name: string; description: string | null; last_seen_address: string | null;
};

type FoundPet = {
  id: string; species: string; breed: string | null; color: string;
  status: string; date_found: string; photos: string[] | null;
  description: string | null; found_address: string | null;
};

export default function MyPetsPage() {
  const { user } = useAuth();
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [foundPets, setFoundPets] = useState<FoundPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      supabase.from("lost_pets")
        .select("id, pet_name, species, breed, status, date_lost, photos, contact_name, description, last_seen_address")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("found_pets")
        .select("id, species, breed, color, status, date_found, photos, description, found_address")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([lostRes, foundRes]) => {
      setLostPets(lostRes.data || []);
      setFoundPets(foundRes.data || []);
      setLoading(false);
    });
  }, [user]);

  const handleMarkReunited = async (petId: string) => {
    const { error } = await supabase.functions.invoke("mark-reunited", { body: { pet_id: petId } });
    if (error) toast.error("Failed to mark reunited");
    else { toast.success("Pet marked as reunited! 🎉"); setLostPets((prev) => prev.map((p) => (p.id === petId ? { ...p, status: "reunited" } : p))); }
  };

  const generateFlyer = async (pet: LostPet) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-flyer", {
        body: { pet_name: pet.pet_name, species: pet.species, breed: pet.breed, color: "", description: pet.description, last_seen_address: pet.last_seen_address, contact_name: pet.contact_name, photo_url: pet.photos?.[0] || null, pet_id: pet.id },
      });
      if (error || !data?.html) { toast.error("Failed to generate flyer"); return; }
      const w = window.open("", "_blank");
      if (w) { w.document.write(data.html); w.document.close(); }
    } catch { toast.error("Failed to generate flyer"); }
  };

  const sharePet = (id: string, name: string, species: string, address: string | null, type: "lost" | "found") => {
    const url = `${window.location.origin}/pet/${id}${type === "found" ? "?type=found" : ""}`;
    const text = type === "lost"
      ? `🚨 LOST PET: ${name} (${species}) — ${address || "Unknown location"}. Please help! #LostFurryFriendAlerts`
      : `✅ FOUND PET: ${species} — ${address || "Unknown location"}. #LostFurryFriendAlerts`;
    navigator.share?.({ text, url }).catch(() => { navigator.clipboard.writeText(`${text}\n${url}`); toast.success("Copied to clipboard!"); });
  };

  if (!user) {
    return (
      <div className="page-container max-w-3xl text-center py-20">
        <PawPrint className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Sign in to view your pets.</p>
        <Button asChild variant="hero"><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0"><PawPrint className="inline h-7 w-7 text-primary mr-2" />My Pets</h1>
        <Button asChild variant="hero" className="rounded-xl"><Link to="/report-lost"><Plus className="h-4 w-4 mr-1" /> Report Lost Pet</Link></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : lostPets.length === 0 && foundPets.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <PawPrint className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No pets registered yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {lostPets.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-lost" /> Lost Pet Reports
              </h2>
              <div className="space-y-3">
                {lostPets.map((pet) => {
                  const photo = pet.photos?.[0];
                  const statusIcon = pet.status === "lost" ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Heart className="h-3 w-3 mr-1" />;
                  return (
                    <Link key={pet.id} to={`/pet/${pet.id}`}>
                      <Card className="card-hover">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {photo ? <img src={photo} alt={pet.pet_name} className="h-full w-full object-cover" /> : <PawPrint className="h-6 w-6 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading font-bold text-foreground">{pet.pet_name}</h3>
                            <p className="text-sm text-muted-foreground">{pet.breed ? `${pet.breed} · ` : ""}{pet.species}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2" onClick={(e) => e.preventDefault()}>
                            <Badge variant={pet.status === "lost" ? "destructive" : "default"} className={pet.status === "reunited" ? "bg-found text-primary-foreground" : ""}>{statusIcon}{pet.status}</Badge>
                            <p className="text-xs text-muted-foreground">{format(new Date(pet.date_lost), "MMM d, yyyy")}</p>
                            <div className="flex gap-1">
                              {pet.status === "lost" && (
                                <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.preventDefault(); handleMarkReunited(pet.id); }}>
                                  <Heart className="h-3 w-3 mr-1" /> Reunited
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.preventDefault(); sharePet(pet.id, pet.pet_name, pet.species, pet.last_seen_address, "lost"); }}>
                                <Share2 className="h-3 w-3" />
                              </Button>
                              {pet.status === "lost" && (
                                <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.preventDefault(); generateFlyer(pet); }}>
                                  <FileDown className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {foundPets.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-found" /> Found Pet Reports
              </h2>
              <div className="space-y-3">
                {foundPets.map((pet) => {
                  const photo = pet.photos?.[0];
                  return (
                    <Link key={pet.id} to={`/pet/${pet.id}?type=found`}>
                      <Card className="card-hover">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {photo ? <img src={photo} alt={pet.species} className="h-full w-full object-cover" /> : <PawPrint className="h-6 w-6 text-found" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading font-bold text-foreground">Found {pet.species}</h3>
                            <p className="text-sm text-muted-foreground">{pet.color}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2" onClick={(e) => e.preventDefault()}>
                            <Badge className="bg-found text-primary-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />{pet.status}</Badge>
                            <p className="text-xs text-muted-foreground">{format(new Date(pet.date_found), "MMM d, yyyy")}</p>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => { e.preventDefault(); sharePet(pet.id, pet.species, pet.species, pet.found_address, "found"); }}>
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
