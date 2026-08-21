import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { listAvailableForms, errorMessage } from "../../services/endpoints"
import { useAuth } from "../../context/AuthContext"

export default function FeedbackList() {
  const { user } = useAuth()
  const [forms, setForms] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const verified = user?.verificationStatus === "verified"

  useEffect(() => {
    listAvailableForms()
      .then(setForms)
      .catch((e) => setError(errorMessage(e, "Could not load feedback forms.")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page">
      <header className="page-head">
        <h1>Share your feedback</h1>
        <p>Choose an activity you took part in and tell us how it went.</p>
      </header>

      {!verified && (
        <div className="notice is-pending" role="status">
          <strong>Your account is not verified yet</strong>
          <span>
            You can see the forms below, but submitting stays unavailable until an
            administrator verifies your account.
          </span>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {!loading && !error && forms.length === 0 && (
        <p className="muted">There are no active feedback forms right now.</p>
      )}

      <div className="card-grid">
        {forms.map((form) => (
          <article key={form._id} className="card">
            <h2>{form.activity?.title || form.title}</h2>
            {form.activity?.category && (
              <span className="tag">{form.activity.category.replace(/_/g, " ")}</span>
            )}
            <p className="muted">{form.description || form.title}</p>
            <p className="meta">{form.questions.length} question(s)</p>
            {form.alreadySubmitted ? (
              <span className="pill is-done">Already submitted</span>
            ) : verified ? (
              <Link className="btn" to={`/feedback/${form._id}`}>Give feedback</Link>
            ) : (
              <span className="pill">Awaiting verification</span>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
