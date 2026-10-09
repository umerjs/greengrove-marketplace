import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications/my")).data,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: async () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;
  const count = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-white/90 hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-emerald-950">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-emerald-600 hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data?.notifications?.length ? (
              data.notifications.map((n) => (
                <div
                  key={n._id}
                  className={`border-b px-3 py-2 text-sm last:border-0 ${n.isRead ? "opacity-60" : ""}`}
                >
                  <p>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-slate-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
