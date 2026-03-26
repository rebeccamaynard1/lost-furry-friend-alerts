import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Heart, Home } from "lucide-react";
import logo from "@/assets/littlefoot-logo-1.png";

export default function PaymentSuccessPage() {
  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <img src={logo} alt="Lost Furry Friend Alerts" className="mx-auto h-16 w-16 object-contain mb-4" />
          <CheckCircle2 className="mx-auto h-12 w-12 text-found mb-4" />
          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was successful. Thank you for supporting Fur Babies Lost & Found USA!
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="hero" className="rounded-xl">
              <Link to="/"><Home className="h-4 w-4 mr-2" />Go Home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/my-pets">My Pets</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
