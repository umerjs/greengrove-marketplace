import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiMessage } from "../../services/api";
import { Badge, Button, Card, Input, Spinner, Textarea } from "../../components/ui";

export default function SellerProfile() {
  const qc = useQueryClient();
  const { data: nursery, isLoading } = useQuery({
    queryKey: ["seller-profile"],
    queryFn: async () => (await api.get("/seller/profile")).data,
  });

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (nursery) {
      setForm({
        name: nursery.name ?? "",
        description: nursery.description ?? "",
        address: nursery.address ?? "",
        phone: nursery.phone ?? "",
        serviceAreas: (nursery.serviceAreas ?? []).join(", "),
      });
    }
  }, [nursery]);

  const save = useMutation({
    mutationFn: async (payload) => api.patch("/seller/profile", payload),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["seller-profile"] });
      qc.invalidateQueries({ queryKey: ["seller-dashboard"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (isLoading || !form) return <Spinner />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">Nursery profile</h1>
        <Badge tone={nursery.verificationStatus === "verified" ? "green" : "amber"}>
          {nursery.verificationStatus}
        </Badge>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nursery name" value={form.name} onChange={set("name")} />
          <Field label="Phone" value={form.phone} onChange={set("phone")} />
          <Field label="Address" value={form.address} onChange={set("address")} />
          <Field label="Service areas (comma separated)" value={form.serviceAreas} onChange={set("serviceAreas")} />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium">Description</label>
          <Textarea rows={3} value={form.description} onChange={set("description")} />
        </div>
        <Button
          className="mt-4"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              ...form,
              serviceAreas: form.serviceAreas
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Reputation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rating {nursery.rating?.average ?? 0} / 5 ({nursery.rating?.count ?? 0} reviews) ·{" "}
          {nursery.totalOrdersFulfilled ?? 0} orders fulfilled
        </p>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} onChange={onChange} />
    </div>
  );
}
