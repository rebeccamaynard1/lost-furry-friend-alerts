import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Phone, Mail, MessageCircle, Share2, Loader2, Dog, Cat } from "lucide-react";
import { format } from "date-fns";

type PetDetail = {
  id: string;
  pet_name: string;
  species: string;
  breed: string | null;
  color: string;
  age: string | null;
  gender: string | null;
  microchip: string | null;
  date_lost: string;
  last_seen_address: string | null;
  description: string | null;
  photos: string[] | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  status: string;
  user_id: string;
  created_at: string;
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("lost_pets")
        .select("id, pet_name, species, breed, color, age, gender, microchip, date_lost, last_seen_address, description, photos, contact_name, contact_phone, contact_email, status, user_id, created_at")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Pet not found");
        navigate("/");
      } else {
        setPet(data);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleContact = () => {
    if (!user) {
      toast.error("Please sign in to send a message");
      navigate("/login");
      return;
    }
    if (pet) {
      navigate(`/messages?to=${pet.user_id}`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Lost Pet: ${pet?.pet_name}`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) return null;

  const statusColor = pet.status === "lost" ? "destructive" : pet.status === "reunited" ? "default" : "secondary";
  const SpeciesIcon = pet.species?.toLowerCase() === "cat" ? Cat : Dog;

  return (
    <div className="page-container max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Photo gallery */}
      {pet.photos && pet.photos.length > 0 && (
        <div className="mb-6">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-2">
            <img src={pet.photos[activePhoto]} alt={pet.pet_name} className="w-full h-full object-cover" />
          </div>
          {pet.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {pet.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === activePhoto ? "border-primary" : "border-transparent"}`}
                >
                  <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SpeciesIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading text-foreground">{pet.pet_name}</h1>
            <Badge variant={statusColor} className="capitalize">{pet.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {[pet.species, pet.breed, pet.color, pet.age, pet.gender].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Details</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Lost on {format(new Date(pet.date_lost), "MMMM d, yyyy")}
            </div>
            {pet.last_seen_address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {pet.last_seen_address}
              </div>
            )}
            {pet.microchip && (
              <p className="text-sm text-muted-foreground">Microchip: {pet.microchip}</p>
            )}
            {pet.description && (
              <p className="text-sm text-foreground mt-2">{pet.description}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Contact</h2>
            <p className="text-sm text-foreground font-medium">{pet.contact_name}</p>
            <a href={`tel:${pet.contact_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="h-4 w-4" />
              {pet.contact_phone}
            </a>
            {pet.contact_email && (
              <a href={`mailto:${pet.contact_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" />
                {pet.contact_email}
              </a>
            )}
            {user && user.id !== pet.user_id && (
              <Button variant="hero" className="w-full mt-2" onClick={handleContact}>
                <MessageCircle className="h-4 w-4 mr-2" /> Send Message
              </Button>
            )}
            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Sign in</Link> to send a message
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Reported on {format(new Date(pet.created_at), "MMMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  );
}
