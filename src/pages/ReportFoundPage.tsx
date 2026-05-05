import { useState } from "react";
import { geocodeAddress } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PhotoUpload from "@/components/PhotoUpload";

export default function ReportFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    species: "", breed: "", color: "", dateFound: "",
    holdingLocation: "", description: "", foundAddress: "", video: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!formData.species) return "Please select a species.";
    if (!formData.color.trim()) return "Color is required.";
    if (!formData.dateFound) return "Date found is required.";
    if (new Date(formData.dateFound) > new Date()) return "Date found cannot be in the future.";
    if (formData.video && !/^https?:\/\//i.test(formData.video.trim()))
      return "Video must be a valid URL starting with http(s)://";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to report a found pet."); navigate("/login"); return; }

    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    // Geocode the address
    let found_lat: number | null = null;
    let found_lng: number | null = null;
    if (formData.foundAddress) {
      const coords = await geocodeAddress(formData.foundAddress);
      if (coords) {
        found_lat = coords.lat;
        found_lng = coords.lng;
      } else {
        toast.warning("Couldn't pinpoint that address on the map — report saved without coordinates.");
      }
    }

    const { data, error } = await supabase.from("found_pets").insert({
      user_id: user.id, species: formData.species,
      breed: formData.breed.trim() || null, color: formData.color.trim(),
      date_found: formData.dateFound,
      holding_location: formData.holdingLocation.trim() || null,
      description: formData.description.trim() || null,
      found_address: formData.foundAddress.trim() || null,
      found_lat,
      found_lng,
      photos: photos.length > 0 ? photos : null,
      video: formData.video.trim() || null,
    }).select().single();

    if (error) { toast.error("Failed to submit: " + error.message); setLoading(false); return; }

    try {
      await supabase.functions.invoke("process-alerts", {
        body: { type: "found", pet_id: data.id, lat: found_lat, lng: found_lng, species: formData.species, breed: formData.breed, photo_url: photos[0] || null, reporter_user_id: user.id },
      });
    } catch (err) {
      console.error("Failed to send alerts:", err);
    }

    toast.success("Found pet report submitted! Nearby owners will be notified.");
    setLoading(false);
    navigate("/my-pets");
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-found/10 p-3"><CheckCircle2 className="h-6 w-6 text-found" /></div>
        <div>
          <h1 className="page-title mb-0">Report a Found Pet</h1>
          <p className="text-sm text-muted-foreground">Help this pet find its way back home.</p>
        </div>
      </div>

      {!user && (
        <Card className="mb-6 border-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">Please <a href="/login" className="text-primary font-semibold underline">sign in</a> to submit a report.</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Pet Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select onValueChange={(v) => handleChange("species", v)}>
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Breed (if known)</Label><Input placeholder="e.g., Tabby cat" value={formData.breed} onChange={(e) => handleChange("breed", e.target.value)} /></div>
            <div className="space-y-2"><Label>Color *</Label><Input placeholder="e.g., Orange and white" required value={formData.color} onChange={(e) => handleChange("color", e.target.value)} /></div>
            <div className="space-y-2"><Label>Date Found *</Label><Input type="date" required value={formData.dateFound} onChange={(e) => handleChange("dateFound", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Where did you find the pet?</Label><Input placeholder="e.g., 456 Oak Ave, Dallas, TX" value={formData.foundAddress} onChange={(e) => handleChange("foundAddress", e.target.value)} /></div>
            <div className="space-y-2"><Label>Temporary Holding Location</Label><Input placeholder="e.g., My home, Local vet clinic" value={formData.holdingLocation} onChange={(e) => handleChange("holdingLocation", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Photos & Video</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} userId={user?.id} label="Upload photos of the found pet" />
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input
                placeholder="YouTube, Vimeo, or any video link"
                value={formData.video}
                onChange={(e) => handleChange("video", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Additional Info</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder="Describe the pet's condition, behavior, collar details, etc." rows={4} value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
          </CardContent>
        </Card>

        <Button type="submit" variant="found" size="lg" className="w-full rounded-xl py-6 text-lg" disabled={loading}>
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {loading ? "Submitting..." : "Submit Found Pet Report"}
        </Button>
      </form>
    </div>
  );
}
