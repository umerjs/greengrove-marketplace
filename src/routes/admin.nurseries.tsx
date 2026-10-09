import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/nurseries")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nurseries — GreenKarachi Admin" },
      { name: "description", content: "Approve or reject nursery seller applications." },
      { property: "og:title", content: "Nurseries — GreenKarachi Admin" },
      { property: "og:description", content: "Approve or reject nursery seller applications." },
    ],
  }),
  component: AdminNurseries,
});

const statusStyle: Record<string, string> = {
  verified: "bg-success/15 text-success",
  pending: "bg-warning/20 text-foreground",
  rejected: "bg-destructive/15 text-destructive",
};

function AdminNurseries() {
  const user = useRequireRole("super_admin");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-nurseries"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("nurseries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (!user) return null;

  const setStatus = async (id: string, verification_status: "verified" | "rejected") => {
    const { error } = await supabase.from("nurseries").update({ verification_status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Nursery ${verification_status}`);
    qc.invalidateQueries({ queryKey: ["admin-nurseries"] });
  };

  return (
    <AppShell title="Nurseries" subtitle="Review seller applications. Only verified nurseries appear in buyer totals." roleLabel="Super admin" email={user.email}>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="p-3">Nursery</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-3 font-medium">{n.name}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyle[n.verification_status]}`}>
                    {n.verification_status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</td>
                <td className="space-x-2 p-3 text-right">
                  <Button size="sm" disabled={n.verification_status === "verified"} onClick={() => setStatus(n.id, "verified")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={n.verification_status === "rejected"} onClick={() => setStatus(n.id, "rejected")}>
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
