import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Input, Spinner, statusTone } from "../../components/ui";

const ACTIONS = {
  pending: [
    ["accepted", "Accept"],
    ["rejected", "Reject"],
  ],
  accepted: [
    ["dispatched", "Mark dispatched"],
    ["rejected", "Reject"],
  ],
  dispatched: [["delivered", "Mark delivered"]],
};

export default function SellerOrders() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => (await api.get("/seller/orders")).data,
  });

  const update = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) =>
      api.patch(`/seller/orders/${id}/status`, { status, rejectionReason }),
    onSuccess: () => {
      toast.success("Order updated");
      setRejecting(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["seller-orders"] });
      qc.invalidateQueries({ queryKey: ["seller-dashboard"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner />;
  if (error?.response?.status === 403) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <h1 className="font-display text-xl font-semibold">Orders locked</h1>
        <p className="mt-1 text-sm text-amber-900">Available once your nursery is verified.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Sub-orders</h1>
        <p className="mt-1 text-slate-500">Accept, dispatch and deliver orders assigned to your nursery.</p>
      </div>

      <div className="space-y-3">
        {data?.map((o) => (
          <Card key={o._id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {o.product?.name} — {o.quantityAssigned.toLocaleString()} units
                </p>
                <p className="text-sm text-slate-500">
                  PKR {o.amountPKR.toLocaleString()} · {o.parentOrder?.deliveryAddress ?? "—"}
                </p>
                <p className="text-xs text-slate-400">
                  Placed {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge tone={statusTone(o.status)}>{o.status}</Badge>
            </div>

            {o.rejectionReason && (
              <p className="mt-2 text-sm text-red-600">Rejected: {o.rejectionReason}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {(ACTIONS[o.status] ?? []).map(([status, label]) =>
                status === "rejected" ? (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    onClick={() => setRejecting(o._id)}
                  >
                    {label}
                  </Button>
                ) : (
                  <Button
                    key={status}
                    size="sm"
                    onClick={() => update.mutate({ id: o._id, status })}
                  >
                    {label}
                  </Button>
                ),
              )}
            </div>

            {rejecting === o._id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  className="max-w-sm"
                  placeholder="Reason for rejection"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => update.mutate({ id: o._id, status: "rejected", rejectionReason: reason })}
                >
                  Confirm reject
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!data?.length && <p className="text-sm text-slate-500">No sub-orders assigned yet.</p>}
      </div>
    </div>
  );
}
