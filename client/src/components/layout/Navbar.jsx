import { Link, useNavigate } from "react-router-dom";
import { Leaf, LogOut, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../NotificationBell";
import { Button } from "../ui";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-emerald-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-emerald-950">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">GreenKarachi</span>
          </Link>
          <Link to="/marketplace" className="hidden items-center gap-1 text-sm text-white/80 hover:text-white sm:flex">
            <Store className="h-4 w-4" /> Marketplace
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {user ? (
            <>
              <span className="hidden text-sm text-white/80 sm:inline">{user.email}</span>
              <Button
                variant="muted"
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
