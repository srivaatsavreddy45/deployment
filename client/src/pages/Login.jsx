import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthShell from "./AuthShell"

// There is deliberately no account-type selector. The authenticated role comes
// from the backend session, not from something the sign-in form chooses.
function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const notice = location.state?.notice

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.")
      return
    }

    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to continue"
      footer={
        <p className="auth-footer-text">
          New to the platform? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      {notice && <p className="auth-notice" role="status">{notice}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label htmlFor="login-password">Password</label>
            <button type="button" className="auth-text-button">Forgot password?</button>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="auth-admin-note">
        <strong>Corporate SPOC and admin access</strong>
        <span>These accounts are provisioned by an administrator — sign in with the credentials you were given.</span>
      </div>
    </AuthShell>
  )
}

export default Login
