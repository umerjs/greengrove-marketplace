import { Outlet, Link } from "react-router-dom";
import { Navbar } from "./Navbar";

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        GreenKarachi · B2B plant marketplace · Karachi, Pakistan —{" "}
        <Link to="/marketplace" className="text-emerald-600 hover:underline">
          Browse stock
        </Link>
      </footer>
    </div>
  );
}
