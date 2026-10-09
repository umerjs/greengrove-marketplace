import { Navigate } from "react-router-dom";
import { useAuth, homeForRole } from "../context/AuthContext";
import { Spinner } from "./ui";

export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}
