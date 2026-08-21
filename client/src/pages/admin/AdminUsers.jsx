import { useEffect, useState } from "react"
import { listUsers, setVerification, errorMessage } from "../../services/endpoints"

const ROLE_LABEL = { volunteer: "Volunteer", admin: "Admin", spoc: "Corporate SPOC" }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(null)
  const [loading, setLoading] = useState(true)

  // A counter rather than a callback: state is set inside the async resolution,
  // never synchronously in the effect body.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((data) => { if (!cancelled) setUsers(data) })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, "Could not load users.")) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey])

  async function decide(id, verificationStatus) {
    setError(""); setBusy(id)
    try {
      await setVerification(id, verificationStatus)
      setReloadKey((k) => k + 1)
    } catch (e) {
      setError(errorMessage(e, "Could not update verification."))
    } finally {
      setBusy(null)
    }
  }

  const pending = users.filter((u) => u.role === "volunteer" && u.verificationStatus === "pending")
  const rest = users.filter((u) => !pending.includes(u))

  const row = (u) => (
    <tr key={u._id}>
      <td>{u.name}</td>
      <td className="muted">{u.email}</td>
      <td>{ROLE_LABEL[u.role] || u.role}</td>
      <td><span className={`pill is-${u.verificationStatus}`}>{u.verificationStatus}</span></td>
      <td className="row-actions">
        {u.role === "volunteer" ? (
          <>
            <button className="btn is-small" disabled={busy === u._id || u.verificationStatus === "verified"}
              onClick={() => decide(u._id, "verified")}>Verify</button>
            <button className="btn is-small is-ghost" disabled={busy === u._id || u.verificationStatus === "rejected"}
              onClick={() => decide(u._id, "rejected")}>Reject</button>
          </>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
    </tr>
  )

  return (
    <section className="page">
      <header className="page-head">
        <h1>Users</h1>
        <p>Verify volunteers before they can submit feedback. Admin and SPOC accounts are provisioned, not verified.</p>
      </header>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && (
        <>
          <h2 className="section-title">
            Awaiting verification {pending.length > 0 && <span className="pill is-pending">{pending.length}</span>}
          </h2>
          {pending.length === 0 ? (
            <p className="muted">No volunteers are waiting.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{pending.map(row)}</tbody>
            </table>
          )}

          <h2 className="section-title">Everyone else</h2>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{rest.map(row)}</tbody>
          </table>
        </>
      )}
    </section>
  )
}
