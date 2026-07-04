import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Phone, Mail, MessageCircle, Share2, Loader2, Dog, Cat, Printer } from "lucide-react";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import ShareButtons from "@/components/ShareButtons";
import { QRCodeSVG } from "qrcode.react";
import { openFlyer } from "@/lib/flyer";

type PetDetail = {
  id: string;
  pet_name?: string;
  species: string;
  breed: string | null;
  color: string;
  age?: string | null;
  gender?: string | null;
  microchip?: string | null;
  date_lost?: string;
  date_found?: string;
  last_seen_address?: string | null;
  found_address?: string | null;
  holding_location?: string | null;
  description: string | null;
  photos: string[] | null;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string | null;
  status: string;
  user_id: string;
  created_at: string;
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "lost";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [resolvedType, setResolvedType] = useState<"lost" | "found">(initialType === "found" ? "found" : "lost");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setNotFound(false);

      const fetchLost = async () => {
        const { data } = await supabase
          .from("lost_pets")
          .select("id, pet_name, species, breed, color, age, gender, microchip, date_lost, last_seen_address, description, photos, status, user_id, created_at")
          .eq("id", id)
          .maybeSingle();
        return data;
      };
      const fetchFound = async () => {
        const { data } = await supabase
          .from("found_pets")
          .select("id, species, breed, color, date_found, found_address, holding_location, description, photos, status, user_id, created_at")
          .eq("id", id)
          .maybeSingle();
        return data;
      };

      // Try requested type first, then fall back to the other table so shared
      // links / QR codes without a ?type= param still resolve for anyone.
      const first = initialType === "found" ? fetchFound : fetchLost;
      const second = initialType === "found" ? fetchLost : fetchFound;
      let data = await first();
      let type: "lost" | "found" = initialType === "found" ? "found" : "lost";
      if (!data) {
        data = await second();
        if (data) type = initialType === "found" ? "lost" : "found";
      }

      if (!data) {
        setPet(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setResolvedType(type);

      if (type === "lost") {
        const { data: contact } = await supabase
          .from("lost_pet_contacts")
          .select("contact_name, contact_phone, contact_email")
          .eq("pet_id", id)
          .maybeSingle();
        setPet({
          ...(data as PetDetail),
          contact_name: contact?.contact_name,
          contact_phone: contact?.contact_phone,
          contact_email: contact?.contact_email ?? null,
        });
      } else {
        setPet(data as PetDetail);
      }
      setLoading(false);
    })();
  }, [id, initialType]);

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


  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) return null;

  const isLost = petType !== "found";
  const displayName = pet.pet_name || `Found ${pet.species}`;
  const dateLabel = isLost ? "Lost" : "Found";
  const dateValue = pet.date_lost || pet.date_found;
  const address = pet.last_seen_address || pet.found_address;
  const statusColor = pet.status === "lost" ? "destructive" : pet.status === "reunited" ? "default" : "secondary";
  const SpeciesIcon = pet.species?.toLowerCase() === "cat" ? Cat : Dog;

  return (
    <div className="page-container max-w-3xl">
      <SEO title={`${(pet as any).pet_name || (pet as any).species || "Pet"} — Lost Furry Friend Alerts`} description={(pet as any).description?.slice(0, 150) || "Pet report on Lost Furry Friend Alerts. Help reunite this pet with their family."} />
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Photo gallery */}
      {pet.photos && pet.photos.length > 0 && (
        <div className="mb-6">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-2">
            <img src={pet.photos[activePhoto]} alt={displayName} className="w-full h-full object-cover" />
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
            <h1 className="text-2xl font-bold font-heading text-foreground">{displayName}</h1>
            <Badge variant={statusColor} className="capitalize">{pet.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {[pet.species, pet.breed, pet.color, pet.age, pet.gender].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ShareButtons title={`${isLost ? "Lost" : "Found"} pet: ${displayName}${address ? ` near ${address}` : ""} — please help reunite!`} />
      </div>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Details</h2>
            {dateValue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {dateLabel} on {format(new Date(dateValue), "MMMM d, yyyy")}
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {address}
              </div>
            )}
            {pet.holding_location && (
              <p className="text-sm text-muted-foreground">Holding: {pet.holding_location}</p>
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
            {pet.contact_name && (
              <p className="text-sm text-foreground font-medium">{pet.contact_name}</p>
            )}
            {pet.contact_phone && (
              <a href={`tel:${pet.contact_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="h-4 w-4" />
                {pet.contact_phone}
              </a>
            )}
            {pet.contact_email && (
              <a href={`mailto:${pet.contact_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" />
                {pet.contact_email}
              </a>
            )}
            {!isLost && !pet.contact_name && (
              <p className="text-sm text-muted-foreground">Contact the reporter via message.</p>
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

      {/* QR code for printable flyers */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="bg-white p-2 rounded-lg border border-border">
              <QRCodeSVG value={typeof window !== "undefined" ? window.location.href : ""} size={96} level="M" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-tight max-w-[120px]">
              Scan for full details<br />
              <span className="italic">Escanea para más detalles</span>
            </p>
          </div>
          <div className="text-sm flex-1 text-center sm:text-left">
            <p className="font-semibold text-foreground mb-1">Share this listing</p>
            <p className="text-muted-foreground text-xs">
              Print a flyer with photo, details, contact info, and this QR code.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {(["en", "es", "bilingual"] as const).map((lang) => (
              <Button
                key={lang}
                variant={lang === "en" ? "hero" : "outline"}
                size="sm"
                onClick={() =>
                  openFlyer({
                    isLost,
                    petName: displayName,
                    species: pet.species,
                    breed: pet.breed,
                    color: pet.color,
                    age: pet.age,
                    gender: pet.gender,
                    description: pet.description,
                    address: address,
                    date: dateValue ? format(new Date(dateValue), "MMMM d, yyyy") : undefined,
                    contactName: pet.contact_name,
                    contactPhone: pet.contact_phone,
                    contactEmail: pet.contact_email,
                    photoUrl: pet.photos?.[0],
                    pageUrl: window.location.href,
                    lang,
                  })
                }
              >
                <Printer className="h-4 w-4 mr-2" />
                {lang === "en" && "Flyer (PDF) — English"}
                {lang === "es" && "Volante (PDF) — Español"}
                {lang === "bilingual" && "Bilingual Flyer (EN/ES)"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Reported on {format(new Date(pet.created_at), "MMMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  );
}
