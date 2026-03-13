import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Upload, MapPin, Camera, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    species: "", breed: "", color: "", dateFound: "",
    holdingLocation: "", description: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to report a found pet.");
      navigate("/login");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from("found_pets").insert({
      user_id: user.id,
      species: formData.species,
      breed: formData.breed || null,
      color: formData.color,
      date_found: formData.dateFound,
      holding_location: formData.holdingLocation || null,
      description: formData.description || null,
    }).select().single();

    if (error) {
      toast.error("Failed to submit report: " + error.message);
      setLoading(false);
      return;
    }

    // Trigger alerts
    try {
      await supabase.functions.invoke("process-alerts", {
        body: {
          type: "found",
          pet_id: data.id,
          species: formData.species,
          breed: formData.breed,
        },
      });
    } catch {
      // Alert failed silently
    }

    toast.success("Found pet report submitted! Nearby owners will be notified.");
    setLoading(false);
    navigate("/my-pets");
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-found/10 p-3">
          <CheckCircle2 className="h-6 w-6 text-found" />
        </div>
        <div>
          <h1 className="page-title mb-0">Report a Found Pet</h1>
          <p className="text-sm text-muted-foreground">Help this pet find its way back home.</p>
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
            <div className="space-y-2">
              <Label>Breed (if known)</Label>
              <Input placeholder="e.g., Tabby cat" value={formData.breed} onChange={(e) => handleChange("breed", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Color *</Label>
              <Input placeholder="e.g., Orange and white" required value={formData.color} onChange={(e) => handleChange("color", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date Found *</Label>
              <Input type="date" required value={formData.dateFound} onChange={(e) => handleChange("dateFound", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 p-4 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-found" />
              <span>Drop a pin where you found the pet (map coming soon)</span>
            </div>
            <div className="space-y-2">
              <Label>Temporary Holding Location</Label>
              <Input placeholder="e.g., My home, Local vet clinic" value={formData.holdingLocation} onChange={(e) => handleChange("holdingLocation", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-heading">Photos & Video</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Upload photos of the found pet</p>
              <p className="text-xs text-muted-foreground mt-1">Clear photos help owners identify their pet</p>
              <Button type="button" variant="outline" className="mt-4">
                <Upload className="h-4 w-4 mr-2" /> Choose Files
              </Button>
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
