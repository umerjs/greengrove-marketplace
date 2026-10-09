import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Search, Sprout, TrendingUp, Users } from "lucide-react";
import { api } from "../services/api";
import { Card, LinkButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { key: "plants", label: "Plants & saplings" },
  { key: "fertilizers", label: "Fertilizers" },
  { key: "seeds", label: "Seeds" },
  { key: "tools", label: "Tools" },
];

export default function Home() {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => (await api.get("/marketplace/stats")).data,
  });
  const { data: nurseries } = useQuery({
    queryKey: ["featured-nurseries"],
    queryFn: async () => (await api.get("/marketplace/nurseries")).data,
  });

  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-2xl bg-emerald-900 px-6 py-14 text-white sm:px-12">
        <p className="text-sm font-medium text-emerald-300">B2B wholesale plant marketplace · Karachi</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          All of Karachi's nursery stock. One wholesale view.
        </h1>
        <p className="mt-4 max-w-xl text-white/80">
          Bulk buyers see live totals across every verified nursery, then place a single order that the
          platform splits automatically across sellers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/marketplace" variant="primary" className="!bg-emerald-500 !text-emerald-950 hover:!bg-emerald-400">
            <Search className="h-4 w-4" /> Browse aggregated stock
          </LinkButton>
          <LinkButton to={user ? "/marketplace" : "/auth/register"} variant="outline" className="!border-white/40 !text-white hover:!bg-white/10">
            Post a demand request
          </LinkButton>
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
          {[
            ["Verified nurseries", stats?.verifiedNurseries],
            ["Units in stock", stats?.totalStock?.toLocaleString()],
            ["Catalog products", stats?.catalogProducts],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white/10 p-4">
              <p className="font-display text-2xl font-semibold">{value ?? "—"}</p>
              <p className="text-xs text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Shop by category</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.key} to={`/marketplace?category=${c.key}`}>
              <Card className="h-full transition hover:border-emerald-400 hover:shadow">
                <Sprout className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 font-medium">{c.label}</p>
                <p className="text-sm text-slate-500">See live totals across all nurseries</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          <h2 className="font-display text-2xl font-semibold">Featured nurseries</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nurseries?.map((n) => (
            <Card key={n._id}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{n.name}</p>
                  <p className="text-xs text-slate-500">
                    {n.serviceAreas?.length ? n.serviceAreas.join(", ") : "Karachi"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{n.description || "Verified wholesale nursery."}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <TrendingUp className="h-3.5 w-3.5" /> {n.totalOrdersFulfilled ?? 0} orders fulfilled
              </div>
            </Card>
          ))}
          {!nurseries?.length && <p className="text-sm text-slate-500">No verified nurseries yet.</p>}
        </div>
      </section>
    </div>
  );
}
