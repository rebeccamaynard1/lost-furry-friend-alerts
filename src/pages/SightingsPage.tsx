import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Camera, MapPin, Plus, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Sighting = {
  id: string; location_address: string | null; notes: string | null;
  photo: string | null; seen_at: string; location_lat: number | null; location_lng: number | null;
};

export default function SightingsPage() {
  const { user } = useAuth();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ notes: "", location_address: "", lat: "", lng: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSightings = async () => {
    const { data } = await supabase.from("sightings")
      .select("id, location_address, notes, photo, seen_at, location_lat, location_lng")
      .order("seen_at", { ascending: false }).limit(50);
    setSightings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSightings(); }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-sighting.${ext}`;
    const { error } = await supabase.storage.from("pet-photos").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(path);
    setPhotoUrl(publicUrl);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!form.notes && !form.location_address) { toast.error("Please add details"); return; }
    setSubmitting(true);
    const lat = form.lat ? parseFloat(form.lat) : null;
    const lng = form.lng ? parseFloat(form.lng) : null;

    const { error } = await supabase.from("sightings").insert({
      user_id: user.id, notes: form.notes, location_address: form.location_address,
      location_lat: lat, location_lng: lng, photo: photoUrl,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Sighting reported!");
      setForm({ notes: "", location_address: "", lat: "", lng: "" });
      setPhotoUrl(null);
      setOpen(false);
      fetchSightings();
      if (lat && lng) { supabase.functions.invoke("match-sighting", { body: { lat, lng } }); }
    }
    setSubmitting(false);
  };

  const filtered = sightings.filter((s) =>
    !searchTerm || (s.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || s.location_address?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0"><Eye className="inline h-7 w-7 text-sighting mr-2" />Sightings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Report Sighting</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Report a Sighting</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Textarea placeholder="Describe what you saw (species, color, behavior)..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Input placeholder="Location (e.g. 123 Main St, Austin, TX)" value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Latitude (optional)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                <Input placeholder="Longitude (optional)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              </div>
              {/* Photo upload */}
              {photoUrl ? (
                <div className="relative inline-block">
                  <img src={photoUrl} alt="Sighting" className="h-20 w-20 rounded-lg object-cover" />
                  <button type="button" onClick={() => setPhotoUrl(null)} className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                    Add Photo
                  </Button>
                </>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}Submit Sighting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search sightings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Eye className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No sightings yet. Be the first to report one!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <Card key={s.id} className="card-hover">
              <CardContent className="p-4 flex items-start gap-4">
                {s.photo ? (
                  <img src={s.photo} alt="Sighting" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="rounded-lg bg-sighting/10 p-3 flex-shrink-0"><Camera className="h-5 w-5 text-sighting" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">{s.notes || "No description"}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {s.location_address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location_address}</span>}
                    <span>{formatDistanceToNow(new Date(s.seen_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0 text-xs" onClick={() => { navigator.share?.({ text: s.notes || "Pet sighting", url: window.location.href }).catch(() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }); }}>
                  Share
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
