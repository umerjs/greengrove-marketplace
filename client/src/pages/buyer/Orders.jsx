import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Badge, Card, Spinner, statusTone } from "../../components/ui";

export default function BuyerOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders/my")).data,
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">My orders</h1>
      <p className="mt-1 text-slate-500">Consolidated orders with cross-nursery status.</p>

      <div className="mt-6 space-y-3">
        {data?.map((o) => (
          <Link key={o._id} to={`/buyer/orders/${o._id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 transition hover:border-emerald-400">
              <div>
                <p className="font-medium">{o.product?.name}</p>
                <p className="text-sm text-slate-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.totalQuantity.toLocaleString()} units · PKR{" "}
                  {o.totalAmountPKR.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {o.sellerOrders?.length ?? 0} sub-order(s)
                </span>
                <Badge tone={statusTone(o.status)}>{o.status.replace("_", " ")}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {!data?.length && <p className="text-sm text-slate-500">No orders yet.</p>}
      </div>
    </div>
  );
}
