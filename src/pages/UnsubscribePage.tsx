import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-xl font-bold">Unsubscribe from Alerts</h2>
              <p className="text-muted-foreground text-sm">
                Click below to stop receiving email alerts from Lost Furry Friend Alerts.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
              <h2 className="text-xl font-bold">Unsubscribed</h2>
              <p className="text-muted-foreground text-sm">You will no longer receive email alerts.</p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-bold">Already Unsubscribed</h2>
              <p className="text-muted-foreground text-sm">This email is already unsubscribed.</p>
            </>
          )}
          {status === "invalid" && (
            <>
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-xl font-bold">Invalid Link</h2>
              <p className="text-muted-foreground text-sm">This unsubscribe link is invalid or expired.</p>
            </>
          )}
          {status === "error" && (
            <>
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground text-sm">Please try again later.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
