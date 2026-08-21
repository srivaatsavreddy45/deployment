import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthShell from "./AuthShell"

// Must match the backend rule in validators/authValidator.js.
const PASSWORD_MIN_LENGTH = 8

// Public registration is volunteer-only. The backend rejects a client-supplied
// role with 422, and Corporate SPOC / admin accounts are provisioned by an
// administrator through /api/admin/users.
function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.")
      return
    }
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      // Exactly the fields public registration accepts — nothing else.
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      // Registration does not start a session: the account is created pending
      // administrator verification, so the volunteer signs in separately.
      navigate("/login", {
        replace: true,
        state: {
          notice:
            "Account created. It is awaiting administrator verification — you can sign in to check its status.",
        },
      })
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join the platform"
      title="Create your volunteer account"
      footer={
        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your full name" />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" />
        </div>

        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`} />
          </div>
          <div className="auth-field">
            <label htmlFor="register-confirm">Confirm password</label>
            <input id="register-confirm" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Repeat password" />
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create volunteer account"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="auth-admin-note">
        <strong>Corporate SPOC and admin access</strong>
        <span>
          Corporate SPOC and admin accounts are provisioned by an administrator.
          Once your account exists, sign in from the login page.
        </span>
      </div>
    </AuthShell>
  )
}

export default Register
