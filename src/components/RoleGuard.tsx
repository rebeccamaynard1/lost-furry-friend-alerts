import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

interface RoleGuardProps {
  allowed: AppRole[];
  children: React.ReactNode;
  /** If true, only requires authentication (any role). */
  authOnly?: boolean;
}

export default function RoleGuard({ allowed, children, authOnly = false }: RoleGuardProps) {
  const { user, loading, roles, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (authOnly) return <>{children}</>;

  // Admin always allowed
  const ok = isAdmin || allowed.some((r) => roles.includes(r));
  if (!ok) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-2">
            <h2 className="text-xl font-bold font-heading">Access restricted</h2>
            <p className="text-muted-foreground text-sm">
              This page is for: {allowed.join(", ").replace(/_/g, " ")}.
              Update your account role from your profile if you qualify.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
