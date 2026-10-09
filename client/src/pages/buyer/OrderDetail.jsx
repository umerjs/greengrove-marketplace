import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Spinner, statusTone } from "../../components/ui";

const STEPS = ["confirmed", "partially_dispatched", "fulfilled"];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
  });

  const cancel = useMutation({
    mutationFn: async () => api.post(`/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success("Order cancelled.");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner />;
  if (!order) return <p className="text-slate-500">Order not found.</p>;

  const cancellable = ["pending", "confirmed"].includes(order.status);

  return (
    <div className="space-y-6">
      <Link to="/buyer/orders" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{order.product?.name}</h1>
            <p className="text-sm text-slate-500">Order {order._id}</p>
            <p className="text-sm text-slate-500">Deliver to: {order.deliveryAddress}</p>
          </div>
          <Badge tone={statusTone(order.status)}>{order.status.replace("_", " ")}</Badge>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((step, i) => {
            const idx = STEPS.indexOf(order.status);
            const reached = order.status === "cancelled" ? false : i <= (idx === -1 ? 0 : idx);
            return (
              <div key={step} className="flex flex-1 items-center gap-2">
                <div className={`h-2 flex-1 rounded-full ${reached ? "bg-emerald-500" : "bg-slate-200"}`} />
                <span className="hidden text-xs capitalize text-slate-500 sm:inline">{step.replace("_", " ")}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Total quantity" value={order.totalQuantity.toLocaleString()} />
          <Metric label="Weighted avg price" value={`PKR ${order.priceSnapshot.toFixed(2)}`} />
          <Metric label="Total" value={`PKR ${order.totalAmountPKR.toLocaleString()}`} />
        </div>

        {cancellable && (
          <Button
            variant="danger"
            className="mt-6"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Cancel order
          </Button>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-xl font-semibold">Nursery sub-orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Nursery</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rejection</th>
              </tr>
            </thead>
            <tbody>
              {order.sellerOrders?.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3 font-medium">{s.nursery?.name ?? s.nursery}</td>
                  <td className="p-3">{s.quantityAssigned.toLocaleString()}</td>
                  <td className="p-3">PKR {s.amountPKR.toLocaleString()}</td>
                  <td className="p-3">
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  </td>
                  <td className="p-3 text-slate-500">{s.rejectionReason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
