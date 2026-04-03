import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle, CheckCircle2, MapPin, Eye, PawPrint,
  Heart, Crown, ArrowRight, Search
} from "lucide-react";
import logo from "@/assets/littlefoot-logo-1.webp";
import { supabase } from "@/integrations/supabase/client";
import SpotlightSection from "@/components/SpotlightSection";
import MemorialFooter from "@/components/MemorialFooter";

const quickActions = [
  { title: "Report Lost Pet", description: "File a report immediately to alert your community", icon: AlertTriangle, path: "/report-lost", color: "bg-lost/10 text-lost", iconColor: "text-lost" },
  { title: "Report Found Pet", description: "Help a pet find its way back home", icon: CheckCircle2, path: "/report-found", color: "bg-found/10 text-found", iconColor: "text-found" },
  { title: "Submit Sighting", description: "Spotted a lost pet? Submit a sighting report", icon: Eye, path: "/sightings", color: "bg-sighting/10 text-sighting", iconColor: "text-sighting" },
  { title: "View Map", description: "See lost & found pets in your area", icon: MapPin, path: "/map", color: "bg-primary/10 text-primary", iconColor: "text-primary" },
];

export default function HomePage() {
  const [stats, setStats] = useState({ reunited: 0, active: 0, volunteers: 0 });
  const [sponsors, setSponsors] = useState<{ id: string; business_name: string; logo: string | null; website: string | null; tier: string | null }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [reunited, active, vols, sponsorRes] = await Promise.all([
        supabase.from("lost_pets").select("id", { count: "exact", head: true }).eq("status", "reunited"),
        supabase.from("lost_pets").select("id", { count: "exact", head: true }).eq("status", "lost"),
        supabase.from("volunteers").select("id", { count: "exact", head: true }),
        supabase.from("sponsors").select("id, business_name, logo, website, tier").eq("approved", true).limit(8),
      ]);
      setStats({ reunited: reunited.count || 0, active: active.count || 0, volunteers: vols.count || 0 });
      setSponsors(sponsorRes.data || []);
    }
    fetchStats();
  }, []);

  const statItems = [
    { label: "Pets Reunited", value: stats.reunited, icon: Heart },
    { label: "Active Reports", value: stats.active, icon: Search },
    { label: "Volunteers", value: stats.volunteers, icon: PawPrint },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary to-primary/10 py-12 sm:py-20">
        <div className="page-container text-center">
          <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto mb-6 h-24 w-24 sm:h-32 sm:w-32 object-contain animate-pulse-soft" />
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-foreground mb-4 leading-tight">
            Lost Furry Friend<br /><span className="text-primary">Alerts</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
            A nationwide pet recovery network helping families reunite with their beloved pets.
            Fast, free, and powered by community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl">
              <Link to="/report-lost"><AlertTriangle className="h-5 w-5 mr-2" />Report Lost Pet</Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl">
              <Link to="/report-found"><CheckCircle2 className="h-5 w-5 mr-2" />Report Found Pet</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-8">
        <div className="page-container">
          <div className="grid grid-cols-3 gap-4 text-center">
            {statItems.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}>
                  <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-foreground">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-10">
        <div className="page-container">
          <h2 className="text-2xl font-bold font-heading text-foreground mb-6 text-center">How Can We Help?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path}>
                  <Card className="card-hover h-full cursor-pointer border-border">
                    <CardContent className="p-6">
                      <div className={`mb-4 inline-flex rounded-xl p-3 ${action.color}`}><Icon className={`h-6 w-6 ${action.iconColor}`} /></div>
                      <h3 className="text-lg font-bold font-heading text-card-foreground mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      <div className="mt-3 flex items-center text-sm font-semibold text-primary">Get Started <ArrowRight className="ml-1 h-4 w-4" /></div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spotlight */}
      <SpotlightSection />

      {/* Premium CTA */}
      <section className="py-10 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="page-container text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-accent" />
          <h2 className="text-2xl font-bold font-heading text-foreground mb-2">Upgrade to Premium</h2>
          <p className="mx-auto max-w-lg text-muted-foreground mb-6">
            Get instant alerts, state-wide notifications, priority listing,
            and help us keep this service running for everyone.
          </p>
          <Button asChild variant="hero" size="lg" className="rounded-xl">
            <Link to="/premium"><Crown className="h-5 w-5 mr-2" />Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <section className="py-8 border-t border-border">
          <div className="page-container text-center">
            <h3 className="text-lg font-bold font-heading text-foreground mb-4">Our Sponsors</h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {sponsors.map((s) => (
                <a key={s.id} href={s.website || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {s.logo ? <img src={s.logo} alt={s.business_name} className="h-10 object-contain" /> : s.business_name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Memorial Footer */}
      <MemorialFooter />
    </div>
  );
}
