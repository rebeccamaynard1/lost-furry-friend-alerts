import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Users, PawPrint, Building2, AlertTriangle, CheckCircle2, Eye, Megaphone } from "lucide-react";

const stats = [
  { label: "Total Users", value: "4,231", icon: Users, color: "text-primary" },
  { label: "Lost Reports", value: "156", icon: AlertTriangle, color: "text-lost" },
  { label: "Found Reports", value: "89", icon: CheckCircle2, color: "text-found" },
  { label: "Sightings", value: "342", icon: Eye, color: "text-sighting" },
  { label: "Shelters", value: "47", icon: Building2, color: "text-shelter" },
  { label: "Sponsors", value: "12", icon: Megaphone, color: "text-accent" },
];

export default function AdminPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">
        <LayoutDashboard className="inline h-7 w-7 text-primary mr-2" />
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <Icon className={`mx-auto mb-1 h-5 w-5 ${s.color}`} />
                <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-heading">Pending Shelter Approvals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">3 shelters awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-heading">Pending Sponsor Approvals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">1 sponsor awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-heading">Recent Reports</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">12 new reports in the last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-heading">Flagged Content</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">2 posts flagged for review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
