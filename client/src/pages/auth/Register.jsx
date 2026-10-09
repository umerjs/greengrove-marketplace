import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, homeForRole } from "../../context/AuthContext";
import { Button, Card, Input } from "../../components/ui";
import { apiMessage } from "../../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("buyer");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", nurseryName: "", address: "" });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role,
        ...(role === "nursery_seller"
          ? { nursery: { name: form.nurseryName, address: form.address, phone: form.phone } }
          : {}),
      };
      const user = await register(payload);
      toast.success(
        user.role === "nursery_seller"
          ? "Account created. Your nursery is pending admin approval."
          : "Welcome to GreenKarachi!",
      );
      navigate(homeForRole(user.role), { replace: true });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="font-display text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Sellers need admin approval before selling.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            ["buyer", "Buyer / Donor"],
            ["nursery_seller", "Nursery seller"],
          ].map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={role === value ? "primary" : "outline"}
              onClick={() => setRole(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <Input required value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" required value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input type="password" required minLength={6} value={form.password} onChange={set("password")} />
          </div>
          {role === "nursery_seller" && (
            <>
              <div>
                <label className="text-sm font-medium">Nursery name</label>
                <Input required value={form.nurseryName} onChange={set("nurseryName")} />
              </div>
              <div>
                <label className="text-sm font-medium">Nursery address</label>
                <Input value={form.address} onChange={set("address")} />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Have an account?{" "}
          <Link to="/auth/login" className="text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
