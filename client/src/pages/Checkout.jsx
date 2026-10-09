import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { api, apiMessage } from "../services/api";
import { Badge, Button, Card, Input, Spinner, Textarea } from "../components/ui";

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const product = params.get("product");
  const quantity = params.get("quantity");

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const checkoutStartedFor = useRef(null);

  const startCheckout = useCallback(async () => {
    setLoading(true);
    setQuote(null);
    try {
      const { data } = await api.post("/orders/checkout", { product, quantity: Number(quantity) });
      setQuote(data);
    } catch (err) {
      toast.error(apiMessage(err));
      navigate(`/marketplace/${product}`);
    } finally {
      setLoading(false);
    }
  }, [product, quantity, navigate]);

  useEffect(() => {
    if (!product || !quantity) {
      navigate("/marketplace");
      return;
    }
    const checkoutKey = `${product}:${quantity}`;
    if (checkoutStartedFor.current === checkoutKey) return;
    checkoutStartedFor.current = checkoutKey;
    startCheckout();
  }, [product, quantity, startCheckout, navigate]);

  useEffect(() => {
    if (!quote) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(quote.expiresAt) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [quote]);

  const confirm = async () => {
    if (!address.trim()) return toast.error("Enter a delivery address.");
    setConfirming(true);
    try {
      const { data } = await api.post("/orders/confirm", {
        checkoutId: quote.checkoutId,
        deliveryAddress: address,
        notes,
      });
      toast.success("Order confirmed!");
      navigate(`/buyer/orders/${data._id}`);
    } catch (err) {
      toast.error(apiMessage(err));
      setConfirming(false);
    }
  };

  if (loading) return <Spinner label="Holding stock for 10 minutes…" />;
  if (!quote) return null;

  const expired = secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      <p className="mt-1 text-slate-500">
        Stock is soft-reserved for you. Confirm before the hold expires.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Nursery split preview</h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              <Clock className="h-4 w-4" /> {expired ? "Expired" : `${mm}:${ss}`}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Your order of {quote.totalQuantity.toLocaleString()} × {quote.product.name} is split across{" "}
            {quote.splits.length} {quote.splits.length === 1 ? "nursery" : "nurseries"}.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Nursery</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Price / unit</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.splits.map((s) => (
                  <tr key={s.nurseryName} className="border-t">
                    <td className="p-3 font-medium">{s.nurseryName}</td>
                    <td className="p-3">{s.quantity.toLocaleString()}</td>
                    <td className="p-3">PKR {s.pricePerUnit}</td>
                    <td className="p-3 text-right">PKR {s.amountPKR.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Sellers handle their own delivery. Payment is cash on delivery between you and each nursery.
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Delivery details</h2>
          <label className="mt-4 block text-sm font-medium">Delivery address</label>
          <Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, Karachi" />
          <label className="mt-3 block text-sm font-medium">Notes (optional)</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="mt-5 space-y-1 border-t pt-4 text-sm">
            <Row label="Total quantity" value={quote.totalQuantity.toLocaleString()} />
            <Row label="Weighted avg price" value={`PKR ${quote.priceSnapshot.toFixed(2)} / unit`} />
            <div className="flex items-center justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>PKR {quote.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {expired ? (
            <Button className="mt-4 w-full" onClick={startCheckout}>
              Reservation expired — try again
            </Button>
          ) : (
            <Button className="mt-4 w-full" disabled={confirming} onClick={confirm}>
              {confirming ? "Confirming…" : "Confirm order (COD)"}
            </Button>
          )}
          <Badge tone="amber">
            <span className="mr-1">COD</span>
          </Badge>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
