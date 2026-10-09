import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Input, Spinner } from "../../components/ui";

export default function SellerInventory() {
  const qc = useQueryClient();
  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ["seller-inventory"],
    queryFn: async () => (await api.get("/seller/inventory")).data,
  });
  const { data: catalog } = useQuery({
    queryKey: ["seller-catalog"],
    queryFn: async () => (await api.get("/seller/catalog")).data,
  });

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [threshold, setThreshold] = useState("0");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["seller-inventory"] });
    qc.invalidateQueries({ queryKey: ["seller-dashboard"] });
  };

  const upsert = useMutation({
    mutationFn: async (payload) => api.post("/seller/inventory", payload),
    onSuccess: () => {
      toast.success("Stock saved");
      setQty("");
      setPrice("");
      invalidate();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isListed }) => api.patch(`/seller/inventory/${id}`, { isListed }),
    onSuccess: invalidate,
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner />;

  if (error?.response?.status === 403) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <h1 className="font-display text-xl font-semibold">Inventory locked</h1>
        <p className="mt-1 text-sm text-amber-900">
          Your nursery is awaiting admin approval. You can list stock once verified.
        </p>
      </Card>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    const q = parseInt(qty, 10);
    const p = parseFloat(price);
    if (!productId) return toast.error("Choose a product");
    if (!(q >= 0) || !(p >= 0)) return toast.error("Enter valid quantity and price");
    upsert.mutate({
      product: productId,
      quantityAvailable: q,
      pricePerUnit: p,
      lowStockThreshold: parseInt(threshold, 10) || 0,
      isListed: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Inventory</h1>
        <p className="mt-1 text-slate-500">
          Set absolute stock counts — "I have 350 plants". Buyers only see platform totals.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Add / update stock</h2>
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select product…</option>
            {catalog?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
          <Input type="number" min={0} placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input type="number" min={0} placeholder="Price/unit" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input type="number" min={0} placeholder="Low-stock at" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price / unit</th>
              <th className="p-3">Available</th>
              <th className="p-3">Reserved</th>
              <th className="p-3">Listed</th>
            </tr>
          </thead>
          <tbody>
            {inventory?.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-3 font-medium">
                  {row.product?.name}
                  {row.quantityAvailable <= row.lowStockThreshold && (
                    <span className="ml-2">
                      <Badge tone="red">low</Badge>
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-500">{row.product?.category}</td>
                <td className="p-3">PKR {row.pricePerUnit}</td>
                <td className="p-3">{row.quantityAvailable.toLocaleString()}</td>
                <td className="p-3 text-slate-500">{row.reservedQty}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant={row.isListed ? "primary" : "muted"}
                    onClick={() => toggle.mutate({ id: row._id, isListed: !row.isListed })}
                  >
                    {row.isListed ? "Listed" : "Hidden"}
                  </Button>
                </td>
              </tr>
            ))}
            {!inventory?.length && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  No stock listed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
