import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/littlefoot-logo-1.webp";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    } else {
      // Also check for session - user may already be authenticated via the recovery link
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setValid(true);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! You can now sign in.");
      navigate("/login");
    }
  };

  if (!valid) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto h-20 w-20 object-contain mb-3" />
            <h1 className="text-xl font-bold font-heading text-foreground mb-2">Invalid Reset Link</h1>
            <p className="text-sm text-muted-foreground">This password reset link is invalid or has expired. Please request a new one.</p>
            <Button variant="hero" className="mt-4" onClick={() => navigate("/forgot-password")}>
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto h-20 w-20 object-contain mb-3" />
            <h1 className="text-2xl font-bold font-heading text-foreground">Set New Password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
