import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchRole, homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — GreenKarachi" },
      { name: "description", content: "Sign in to GreenKarachi as a buyer, nursery seller or admin." },
      { property: "og:title", content: "Sign in — GreenKarachi" },
      { property: "og:description", content: "Sign in to GreenKarachi as a buyer, nursery seller or admin." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "nursery_seller">("buyer");
  const [nurseryName, setNurseryName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const r = await fetchRole(data.user.id);
        if (!r) throw new Error("No role assigned to this account.");
        navigate({ to: homeForRole(r) });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/login",
            data: { role, nursery_name: nurseryName },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <Leaf className="h-5 w-5" /> GreenKarachi
        </div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            All of Karachi's nursery stock.
            <br />
            One wholesale view.
          </h2>
          <p className="mt-4 max-w-md opacity-80">
            Bulk buyers see live totals across verified nurseries. Sellers reach landscapers and businesses at scale.
          </p>
        </div>
        <p className="text-sm opacity-60">B2B plant marketplace · Karachi, Pakistan</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "You'll be taken to your dashboard." : "Sellers need admin approval before selling."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(["buyer", "nursery_seller"] as const).map((r) => (
                  <Button key={r} type="button" variant={role === r ? "default" : "outline"} onClick={() => setRole(r)}>
                    {r === "buyer" ? "Buyer" : "Nursery seller"}
                  </Button>
                ))}
              </div>
              {role === "nursery_seller" && (
                <div className="space-y-2">
                  <Label htmlFor="nursery">Nursery name</Label>
                  <Input id="nursery" required value={nurseryName} onChange={(e) => setNurseryName(e.target.value)} />
                </div>
              )}
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-primary hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
