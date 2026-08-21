import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { getConfirmation, errorMessage } from "../../services/endpoints"

export default function FeedbackConfirmation() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getConfirmation(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, "That submission could not be found.")))
  }, [id])

  if (error) return <section className="page"><p className="auth-error" role="alert">{error}</p></section>
  if (!data) return <section className="page"><p className="muted">Loading…</p></section>

  return (
    <section className="page">
      <div className="notice is-done" role="status">
        <strong>Thank you — your feedback was recorded</strong>
        <span>This is your receipt. Only you can see it.</span>
      </div>
      <div className="card">
        <h2>{data.activityTitle || "Activity"}</h2>
        {data.activityDomain && <span className="tag">{data.activityDomain.replace(/_/g, " ")}</span>}
        <p className="muted">{data.formTitle}</p>
        <p><strong>Rating:</strong> {"★".repeat(data.rating || 0)}</p>
        <p className="meta">Submitted {new Date(data.submittedAt).toLocaleString()}</p>
      </div>
      <Link className="btn is-ghost" to="/feedback/mine">Back to my feedback</Link>
    </section>
  )
}
