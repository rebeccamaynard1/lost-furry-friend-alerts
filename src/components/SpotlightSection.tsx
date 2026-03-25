import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, AlertTriangle, Heart, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SpotlightData = {
  missingPet: { pet_name: string; species: string; breed: string | null; photos: string[] | null } | null;
  reunitedPet: { pet_name: string; species: string; photos: string[] | null } | null;
  shelter: { name: string; address: string } | null;
  volunteer: { name: string; county: string | null } | null;
};

export default function SpotlightSection() {
  const [data, setData] = useState<SpotlightData>({ missingPet: null, reunitedPet: null, shelter: null, volunteer: null });

  useEffect(() => {
    async function fetch() {
      // Use week number as seed for consistent weekly rotation
      const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

      const [lost, reunited, shelters, vols] = await Promise.all([
        supabase.from("lost_pets").select("pet_name, species, breed, photos").eq("status", "lost").limit(20),
        supabase.from("lost_pets").select("pet_name, species, photos").eq("status", "reunited").limit(20),
        supabase.from("shelters").select("name, address").eq("approved", true).limit(20),
        supabase.from("volunteers").select("name, county").limit(20),
      ]);

      const pick = <T,>(arr: T[] | null) => arr && arr.length > 0 ? arr[weekNum % arr.length] : null;

      setData({
        missingPet: pick(lost.data),
        reunitedPet: pick(reunited.data),
        shelter: pick(shelters.data),
        volunteer: pick(vols.data),
      });
    }
    fetch();
  }, []);

  const items = [
    { label: "Missing Pet Spotlight", icon: AlertTriangle, color: "text-lost", bg: "bg-lost/10", data: data.missingPet ? `${data.missingPet.pet_name} — ${data.missingPet.species}` : null, photo: data.missingPet?.photos?.[0] },
    { label: "Happy Reunion", icon: Heart, color: "text-found", bg: "bg-found/10", data: data.reunitedPet ? `${data.reunitedPet.pet_name} is home! 🎉` : null, photo: data.reunitedPet?.photos?.[0] },
    { label: "Shelter Spotlight", icon: Building2, color: "text-shelter", bg: "bg-shelter/10", data: data.shelter ? `${data.shelter.name}` : null },
    { label: "Volunteer of the Week", icon: Users, color: "text-volunteer", bg: "bg-volunteer/10", data: data.volunteer ? `${data.volunteer.name}${data.volunteer.county ? ` — ${data.volunteer.county}` : ""}` : null },
  ].filter((i) => i.data);

  if (items.length === 0) return null;

  return (
    <section className="py-10 bg-secondary/30">
      <div className="page-container">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Star className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold font-heading text-foreground">Spotlight of the Week</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="card-hover">
                <CardContent className="p-5 text-center">
                  {item.photo && (
                    <img src={item.photo} alt={item.label} className="mx-auto mb-3 h-20 w-20 rounded-full object-cover border-2 border-border" />
                  )}
                  <div className={`inline-flex rounded-full p-2 ${item.bg} mb-2`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <Badge variant="outline" className="block mb-2 text-xs">{item.label}</Badge>
                  <p className="font-heading font-bold text-foreground text-sm">{item.data}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
