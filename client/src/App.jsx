import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "./context/AuthContext";
import { PublicLayout } from "./components/layout/PublicLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RequireRole } from "./components/RequireRole";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import MarketplaceIndex from "./pages/marketplace/Index";
import ProductDetail from "./pages/marketplace/ProductDetail";
import Checkout from "./pages/Checkout";
import BuyerDashboard from "./pages/buyer/Dashboard";
import BuyerOrders from "./pages/buyer/Orders";
import OrderDetail from "./pages/buyer/OrderDetail";
import SellerDashboard from "./pages/seller/Dashboard";
import SellerInventory from "./pages/seller/Inventory";
import SellerOrders from "./pages/seller/Orders";
import SellerProfile from "./pages/seller/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSellers from "./pages/admin/Sellers";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Unauthorized() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="mt-2 text-slate-500">You don't have access to that page.</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<MarketplaceIndex />} />
              <Route path="/marketplace/:id" element={<ProductDetail />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/login" element={<Navigate to="/auth/login" replace />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/buyer/dashboard" element={<RequireRole role="buyer"><BuyerDashboard /></RequireRole>} />
              <Route path="/buyer/orders" element={<RequireRole role="buyer"><BuyerOrders /></RequireRole>} />
              <Route path="/buyer/orders/:id" element={<RequireRole role="buyer"><OrderDetail /></RequireRole>} />
              <Route path="/checkout" element={<RequireRole role="buyer"><Checkout /></RequireRole>} />

              <Route path="/seller/dashboard" element={<RequireRole role="nursery_seller"><SellerDashboard /></RequireRole>} />
              <Route path="/seller/inventory" element={<RequireRole role="nursery_seller"><SellerInventory /></RequireRole>} />
              <Route path="/seller/orders" element={<RequireRole role="nursery_seller"><SellerOrders /></RequireRole>} />
              <Route path="/seller/profile" element={<RequireRole role="nursery_seller"><SellerProfile /></RequireRole>} />

              <Route path="/admin" element={<RequireRole role="super_admin"><AdminDashboard /></RequireRole>} />
              <Route path="/admin/sellers" element={<RequireRole role="super_admin"><AdminSellers /></RequireRole>} />
              <Route path="/admin/products" element={<RequireRole role="super_admin"><AdminProducts /></RequireRole>} />
              <Route path="/admin/orders" element={<RequireRole role="super_admin"><AdminOrders /></RequireRole>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
