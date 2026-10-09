import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Badge, Card, Spinner, statusTone } from "../../components/ui";

export default function AdminOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await api.get("/admin/orders")).data,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">All orders</h1>
        <p className="mt-1 text-slate-500">Monitor every order and its nursery sub-orders.</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Buyer</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Sub-orders</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3 font-medium">{o.product?.name}</td>
                <td className="p-3 text-slate-500">{o.buyer?.name}</td>
                <td className="p-3">{o.totalQuantity.toLocaleString()}</td>
                <td className="p-3">PKR {o.totalAmountPKR.toLocaleString()}</td>
                <td className="p-3 text-slate-500">{o.sellerOrders?.length ?? 0}</td>
                <td className="p-3">
                  <Badge tone={statusTone(o.status)}>{o.status.replace("_", " ")}</Badge>
                </td>
                <td className="p-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
