import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "nursery_seller" | "buyer";

export const homeForRole = (role: AppRole) =>
  role === "super_admin"
    ? "/admin/nurseries"
    : role === "nursery_seller"
      ? "/seller/dashboard"
      : "/buyer/marketplace";

export async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as AppRole) ?? null;
}

/** UI gate only — data access is enforced by database security rules. */
export function useRequireRole(role: AppRole) {
  const navigate = useNavigate();
  const [state, setState] = useState<{ userId: string; email: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate({ to: "/login", replace: true });
      const r = await fetchRole(data.user.id);
      if (!active) return;
      if (r !== role) return navigate({ to: r ? homeForRole(r) : "/login", replace: true });
      setState({ userId: data.user.id, email: data.user.email ?? "" });
    })();
    return () => {
      active = false;
    };
  }, [role, navigate]);

  return state;
}
