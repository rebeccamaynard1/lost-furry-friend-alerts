import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "user" | "shelter" | "volunteer" | "rural_partner" | "sponsor" | "admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  refreshRoles: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  isPremium: false,
  subscriptionEnd: null,
  roles: [],
  hasRole: () => false,
  isAdmin: false,
  refreshRoles: async () => {},
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const refreshRoles = useCallback(async () => {
    if (!session?.user) {
      setRoles([]);
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    if (!error && data) setRoles(data.map((r: any) => r.role as AppRole));
  }, [session]);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setIsPremium(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed) {
        setIsPremium(true);
        setSubscriptionEnd(data.subscription_end);
      } else {
        setIsPremium(false);
        setSubscriptionEnd(null);
      }
    } catch (err) {
      console.error("Subscription check failed:", err);
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      return;
    }
    checkSubscription();
    refreshRoles();

    // Non-default roles must be approved by an admin via role_requests.
    // The signup flow inserts into public.role_requests; nothing to do here.



    // Realtime: listen for profile updates from Stripe webhook
    const channel = supabase
      .channel(`profile-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          const status = (payload.new as any)?.subscription_status;
          if (status === "premium") setIsPremium(true);
          else if (status === "free") { setIsPremium(false); setSubscriptionEnd(null); }
        }
      )
      .subscribe();

    // Fallback poll every 5 minutes (in case realtime drops)
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [session, checkSubscription, refreshRoles]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, subscriptionEnd, roles, hasRole, isAdmin, refreshRoles, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
