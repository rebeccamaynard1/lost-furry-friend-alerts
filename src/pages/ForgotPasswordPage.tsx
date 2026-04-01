import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import logo from "@/assets/littlefoot-logo-1.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for the reset link!");
    }
  };

  return (
    <div className="page-container flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto h-20 w-20 object-contain mb-3" />
            <h1 className="text-2xl font-bold font-heading text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground">We'll send you a link to reset your password</p>
          </div>
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="mx-auto h-12 w-12 text-primary" />
              <p className="text-foreground font-medium">Email sent!</p>
              <p className="text-sm text-muted-foreground">Check your inbox for a password reset link. It may take a minute to arrive.</p>
              <Link to="/login" className="text-primary font-semibold hover:underline text-sm">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Remember your password?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
