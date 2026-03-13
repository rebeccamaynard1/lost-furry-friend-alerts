import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  isPremium: false,
  subscriptionEnd: null,
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

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
    } catch {
      // Subscription check failed silently
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
    if (session) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 60000);
      return () => clearInterval(interval);
    }
  }, [session, checkSubscription]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, subscriptionEnd, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
