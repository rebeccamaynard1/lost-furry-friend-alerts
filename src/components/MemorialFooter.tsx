import { Link } from "react-router-dom";
import logo from "@/assets/littlefoot-logo-1.webp";

export default function MemorialFooter() {
  return (
    <footer className="border-t border-border bg-card py-6 text-center mt-auto">
      <div className="page-container">
        <img src={logo} alt="Little Foot" className="mx-auto mb-2 h-10 w-10 object-contain opacity-60" />
        <p className="text-sm text-muted-foreground italic">
          In Loving Memory of Little Foot 🐾
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          © {new Date().getFullYear()} Lost Furry Friend Alerts. All rights reserved.
        </p>
        <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <Link to="/terms" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Terms</Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Privacy</Link>
          <Link to="/help" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Help</Link>
          <Link to="/donate" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Donate</Link>
        </nav>
      </div>
    </footer>
  );
}
