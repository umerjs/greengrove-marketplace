import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/seller/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Seller dashboard — GreenKarachi" },
      { name: "description", content: "Manage your nursery's plant inventory on GreenKarachi." },
      { property: "og:title", content: "Seller dashboard — GreenKarachi" },
      { property: "og:description", content: "Manage your nursery's plant inventory on GreenKarachi." },
    ],
  }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const user = useRequireRole("nursery_seller");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["seller", user?.userId],
    enabled: !!user,
    queryFn: async () => {
      const { data: nursery } = await supabase.from("nurseries").select("*").eq("owner_user_id", user!.userId).maybeSingle();
      const [{ data: inv }, { data: products }] = await Promise.all([
        nursery
          ? supabase.from("nursery_inventory").select("*").eq("nursery_id", nursery.id)
          : Promise.resolve({ data: [] as never[] }),
        supabase.from("product_catalog").select("*").order("name"),
      ]);
      return { nursery, inv: inv ?? [], products: products ?? [] };
    },
  });
  if (!user) return null;
  const nursery = data?.nursery;
  const verified = nursery?.verification_status === "verified";

  return (
    <AppShell
      title={nursery?.name ?? "Your nursery"}
      subtitle="Update how many plants you have available for bulk buyers."
      roleLabel="Nursery seller"
      email={user.email}
    >
      {nursery && !verified && (
        <div className="mb-6 rounded-lg border border-warning bg-warning/15 p-4 text-sm">
          Your nursery is <b>{nursery.verification_status}</b>. You can update stock once an admin verifies it.
        </div>
      )}
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price / unit (PKR)</th>
              <th className="p-3">Quantity available</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.products.map((p) => (
              <InventoryRow
                key={p.id}
                product={p}
                nurseryId={nursery?.id}
                row={data.inv.find((i) => i.product_id === p.id)}
                disabled={!verified}
                onSaved={() => qc.invalidateQueries({ queryKey: ["seller"] })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function InventoryRow({
  product,
  row,
  nurseryId,
  disabled,
  onSaved,
}: {
  product: { id: string; name: string; category: string };
  row: { id: string; quantity_available: number; price_per_unit: number } | undefined;
  nurseryId: string | undefined;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState(String(row?.quantity_available ?? 0));
  const [price, setPrice] = useState(String(row?.price_per_unit ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nurseryId) return;
    const q = parseInt(qty, 10);
    const pr = parseFloat(price);
    if (!(q >= 0) || !(pr >= 0)) {
      toast.error("Enter valid, non-negative numbers.");
      return;
    }
    setSaving(true);
    const { error } = row
      ? await supabase.from("nursery_inventory").update({ quantity_available: q, price_per_unit: pr }).eq("id", row.id)
      : await supabase.from("nursery_inventory").insert({ nursery_id: nurseryId, product_id: product.id, quantity_available: q, price_per_unit: pr });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${product.name} updated`);
    onSaved();
  };

  return (
    <tr className="border-t">
      <td className="p-3 font-medium">{product.name}</td>
      <td className="p-3 text-muted-foreground">{product.category}</td>
      <td className="p-3">
        <Input type="number" min={0} className="w-28" value={price} disabled={disabled} onChange={(e) => setPrice(e.target.value)} />
      </td>
      <td className="p-3">
        <Input type="number" min={0} className="w-32" value={qty} disabled={disabled} onChange={(e) => setQty(e.target.value)} />
      </td>
      <td className="p-3 text-right">
        <Button size="sm" disabled={disabled || saving} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </td>
    </tr>
  );
}
