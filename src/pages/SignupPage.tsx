import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/littlefoot-logo-1.webp";
import type { AppRole } from "@/contexts/AuthContext";

const ROLE_OPTIONS: { value: Exclude<AppRole, "admin">; label: string; description: string }[] = [
  { value: "user", label: "General User", description: "Report lost/found pets and get alerts" },
  { value: "shelter", label: "Shelter / Rescue", description: "Manage intake and adoption listings" },
  { value: "volunteer", label: "Volunteer", description: "Help with searches and outreach" },
  { value: "rural_partner", label: "Rural Partner", description: "Trail cam uploads and rural search" },
  { value: "sponsor", label: "Business Sponsor", description: "Sponsor alerts and support the mission" },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Exclude<AppRole, "admin">>("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, requested_role: role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // If a session is returned (auto-confirm) and user picked a non-default role, claim it now.
    if (role !== "user" && data.session?.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.session.user.id, role });
      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Role claim failed:", roleError);
      }
    }

    setLoading(false);
    toast.success("Account created! Please check your email to verify your account.");
    navigate("/login", { state: { pendingRole: role !== "user" ? role : undefined } });
  };

  return (
    <div className="page-container flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto h-20 w-20 object-contain mb-3" />
            <h1 className="text-2xl font-bold font-heading text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join Lost Furry Friend Alerts</p>
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am signing up as *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{o.label}</span>
                        <span className="text-xs text-muted-foreground">{o.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Admin access is granted manually by site administrators.</p>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
