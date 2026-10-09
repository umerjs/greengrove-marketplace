import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Package, Wallet } from "lucide-react";
import { api } from "../../services/api";
import { Badge, Card, Spinner, statusTone } from "../../components/ui";

export default function BuyerDashboard() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders/my")).data,
  });
  const { data: requests } = useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => (await api.get("/marketplace/requests/my")).data,
  });

  if (isLoading) return <Spinner />;

  const active = orders?.filter((o) => !["fulfilled", "cancelled"].includes(o.status)).length ?? 0;
  const spent = orders
    ?.filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmountPKR, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Buyer dashboard</h1>
        <p className="mt-1 text-slate-500">Your bulk orders and demand requests.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Package className="h-5 w-5" />} label="Total orders" value={orders?.length ?? 0} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Active orders" value={active} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Order value" value={`PKR ${spent.toLocaleString()}`} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link to="/buyer/orders" className="text-sm text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {orders?.slice(0, 5).map((o) => (
            <Link key={o._id} to={`/buyer/orders/${o._id}`}>
              <Card className="flex items-center justify-between transition hover:border-emerald-400">
                <div>
                  <p className="font-medium">{o.product?.name}</p>
                  <p className="text-sm text-slate-500">
                    {o.totalQuantity.toLocaleString()} units · PKR {o.totalAmountPKR.toLocaleString()}
                  </p>
                </div>
                <Badge tone={statusTone(o.status)}>{o.status.replace("_", " ")}</Badge>
              </Card>
            </Link>
          ))}
          {!orders?.length && <p className="text-sm text-slate-500">No orders yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Demand requests</h2>
        <div className="mt-3 space-y-3">
          {requests?.map((r) => (
            <Card key={r._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{r.product?.name}</p>
                <p className="text-sm text-slate-500">
                  Requested {r.quantityRequested.toLocaleString()} · {r.matchSummary?.nurseryCount ?? 0} nurseries match
                </p>
              </div>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </Card>
          ))}
          {!requests?.length && <p className="text-sm text-slate-500">No demand requests yet.</p>}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card>
      <div className="flex items-center gap-3 text-emerald-600">{icon}</div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Card>
  );
}
