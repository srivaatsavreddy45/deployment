import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { listMyFeedback, errorMessage } from "../../services/endpoints"

export default function MyFeedback() {
  const [items, setItems] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyFeedback()
      .then(setItems)
      .catch((e) => setError(errorMessage(e, "Could not load your submissions.")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page">
      <header className="page-head">
        <h1>My feedback</h1>
        <p>Everything you have submitted. Only you can see this.</p>
      </header>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">
          You have not submitted any feedback yet. <Link to="/feedback">Find a form</Link>.
        </p>
      )}

      <div className="card-grid">
        {items.map((item) => (
          <article key={item._id} className="card">
            <span className="rating">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span>
            {item.whatWentWell && <p><strong>Went well:</strong> {item.whatWentWell}</p>}
            {item.whatCouldBeImproved && <p><strong>To improve:</strong> {item.whatCouldBeImproved}</p>}
            {item.suggestions && <p><strong>Suggestion:</strong> {item.suggestions}</p>}
            <p className="meta">{new Date(item.createdAt).toLocaleString()}</p>
            <Link className="btn is-ghost" to={`/feedback/confirmation/${item._id}`}>View receipt</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
