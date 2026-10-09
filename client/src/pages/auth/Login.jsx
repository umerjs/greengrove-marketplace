import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth, homeForRole } from "../../context/AuthContext";
import { Button, Card, Input } from "../../components/ui";
import { apiMessage } from "../../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(homeForRole(user.role), { replace: true });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <h1 className="font-display text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">You'll be taken to your dashboard.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                aria-label="Toggle password"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/auth/register" className="text-emerald-600 hover:underline">
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          Demo: admin@greenkarachi.pk · seller1@gulshan.pk · buyer1@company.pk — password{" "}
          <code>password123</code>
        </div>
      </Card>
    </div>
  );
}
