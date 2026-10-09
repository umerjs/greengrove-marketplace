import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Sprout } from "lucide-react";
import { api } from "../../services/api";
import { Badge, Card, Input, Select, Spinner } from "../../components/ui";

export default function MarketplaceIndex() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const category = params.get("category") ?? "";
  const minQty = params.get("minQty") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-products", search, category, minQty],
    queryFn: async () =>
      (
        await api.get("/marketplace/products", {
          params: { search: search || undefined, category: category || undefined, minQty: minQty || undefined },
        })
      ).data,
  });

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Marketplace</h1>
          <p className="mt-1 text-slate-500">Live stock totals across all verified nurseries.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ search });
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </form>
        <Select value={category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          <option value="plants">Plants</option>
          <option value="fertilizers">Fertilizers</option>
          <option value="seeds">Seeds</option>
          <option value="tools">Tools</option>
        </Select>
        <Input
          type="number"
          min={0}
          value={minQty}
          onChange={(e) => update({ minQty: e.target.value })}
          placeholder="Min qty"
        />
      </div>

      {isLoading ? (
        <Spinner label="Loading stock…" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <Link key={p._id} to={`/marketplace/${p._id}`}>
              <Card className="h-full transition hover:border-emerald-400 hover:shadow">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                    <Sprout className="h-5 w-5" />
                  </span>
                  <Badge>{p.category}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 font-display text-3xl font-semibold text-emerald-700">
                  {p.totalAvailable.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">
                  {p.unit} available across {p.nurseryCount} {p.nurseryCount === 1 ? "nursery" : "nurseries"}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  PKR {p.minPrice} – {p.maxPrice} / unit
                </p>
              </Card>
            </Link>
          ))}
          {!data?.length && (
            <p className="text-sm text-slate-500">No products match your filters right now.</p>
          )}
        </div>
      )}
    </div>
  );
}
