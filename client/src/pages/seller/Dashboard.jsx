import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Boxes, PackageCheck, TriangleAlert, Wallet } from "lucide-react";
import { api } from "../../services/api";
import { Badge, Card, Spinner } from "../../components/ui";

export default function SellerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: async () => (await api.get("/seller/dashboard")).data,
  });

  if (isLoading) return <Spinner />;
  const nursery = data?.nursery;
  const verified = nursery?.verificationStatus === "verified";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{nursery?.name ?? "Your nursery"}</h1>
          <p className="mt-1 text-slate-500">Your stock and sub-orders on GreenKarachi.</p>
        </div>
        <Badge tone={verified ? "green" : "amber"}>{nursery?.verificationStatus}</Badge>
      </div>

      {!verified && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Your nursery is <b>{nursery?.verificationStatus}</b>. You can browse, but listing stock and
          receiving orders unlocks once an admin verifies you.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Boxes className="h-5 w-5" />} label="Units in stock" value={(data?.totalStock ?? 0).toLocaleString()} />
        <Stat icon={<TriangleAlert className="h-5 w-5" />} label="Low-stock products" value={data?.lowStock ?? 0} />
        <Stat icon={<PackageCheck className="h-5 w-5" />} label="Orders to fulfil" value={(data?.ordersByStatus?.pending ?? 0) + (data?.ordersByStatus?.accepted ?? 0)} />
        <Stat icon={<Wallet className="h-5 w-5" />} label="Delivered revenue" value={`PKR ${(data?.revenueDeliveredPKR ?? 0).toLocaleString()}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold">Quick links</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Link to="/seller/inventory" className="block text-emerald-600 hover:underline">
              Update inventory →
            </Link>
            <Link to="/seller/orders" className="block text-emerald-600 hover:underline">
              Manage sub-orders →
            </Link>
            <Link to="/seller/profile" className="block text-emerald-600 hover:underline">
              Edit nursery profile →
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            <h2 className="font-display text-xl font-semibold">Recent activity</h2>
          </div>
          <div className="mt-3 space-y-2">
            {data?.notifications?.length ? (
              data.notifications.map((n) => (
                <div key={n._id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No activity yet.</p>
            )}
          </div>
        </Card>
      </div>
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
