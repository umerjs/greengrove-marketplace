import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sprout } from "lucide-react";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Input, Spinner, Textarea } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/marketplace/products/${id}`)).data,
  });

  const request = useMutation({
    mutationFn: async (quantityRequested) =>
      api.post("/marketplace/request", { product: id, quantityRequested }),
    onSuccess: () => {
      toast.success("Demand request posted.");
      setShowRequest(false);
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading) return <Spinner label="Loading product…" />;
  if (!product) return <p className="text-slate-500">Product not available.</p>;

  const goCheckout = () => {
    if (!user) return navigate("/auth/login");
    if (user.role !== "buyer") return toast.error("Only buyers can place orders.");
    const qty = parseInt(quantity, 10);
    if (!(qty > 0)) return toast.error("Enter a quantity.");
    if (qty > product.totalAvailable) return toast.error(`Only ${product.totalAvailable.toLocaleString()} available.`);
    navigate(`/checkout?product=${id}&quantity=${qty}`);
  };

  return (
    <div className="space-y-6">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sprout className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold">{product.name}</h1>
              <Badge>{product.category}</Badge>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Total available" value={product.totalAvailable.toLocaleString()} />
            <Stat label="Nurseries" value={product.nurseryCount} />
            <Stat label="Price / unit" value={`PKR ${product.minPrice} – ${product.maxPrice}`} />
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Buyers see one aggregated number — individual nursery stock stays private. Your order is
            automatically split across the cheapest verified nurseries that can cover it.
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Bulk order</h2>
          <p className="mt-1 text-sm text-slate-500">Enter how many {product.unit} you need.</p>
          <Input
            type="number"
            min={1}
            className="mt-4"
            placeholder="e.g. 10000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button className="mt-3 w-full" onClick={goCheckout}>
            Request to purchase
          </Button>

          <button
            className="mt-4 w-full text-sm text-emerald-600 hover:underline"
            onClick={() => setShowRequest((v) => !v)}
          >
            Or post a demand request without ordering
          </button>
          {showRequest && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Notes (optional)"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={request.isPending}
                onClick={() => {
                  const qty = parseInt(quantity, 10);
                  if (!(qty > 0)) return toast.error("Enter a quantity above first.");
                  request.mutate(qty);
                }}
              >
                {request.isPending ? "Posting…" : "Post demand request"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
