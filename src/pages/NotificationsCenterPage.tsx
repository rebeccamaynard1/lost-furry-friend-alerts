import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Loader2,
  Check,
  Zap,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Inbox,
  Trash2,
  Megaphone,
  MessageSquare,
  Eye,
  Star,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link: string | null;
  photo_url: string | null;
}

const PAGE_SIZE = 25;

const typeIcon = (type: string) => {
  if (type.includes("boost")) return Zap;
  if (type.includes("message")) return MessageSquare;
  if (type.includes("sighting")) return Eye;
  if (type.includes("match")) return Star;
  if (type.includes("alert")) return Megaphone;
  return Bell;
};

const typeColor = (type: string) => {
  if (type === "boost_expiring_soon") return "bg-warning/10 text-warning border-warning/30";
  if (type === "boost_expired") return "bg-muted text-muted-foreground border-border";
  if (type.includes("boost")) return "bg-accent/10 text-accent border-accent/30";
  if (type.includes("message")) return "bg-primary/10 text-primary border-primary/30";
  if (type.includes("match")) return "bg-found/10 text-found border-found/30";
  return "bg-secondary text-secondary-foreground border-border";
};

const statusBadge = (n: Notification) => {
  if (!n.read) return <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">New</Badge>;
  return null;
};

export default function NotificationsCenterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadNotifications(1, true);
  }, [user]);

  const loadNotifications = async (p: number, reset = false) => {
    if (!user) return;
    setLoading(true);
    const from = (p - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load notifications");
      setLoading(false);
      return;
    }

    const list = data || [];
    setHasMore(list.length === PAGE_SIZE);
    setNotifications((prev) => reset ? list : [...prev, ...list]);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markUnread = async (id: string) => {
    if (!user) return;
    await supabase.from("notifications").update({ read: false }).eq("id", id).eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("id", id).eq("user_id", user.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadNotifications(next);
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    if (activeTab === "boost") return n.type.includes("boost");
    if (activeTab === "expiring") return n.type === "boost_expiring_soon";
    if (activeTab === "expired") return n.type === "boost_expired";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const boostCount = notifications.filter((n) => n.type.includes("boost")).length;
  const expiringCount = notifications.filter((n) => n.type === "boost_expiring_soon").length;
  const expiredCount = notifications.filter((n) => n.type === "boost_expired").length;

  if (!user) {
    return (
      <div className="page-container text-center py-20">
        <SEO title="Notifications — Lost Furry Friend Alerts" />
        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Sign in to view your notifications.</p>
        <Button asChild variant="hero"><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <SEO title="Notifications — Lost Furry Friend Alerts" />
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 hover:bg-secondary transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="rounded-xl bg-primary/10 p-3">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="page-title mb-0">Notifications Center</h1>
          <p className="text-sm text-muted-foreground">All your alerts, boost updates, and activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="rounded-lg" onClick={markAllRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg text-xs">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="boost" className="rounded-lg text-xs">
            Boosts {boostCount > 0 && `(${boostCount})`}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="rounded-lg text-xs">
            <Clock className="h-3 w-3 mr-1 inline" />
            Expiring Soon {expiringCount > 0 && `(${expiringCount})`}
          </TabsTrigger>
          <TabsTrigger value="expired" className="rounded-lg text-xs">
            <AlertTriangle className="h-3 w-3 mr-1 inline" />
            Expired {expiredCount > 0 && `(${expiredCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  {activeTab === "all"
                    ? "No notifications yet."
                    : activeTab === "unread"
                    ? "No unread notifications."
                    : activeTab === "boost"
                    ? "No boost notifications yet."
                    : activeTab === "expiring"
                    ? "No boosts expiring soon."
                    : "No expired boost notifications."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2">
                  {filtered.map((n) => {
                    const Icon = typeIcon(n.type);
                    const isBoost = n.type.includes("boost");
                    return (
                      <Card
                        key={n.id}
                        className={`transition-all ${!n.read ? "border-primary/30 bg-primary/[0.03]" : "border-border"}`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${typeColor(n.type)}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                                    {n.title}
                                    {statusBadge(n)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                                </div>
                                <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                                  {new Date(n.created_at).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  {new Date(n.created_at).toLocaleTimeString(undefined, {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Boost-specific meta */}
                              {isBoost && (
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      n.type === "boost_expiring_soon"
                                        ? "border-warning text-warning"
                                        : n.type === "boost_expired"
                                        ? "border-muted-foreground text-muted-foreground"
                                        : "border-accent text-accent"
                                    }`}
                                  >
                                    {n.type === "boost_expiring_soon"
                                      ? "Expiring Soon"
                                      : n.type === "boost_expired"
                                      ? "Expired"
                                      : "Boost"}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {n.type === "boost_expiring_soon"
                                      ? "Renew to keep your reach"
                                      : n.type === "boost_expired"
                                      ? "Your boost has ended"
                                      : ""}
                                  </span>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-2 flex items-center gap-2">
                                {n.link && (
                                  <Link
                                    to={n.link}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                  >
                                    View details <ChevronRight className="h-3 w-3" />
                                  </Link>
                                )}
                                {!n.read ? (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    Mark as read
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markUnread(n.id)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    Mark unread
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(n.id)}
                                  className="ml-auto text-xs text-destructive/70 hover:text-destructive transition-colors flex items-center gap-0.5"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
