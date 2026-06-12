import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, MapPin, MessageSquare, PawPrint, Eye, Building2,
  Users, TreePine, Heart, Crown, LayoutDashboard, Menu, X,
  AlertTriangle, CheckCircle2, Megaphone, LogIn, LogOut, User, HelpCircle, Bell, Search, Inbox
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import PremiumBadge from "@/components/PremiumBadge";
import GlobalSearch from "@/components/GlobalSearch";
import MemorialFooter from "@/components/MemorialFooter";
import logo from "@/assets/littlefoot-logo-1.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/report-lost", label: "Report Lost Pet", icon: AlertTriangle },
  { path: "/report-found", label: "Report Found Pet", icon: CheckCircle2 },
  { path: "/map", label: "Map", icon: MapPin },
  { path: "/sightings", label: "Sightings", icon: Eye },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/my-pets", label: "My Pets", icon: PawPrint },
  { path: "/profile", label: "Profile Settings", icon: User },
  { path: "/shelters", label: "Shelters", icon: Building2 },
  { path: "/volunteers", label: "Volunteers", icon: Users },
  { path: "/rural-partners", label: "Rural Partners", icon: TreePine },
  { path: "/alabama-partners", label: "Alabama Partners", icon: Building2 },
  { path: "/sponsors", label: "Sponsors", icon: Megaphone },
  { path: "/donate", label: "Donate", icon: Heart },
  { path: "/premium", label: "Upgrade to Premium", icon: Crown },
  { path: "/notification-settings", label: "Notification Settings", icon: Bell },
  { path: "/notifications", label: "Notifications Center", icon: Bell },
  { path: "/help", label: "Help & Guides", icon: HelpCircle },
  { path: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
];

const bottomNavItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/report-lost", label: "Report", icon: AlertTriangle },
  { path: "/map", label: "Map", icon: MapPin },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/my-pets", label: "My Pets", icon: PawPrint },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isPremium } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-secondary md:hidden" aria-label="Toggle menu">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Lost Furry Friend Alerts" className="h-10 w-10 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold font-heading leading-tight text-foreground">Lost Furry Friend</h1>
                <p className="text-xs font-medium text-primary leading-none">Alerts</p>
              </div>
            </Link>
          </div>
          <div className="hidden lg:block flex-1 mx-8 max-w-md">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user.email?.split("@")[0]}</span>
                  {isPremium && <PremiumBadge />}
                </div>
                <button onClick={handleLogout} className="rounded-lg p-2 hover:bg-secondary transition-colors" title="Sign out">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors sm:text-sm sm:px-4">
                <LogIn className="inline h-4 w-4 mr-1" />Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r border-border bg-card">
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="flex items-center gap-2 px-3 mb-6">
              <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-sm text-foreground">Lost Furry Friend Alerts</span>
              {isPremium && <PremiumBadge />}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-link ${isActive ? "nav-link-active" : ""}`}>
                    <Icon className="h-5 w-5 flex-shrink-0" /><span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl md:hidden pt-16 overflow-y-auto">
              <nav className="space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`nav-link ${isActive ? "nav-link-active" : ""}`}>
                      <Icon className="h-5 w-5 flex-shrink-0" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pb-20 md:pb-6 flex flex-col">
          <div className="flex-1">{children}</div>
          {!isHome && <MemorialFooter />}
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
