import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PawPrint, Home, Search } from "lucide-react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <SEO
        title="Page Not Found — Lost Furry Friend Alerts"
        description="The page you're looking for doesn't exist. Return home to keep helping pets find their families."
      />
      <div className="text-center max-w-md">
        <PawPrint className="mx-auto mb-4 h-16 w-16 text-primary animate-pulse-soft" />
        <h1 className="mb-2 text-6xl font-extrabold font-heading text-primary">404</h1>
        <p className="mb-2 text-2xl font-heading font-bold text-foreground">
          This trail's gone cold
        </p>
        <p className="mb-6 text-muted-foreground">
          We couldn't find that page. Let's get you back on the path.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="hero" className="rounded-xl">
            <Link to="/"><Home className="h-4 w-4 mr-1" />Home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/map"><Search className="h-4 w-4 mr-1" />View Map</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
