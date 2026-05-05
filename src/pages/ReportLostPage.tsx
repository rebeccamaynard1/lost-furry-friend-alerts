import { useState } from "react";
import { geocodeAddress } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, AlertCircle, Share2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PhotoUpload from "@/components/PhotoUpload";

export default function ReportLostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    petName: "", species: "", breed: "", color: "", age: "",
    gender: "", microchip: "", dateLost: "", description: "",
    contactName: "", contactPhone: "", contactEmail: "", lastSeenAddress: "",
    video: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "microchip" && value.length > 5) checkDuplicate(value);
  };

  const checkDuplicate = async (microchip: string) => {
    const { data } = await supabase.from("lost_pets").select("id, pet_name").eq("microchip", microchip).eq("status", "lost").limit(1);
    setDuplicateWarning(data && data.length > 0 ? `A report for "${data[0].pet_name}" with this microchip already exists.` : null);
  };

  const validate = (): string | null => {
    if (!formData.petName.trim()) return "Pet name is required.";
    if (!formData.species) return "Please select a species.";
    if (!formData.color.trim()) return "Color is required.";
    if (!formData.dateLost) return "Date lost is required.";
    if (new Date(formData.dateLost) > new Date()) return "Date lost cannot be in the future.";
    if (!formData.contactName.trim()) return "Your name is required.";
    if (!formData.contactPhone.trim() || formData.contactPhone.replace(/\D/g, "").length < 7)
      return "A valid phone number is required.";
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail))
      return "Please enter a valid email address.";
    if (formData.video && !/^https?:\/\//i.test(formData.video.trim()))
      return "Video must be a valid URL starting with http(s)://";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to report a lost pet."); navigate("/login"); return; }

    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    // Geocode the address
    let last_seen_lat: number | null = null;
    let last_seen_lng: number | null = null;
    if (formData.lastSeenAddress) {
      const coords = await geocodeAddress(formData.lastSeenAddress);
      if (coords) {
        last_seen_lat = coords.lat;
        last_seen_lng = coords.lng;
      } else {
        toast.warning("Couldn't pinpoint that address on the map — report saved without coordinates.");
      }
    }

    const { data, error } = await supabase.from("lost_pets").insert({
      user_id: user.id,
      pet_name: formData.petName.trim(), species: formData.species,
      breed: formData.breed.trim() || null, color: formData.color.trim(),
      age: formData.age.trim() || null, gender: formData.gender || null,
      microchip: formData.microchip.trim() || null, date_lost: formData.dateLost,
      description: formData.description.trim() || null,
      contact_name: formData.contactName.trim(), contact_phone: formData.contactPhone.trim(),
      contact_email: formData.contactEmail.trim() || null,
      last_seen_address: formData.lastSeenAddress.trim() || null,
      last_seen_lat,
      last_seen_lng,
      photos: photos.length > 0 ? photos : null,
      video: formData.video.trim() || null,
    }).select().single();

    if (error) { toast.error("Failed to submit: " + error.message); setLoading(false); return; }

    try {
      await supabase.functions.invoke("process-alerts", {
        body: { type: "lost", pet_id: data.id, lat: last_seen_lat, lng: last_seen_lng, pet_name: formData.petName, species: formData.species, breed: formData.breed, photo_url: photos[0] || null, reporter_user_id: user.id },
      });
    } catch (err) {
      console.error("Failed to send alerts:", err);
    }

    // Auto-notify Alabama partners if pet lost in Alabama
    const addr = (formData.lastSeenAddress || "").toLowerCase();
    if (addr.includes("alabama") || addr.includes(", al") || addr.match(/\bAL\s*\d{5}/i)) {
      try {
        await supabase.functions.invoke("notify-alabama-partners", {
          body: {
            pet_id: data.id, pet_name: formData.petName, species: formData.species,
            breed: formData.breed, color: formData.color, description: formData.description,
            last_seen_address: formData.lastSeenAddress, contact_name: formData.contactName,
            contact_phone: formData.contactPhone, contact_email: formData.contactEmail,
            photo_url: photos[0] || null,
          },
        });
      } catch (err) {
        console.error("Failed to notify Alabama partners:", err);
      }
    }

    toast.success("Lost pet report submitted! Nearby users will be alerted.");
    setLoading(false);
    navigate("/my-pets");
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-lost/10 p-3"><AlertTriangle className="h-6 w-6 text-lost" /></div>
        <div>
          <h1 className="page-title mb-0">Report a Lost Pet</h1>
          <p className="text-sm text-muted-foreground">Fill out the form below to alert your community immediately.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <a href="https://buy.stripe.com/4gMdR89r58Ee3wY2bv0Ny01" target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="lost" size="lg" className="w-full rounded-xl py-6 text-lg font-bold">
              🔔 $10 Lost Pet Alert
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-2">Standard alert sent to nearby users.</p>
        </div>
        <div className="text-center">
          <a href="https://buy.stripe.com/4gMfZgbzd2fQ2sUeYh0Ny02" target="_blank" rel="noopener noreferrer">
            <Button type="button" size="lg" className="w-full rounded-xl py-6 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
              🚀 $20 Boosted Alert
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-2">Extra notifications for faster visibility.</p>
        </div>
      </div>

      {!user && (
        <Card className="mb-6 border-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">
              Please <a href="/login" className="text-primary font-semibold underline">sign in</a> to submit a report.
            </p>
          </CardContent>
        </Card>
      )}

      {duplicateWarning && (
        <Card className="mb-6 border-warning bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">{duplicateWarning}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Pet Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pet Name *</Label>
              <Input placeholder="e.g., Buddy" required value={formData.petName} onChange={(e) => handleChange("petName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select onValueChange={(v) => handleChange("species", v)}>
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="reptile">Reptile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Breed</Label>
              <Input placeholder="e.g., Golden Retriever" value={formData.breed} onChange={(e) => handleChange("breed", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Color *</Label>
              <Input placeholder="e.g., Brown and white" required value={formData.color} onChange={(e) => handleChange("color", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input placeholder="e.g., 3 years" value={formData.age} onChange={(e) => handleChange("age", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Microchip Number</Label>
              <Input placeholder="e.g., 985112000123456" value={formData.microchip} onChange={(e) => handleChange("microchip", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Location & Date</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Last Seen Address</Label>
              <Input placeholder="e.g., 123 Main St, Austin, TX" value={formData.lastSeenAddress} onChange={(e) => handleChange("lastSeenAddress", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date Lost *</Label>
              <Input type="date" required value={formData.dateLost} onChange={(e) => handleChange("dateLost", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Photos & Video</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} userId={user?.id} label="Upload photos of your pet" />
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input
                placeholder="YouTube, Vimeo, or any video link"
                value={formData.video}
                onChange={(e) => handleChange("video", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Paste a link to a video of your pet (recent recording can speed up identification).</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Your Contact Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Your Name *</Label><Input required value={formData.contactName} onChange={(e) => handleChange("contactName", e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone *</Label><Input type="tel" required value={formData.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input type="email" value={formData.contactEmail} onChange={(e) => handleChange("contactEmail", e.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Additional Details</Label><Textarea placeholder="Any identifying marks, behavior, collar details, etc." value={formData.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} /></div>
          </CardContent>
        </Card>

        <Button type="submit" variant="lost" size="lg" className="w-full rounded-xl py-6 text-lg" disabled={loading}>
          <AlertTriangle className="h-5 w-5 mr-2" />
          {loading ? "Submitting..." : "Submit Lost Pet Report"}
        </Button>
      </form>
    </div>
  );
}
