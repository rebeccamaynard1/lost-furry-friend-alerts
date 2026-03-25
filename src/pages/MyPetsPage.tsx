import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Plus, AlertTriangle, CheckCircle2, Heart, Loader2, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

type Pet = {
  id: string; pet_name: string; species: string; breed: string | null;
  status: string; date_lost: string; photos: string[] | null;
  contact_name: string; description: string | null; last_seen_address: string | null;
};

export default function MyPetsPage() {
  const { user } = useAuth();
  const [lostPets, setLostPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("lost_pets")
      .select("id, pet_name, species, breed, status, date_lost, photos, contact_name, description, last_seen_address")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setLostPets(data || []); setLoading(false); });
  }, [user]);

  const handleMarkReunited = async (petId: string) => {
    const { error } = await supabase.functions.invoke("mark-reunited", { body: { pet_id: petId } });
    if (error) toast.error("Failed to mark reunited");
    else { toast.success("Pet marked as reunited! 🎉"); setLostPets((prev) => prev.map((p) => (p.id === petId ? { ...p, status: "reunited" } : p))); }
  };

  const sharePet = (pet: Pet) => {
    const text = `🚨 LOST PET: ${pet.pet_name} (${pet.species}) — ${pet.last_seen_address || "Unknown location"}. Please help! #FurBabiesLostAndFound`;
    navigator.share?.({ text, url: window.location.href }).catch(() => { navigator.clipboard.writeText(text); toast.success("Copied to clipboard!"); });
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
      ) : lostPets.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <PawPrint className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No pets registered yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {lostPets.map((pet) => {
            const photo = pet.photos?.[0];
            const statusIcon = pet.status === "lost" ? <AlertTriangle className="h-3 w-3 mr-1" /> : pet.status === "reunited" ? <Heart className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />;
            return (
              <Card key={pet.id} className="card-hover">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {photo ? <img src={photo} alt={pet.pet_name} className="h-full w-full object-cover" /> : <PawPrint className="h-6 w-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-foreground">{pet.pet_name}</h3>
                    <p className="text-sm text-muted-foreground">{pet.breed ? `${pet.breed} · ` : ""}{pet.species}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge variant={pet.status === "lost" ? "destructive" : "default"} className={pet.status === "reunited" ? "bg-found text-primary-foreground" : ""}>{statusIcon}{pet.status}</Badge>
                    <p className="text-xs text-muted-foreground">{format(new Date(pet.date_lost), "MMM d, yyyy")}</p>
                    <div className="flex gap-1">
                      {pet.status === "lost" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleMarkReunited(pet.id)}>
                          <Heart className="h-3 w-3 mr-1" /> Reunited
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => sharePet(pet)}>
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
