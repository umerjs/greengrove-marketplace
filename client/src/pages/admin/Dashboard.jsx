import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Boxes, ClipboardList, Leaf, Store, Wallet } from "lucide-react";
import { api } from "../../services/api";
import { Badge, Card, Spinner, statusTone } from "../../components/ui";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  });
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await api.get("/admin/orders")).data,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>
        <p className="mt-1 text-slate-500">Platform-wide overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Store className="h-5 w-5" />} label="Verified nurseries" value={stats?.verifiedNurseries ?? 0} />
        <Stat icon={<Leaf className="h-5 w-5" />} label="Pending approvals" value={stats?.pendingNurseries ?? 0} />
        <Stat icon={<Boxes className="h-5 w-5" />} label="Inventory records" value={stats?.inventoryRecords ?? 0} />
        <Stat icon={<Wallet className="h-5 w-5" />} label="GMV" value={`PKR ${(stats?.gmvPKR ?? 0).toLocaleString()}`} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          </div>
          <Link to="/admin/orders" className="text-sm text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {orders?.slice(0, 5).map((o) => (
            <Card key={o._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{o.product?.name}</p>
                <p className="text-sm text-slate-500">
                  {o.buyer?.name} · {o.totalQuantity.toLocaleString()} units · PKR{" "}
                  {o.totalAmountPKR.toLocaleString()}
                </p>
              </div>
              <Badge tone={statusTone(o.status)}>{o.status.replace("_", " ")}</Badge>
            </Card>
          ))}
          {!orders?.length && <p className="text-sm text-slate-500">No orders yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <Card>
      <div className="text-emerald-600">{icon}</div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Card>
  );
}
