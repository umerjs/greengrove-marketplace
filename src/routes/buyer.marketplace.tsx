import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/buyer/marketplace")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Marketplace — GreenKarachi" },
      { name: "description", content: "Total available plant stock across all verified Karachi nurseries." },
      { property: "og:title", content: "Marketplace — GreenKarachi" },
      { property: "og:description", content: "Total available plant stock across all verified Karachi nurseries." },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const user = useRequireRole("buyer");
  const { data, isLoading } = useQuery({
    queryKey: ["stock-summary"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_stock_summary").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  if (!user) return null;

  return (
    <AppShell title="Marketplace" subtitle="Live stock totals across all verified nurseries." roleLabel="Buyer" email={user.email}>
      {isLoading ? (
        <p className="text-muted-foreground">Loading stock…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <div key={p.product_id} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <Sprout className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.category}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.name}s</h3>
              <p className="mt-1 font-display text-3xl font-semibold text-primary">
                {Number(p.total_quantity ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                available across {p.nursery_count} {p.nursery_count === 1 ? "nursery" : "nurseries"}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
