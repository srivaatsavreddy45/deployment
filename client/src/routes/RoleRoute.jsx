import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

// Role gate layered on top of ProtectedRoute. The backend is the real authority
// (every route re-checks the JWT and role); this only stops the UI offering
// pages the user would be refused anyway.
export default function RoleRoute({ allow = [] }) {
  const { user, initialising } = useAuth()

  if (initialising) {
    return <p className="auth-loading" role="status">Checking your session…</p>
  }
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
