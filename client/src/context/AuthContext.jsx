import { createContext, useContext, useEffect, useState } from "react"
import api from "../services/api"

const AuthContext = createContext(null)

// The user object is derived solely from a successful backend response. There is
// deliberately no offline/demo fallback: a frontend-only path that fabricates an
// authenticated admin or SPOC session is a security hole, not a convenience.
function normaliseUser(payload) {
  return payload?.data ?? null
}

function readError(error, fallback) {
  if (error?.response) {
    const data = error.response.data
    const fieldError = data?.errors?.[0]?.message
    return new Error(fieldError || data?.message || fallback)
  }
  // No response at all: network failure, CORS, or the API is down. Surface it
  // honestly rather than pretending the sign-in worked.
  return new Error(
    "Cannot reach the server. Check your connection and try again.",
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Until the session probe finishes we know nothing; rendering routes before
  // that would flash the login page for an already-authenticated user.
  const [initialising, setInitialising] = useState(true)

  // Session bootstrap: cookies are httpOnly, so the only way to know whether the
  // browser holds a valid session is to ask the server.
  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const response = await api.get("/auth/me")
        if (!cancelled) setUser(normaliseUser(response.data))
      } catch {
        // 401 (or refresh failure) means logged out.
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setInitialising(false)
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [])

  async function login(credentials) {
    try {
      const response = await api.post("/auth/login", credentials)
      const nextUser = normaliseUser(response.data)
      if (!nextUser?.role) {
        throw new Error("The server did not return a user role.")
      }
      setUser(nextUser)
      return nextUser
    } catch (error) {
      throw readError(error, "Invalid email or password.")
    }
  }

  // Public registration creates a pending volunteer and does not start a
  // session, so the caller is sent to the login page afterwards.
  async function register(payload) {
    try {
      const response = await api.post("/auth/register", payload)
      return normaliseUser(response.data)
    } catch (error) {
      throw readError(error, "Unable to create the account.")
    }
  }

  async function logout() {
    let revoked = true
    try {
      await api.post("/auth/logout")
    } catch {
      // Local state is cleared either way, but the server session may survive.
      revoked = false
    }
    setUser(null)
    return revoked
  }

  async function refreshUser() {
    try {
      const response = await api.get("/auth/me")
      setUser(normaliseUser(response.data))
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        initialising,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
