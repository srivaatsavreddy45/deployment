import axios from "axios"

// The backend issues access/refresh tokens as httpOnly cookies and never returns
// them in the response body, so the browser must send credentials on every call.
// There is deliberately no localStorage token and no Authorization header: a
// token the JS can read is a token XSS can steal.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Endpoints that must never trigger a refresh-and-retry: refreshing on a failed
// login would be meaningless, and refreshing on the refresh call itself loops.
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh-token"]

// Minimum correct handling for an expired access token, using the backend's
// existing contract: POST /auth/refresh-token with no body, which reads the
// refreshToken cookie and rotates both cookies. On success the original request
// is retried once. On failure the 401 is surfaced so the caller can log out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      NO_REFRESH_PATHS.some((path) => original.url?.includes(path))
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      await api.post("/auth/refresh-token")
    } catch {
      return Promise.reject(error)
    }

    return api(original)
  },
)

export default api
