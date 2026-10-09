import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LINKS = {
  buyer: [
    ["Dashboard", "/buyer/dashboard"],
    ["My orders", "/buyer/orders"],
    ["Marketplace", "/marketplace"],
  ],
  nursery_seller: [
    ["Dashboard", "/seller/dashboard"],
    ["Inventory", "/seller/inventory"],
    ["Orders", "/seller/orders"],
    ["Profile", "/seller/profile"],
  ],
  super_admin: [
    ["Dashboard", "/admin"],
    ["Sellers", "/admin/sellers"],
    ["Products", "/admin/products"],
    ["Orders", "/admin/orders"],
  ],
};

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const links = LINKS[user.role] ?? [];

  return (
    <aside className="w-full shrink-0 sm:w-56">
      <nav className="flex gap-1 overflow-x-auto sm:flex-col">
        {links.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
