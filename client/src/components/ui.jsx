import { Link } from "react-router-dom";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-emerald-600 text-emerald-700 hover:bg-emerald-50",
    ghost: "text-emerald-700 hover:bg-emerald-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    muted: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ to, children, variant = "primary", className = "" }) {
  const styles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-emerald-600 text-emerald-700 hover:bg-emerald-50",
  }[variant];
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading…" }) {
  return <p className="py-8 text-center text-sm text-slate-500">{label}</p>;
}

export const statusTone = (status) =>
  ({
    pending: "amber",
    confirmed: "blue",
    accepted: "blue",
    dispatched: "blue",
    partially_dispatched: "amber",
    delivered: "green",
    fulfilled: "green",
    verified: "green",
    rejected: "red",
    cancelled: "red",
    suspended: "red",
    open: "amber",
    matched: "blue",
    ordered: "green",
  })[status] ?? "slate";
