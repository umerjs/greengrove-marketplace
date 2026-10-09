import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Spinner, statusTone } from "../../components/ui";

export default function AdminSellers() {
  const qc = useQueryClient();
  const { data: pending, isLoading } = useQuery({
    queryKey: ["admin-sellers-pending"],
    queryFn: async () => (await api.get("/admin/sellers/pending")).data,
  });
  const { data: all } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => (await api.get("/admin/sellers")).data,
  });

  const approve = useMutation({
    mutationFn: async ({ id, approve }) => api.patch(`/admin/sellers/${id}/approve`, { approve }),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Nursery approved" : "Nursery rejected");
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
      qc.invalidateQueries({ queryKey: ["admin-sellers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Sellers</h1>
        <p className="mt-1 text-slate-500">Approve applications and manage nurseries.</p>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">
          Approval queue {pending?.length ? <span className="text-amber-600">({pending.length})</span> : null}
        </h2>
        <div className="mt-3 space-y-3">
          {pending?.map((n) => (
            <Card key={n._id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{n.name}</p>
                <p className="text-sm text-slate-500">
                  {n.owner?.name} · {n.owner?.email} · {n.address || "No address"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve.mutate({ id: n._id, approve: true })}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: n._id, approve: false })}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
          {!pending?.length && <p className="text-sm text-slate-500">No pending applications.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">All nurseries</h2>
        <Card className="mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Nursery</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {all?.map((n) => (
                <tr key={n._id} className="border-t">
                  <td className="p-3 font-medium">{n.name}</td>
                  <td className="p-3 text-slate-500">{n.owner?.email}</td>
                  <td className="p-3">
                    <Badge tone={statusTone(n.verificationStatus)}>{n.verificationStatus}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    {n.verificationStatus === "verified" ? (
                      <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: n._id, approve: false })}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => approve.mutate({ id: n._id, approve: true })}>
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
