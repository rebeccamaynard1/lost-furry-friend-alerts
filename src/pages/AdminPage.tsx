import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, PawPrint, Building2, AlertTriangle, CheckCircle2,
  Eye, Megaphone, Loader2, Check, X, Shield, Heart, DollarSign, Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Stats = {
  lostPets: number; foundPets: number; sightings: number;
  shelters: number; volunteers: number; sponsors: number;
  reunited: number; donations: number;
};
type PendingShelter = { id: string; name: string; address: string };
type PendingSponsor = { id: string; business_name: string; tier: string | null };

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingShelters, setPendingShelters] = useState<PendingShelter[]>([]);
  const [pendingSponsors, setPendingSponsors] = useState<PendingSponsor[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotice, setSendingNotice] = useState(false);

  const sendListNotice = async () => {
    if (!confirm("Send the 'you're on our alert list' notice to EVERY email in our lists (users, shelters, Alabama partners, rural partners, volunteers, sponsors)? This runs once per address.")) return;
    setSendingNotice(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-list-notice");
      if (error) throw error;
      toast.success(`Queued ${data?.queued ?? 0} of ${data?.recipients ?? 0} recipients${data?.failed ? ` (${data.failed} failed)` : ""}.`);
    } catch (e: any) {
      toast.error("Failed to send notice: " + (e.message || e));
    } finally {
      setSendingNotice(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin");
      const admin = (roles && roles.length > 0);
      setIsAdmin(admin);
      if (!admin) { setLoading(false); return; }

      const [lost, found, sight, shelt, vol, spon, reunited, donations, pShelters, pSponsors] = await Promise.all([
        supabase.from("lost_pets").select("id", { count: "exact", head: true }).eq("status", "lost"),
        supabase.from("found_pets").select("id", { count: "exact", head: true }),
        supabase.from("sightings").select("id", { count: "exact", head: true }),
        supabase.from("shelters").select("id", { count: "exact", head: true }).eq("approved", true),
        supabase.from("volunteers").select("id", { count: "exact", head: true }),
        supabase.from("sponsors").select("id", { count: "exact", head: true }).eq("approved", true),
        supabase.from("lost_pets").select("id", { count: "exact", head: true }).eq("status", "reunited"),
        supabase.from("donations").select("id", { count: "exact", head: true }),
        supabase.from("shelters").select("id, name, address").eq("approved", false),
        supabase.from("sponsors").select("id, business_name, tier").eq("approved", false),
      ]);

      setStats({
        lostPets: lost.count || 0, foundPets: found.count || 0,
        sightings: sight.count || 0, shelters: shelt.count || 0,
        volunteers: vol.count || 0, sponsors: spon.count || 0,
        reunited: reunited.count || 0, donations: donations.count || 0,
      });
      setPendingShelters(pShelters.data || []);
      setPendingSponsors(pSponsors.data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const approveShelter = async (id: string) => {
    const { error } = await supabase.from("shelters").update({ approved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Shelter approved!"); setPendingShelters((prev) => prev.filter((s) => s.id !== id)); }
  };

  const approveSponsor = async (id: string) => {
    const { error } = await supabase.from("sponsors").update({ approved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Sponsor approved!"); setPendingSponsors((prev) => prev.filter((s) => s.id !== id)); }
  };

  if (!user) {
    return (
      <div className="page-container text-center py-20">
        <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Sign in to access the admin dashboard.</p>
        <Button asChild variant="hero"><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) {
    return (
      <div className="page-container text-center py-20">
        <Shield className="mx-auto mb-4 h-12 w-12 text-destructive/30" />
        <p className="text-lg font-heading font-bold text-foreground">Access Denied</p>
        <p className="text-muted-foreground">You don't have admin privileges.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Active Lost", value: stats!.lostPets, icon: AlertTriangle, color: "text-lost" },
    { label: "Found Reports", value: stats!.foundPets, icon: CheckCircle2, color: "text-found" },
    { label: "Reunited 🎉", value: stats!.reunited, icon: Heart, color: "text-found" },
    { label: "Sightings", value: stats!.sightings, icon: Eye, color: "text-sighting" },
    { label: "Shelters", value: stats!.shelters, icon: Building2, color: "text-shelter" },
    { label: "Volunteers", value: stats!.volunteers, icon: Users, color: "text-volunteer" },
    { label: "Sponsors", value: stats!.sponsors, icon: Megaphone, color: "text-accent" },
    { label: "Donations", value: stats!.donations, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title"><LayoutDashboard className="inline h-7 w-7 text-primary mr-2" />Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <Icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
                <p className="text-xl font-bold font-heading text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-heading">Pending Shelter Approvals</CardTitle></CardHeader>
          <CardContent>
            {pendingShelters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shelters awaiting approval ✓</p>
            ) : (
              <div className="space-y-3">
                {pendingShelters.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.address}</p>
                    </div>
                    <Button size="sm" onClick={() => approveShelter(s.id)}><Check className="h-3 w-3 mr-1" />Approve</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading">Pending Sponsor Approvals</CardTitle></CardHeader>
          <CardContent>
            {pendingSponsors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sponsors awaiting approval ✓</p>
            ) : (
              <div className="space-y-3">
                {pendingSponsors.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.business_name}</p>
                      {s.tier && <Badge variant="outline" className="text-xs">{s.tier}</Badge>}
                    </div>
                    <Button size="sm" onClick={() => approveSponsor(s.id)}><Check className="h-3 w-3 mr-1" />Approve</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
