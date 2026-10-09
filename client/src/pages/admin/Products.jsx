import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Input, Select, Spinner } from "../../components/ui";

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await api.get("/admin/products")).data,
  });
  const [form, setForm] = useState({ name: "", category: "plants", unit: "pieces" });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["seller-catalog"] });
  };

  const create = useMutation({
    mutationFn: async (payload) => api.post("/admin/products", payload),
    onSuccess: () => {
      toast.success("Product added");
      setForm({ name: "", category: "plants", unit: "pieces" });
      invalidate();
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }) => api.patch(`/admin/products/${id}`, { isActive }),
    onSuccess: invalidate,
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Product catalog</h1>
        <p className="mt-1 text-slate-500">Platform-wide product types sellers can list.</p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Add product type</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Enter a product name");
            create.mutate(form);
          }}
        >
          <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="plants">Plants</option>
            <option value="fertilizers">Fertilizers</option>
            <option value="seeds">Seeds</option>
            <option value="tools">Tools</option>
          </Select>
          <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="pieces">Pieces</option>
            <option value="kg">Kg</option>
            <option value="litre">Litre</option>
            <option value="bag">Bag</option>
          </Select>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-slate-500">{p.category}</td>
                <td className="p-3 text-slate-500">{p.unit}</td>
                <td className="p-3">
                  <Badge tone={p.isActive ? "green" : "slate"}>{p.isActive ? "active" : "inactive"}</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggle.mutate({ id: p._id, isActive: !p.isActive })}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
