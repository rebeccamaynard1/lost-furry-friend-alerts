import logo from "@/assets/littlefoot-logo-1.png";

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
      </div>
    </footer>
  );
}
