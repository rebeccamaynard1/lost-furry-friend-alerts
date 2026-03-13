import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Upload, MapPin, Camera, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportLostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    petName: "", species: "", breed: "", color: "", age: "",
    gender: "", microchip: "", dateLost: "", description: "",
    contactName: "", contactPhone: "", contactEmail: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Duplicate check on microchip
    if (field === "microchip" && value.length > 5) {
      checkDuplicate(value);
    }
  };

  const checkDuplicate = async (microchip: string) => {
    const { data } = await supabase
      .from("lost_pets")
      .select("id, pet_name")
      .eq("microchip", microchip)
      .eq("status", "lost")
      .limit(1);
    if (data && data.length > 0) {
      setDuplicateWarning(`A report for "${data[0].pet_name}" with this microchip already exists.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to report a lost pet.");
      navigate("/login");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from("lost_pets").insert({
      user_id: user.id,
      pet_name: formData.petName,
      species: formData.species,
      breed: formData.breed || null,
      color: formData.color,
      age: formData.age || null,
      gender: formData.gender || null,
      microchip: formData.microchip || null,
      date_lost: formData.dateLost,
      description: formData.description || null,
      contact_name: formData.contactName,
      contact_phone: formData.contactPhone,
      contact_email: formData.contactEmail || null,
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
          type: "lost",
          pet_id: data.id,
          pet_name: formData.petName,
          species: formData.species,
          breed: formData.breed,
        },
      });
    } catch {
      // Alerts failed but report was saved
    }

    toast.success("Lost pet report submitted! Nearby users will be alerted.");
    setLoading(false);
    navigate("/my-pets");
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-lost/10 p-3">
          <AlertTriangle className="h-6 w-6 text-lost" />
        </div>
        <div>
          <h1 className="page-title mb-0">Report a Lost Pet</h1>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to alert your community immediately.
          </p>
        </div>
      </div>

      {!user && (
        <Card className="mb-6 border-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">
              Please <a href="/login" className="text-primary font-semibold underline">sign in</a> or{" "}
              <a href="/signup" className="text-primary font-semibold underline">create an account</a> to submit a report.
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
          <CardHeader>
            <CardTitle className="text-lg font-heading">Pet Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="petName">Pet Name *</Label>
              <Input id="petName" placeholder="e.g., Buddy" required value={formData.petName} onChange={(e) => handleChange("petName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
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
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" placeholder="e.g., Golden Retriever" value={formData.breed} onChange={(e) => handleChange("breed", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input id="color" placeholder="e.g., Brown and white" required value={formData.color} onChange={(e) => handleChange("color", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" placeholder="e.g., 3 years" value={formData.age} onChange={(e) => handleChange("age", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
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
              <Label htmlFor="microchip">Microchip Number</Label>
              <Input id="microchip" placeholder="e.g., 985112000123456" value={formData.microchip} onChange={(e) => handleChange("microchip", e.target.value)} />
              <p className="text-xs text-muted-foreground">15-digit ISO standard or 10-digit AVID format</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Location & Date</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Last Seen Location *</Label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 p-4 text-sm text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Click to drop a pin on the map (map integration coming soon)</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateLost">Date Lost *</Label>
              <Input id="dateLost" type="date" required value={formData.dateLost} onChange={(e) => handleChange("dateLost", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Photos & Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Upload photos of your pet</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or HEIC up to 10MB each</p>
              <Button type="button" variant="outline" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Your Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Your Name *</Label>
              <Input id="contactName" required value={formData.contactName} onChange={(e) => handleChange("contactName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone *</Label>
              <Input id="contactPhone" type="tel" required value={formData.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => handleChange("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea id="description" placeholder="Any identifying marks, behavior, collar details, etc." value={formData.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} />
            </div>
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
