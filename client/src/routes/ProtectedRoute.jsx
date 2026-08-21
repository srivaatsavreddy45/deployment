import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

function ProtectedRoute() {
  const { isAuthenticated, initialising } = useAuth()

  // The session lives in httpOnly cookies, so authentication is only known once
  // the /auth/me probe resolves. Redirecting before then would bounce an
  // already-authenticated user to the login page on every reload.
  if (initialising) {
    return <p className="auth-loading" role="status">Checking your session…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
