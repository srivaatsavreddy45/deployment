import { useEffect, useState } from "react"
import { feedbackStats, feedbackThemes, listAllFeedback, errorMessage } from "../../services/endpoints"

export default function AdminInsights() {
  const [stats, setStats] = useState(null)
  const [themes, setThemes] = useState([])
  const [feedback, setFeedback] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([feedbackStats(), feedbackThemes(), listAllFeedback()])
      .then(([s, t, f]) => { setStats(s); setThemes(t); setFeedback(f) })
      .catch((e) => setError(errorMessage(e, "Could not load insights.")))
  }, [])

  if (error) return <section className="page"><p className="auth-error" role="alert">{error}</p></section>
  if (!stats) return <section className="page"><p className="muted">Loading…</p></section>

  const max = Math.max(1, ...stats.ratingDistribution.map((r) => r.count))

  return (
    <section className="page">
      <header className="page-head"><h1>Feedback insights</h1><p>Aggregated across every volunteer submission.</p></header>

      <div className="stat-row">
        <div className="stat"><span>{stats.totalSubmissions}</span><small>submissions</small></div>
        <div className="stat"><span>{stats.domainStats.length}</span><small>domains</small></div>
        <div className="stat"><span>{stats.activityStats.length}</span><small>activities</small></div>
      </div>

      <h2 className="section-title">Rating distribution</h2>
      <div className="bars">
        {stats.ratingDistribution.map((r) => (
          <div className="bar-row" key={r.rating}>
            <span className="bar-label">{r.rating}★</span>
            <div className="bar"><div className="bar-fill" style={{ width: `${(r.count / max) * 100}%` }} /></div>
            <span className="bar-value">{r.count}</span>
          </div>
        ))}
      </div>

      {stats.domainStats.length > 0 && (
        <>
          <h2 className="section-title">By domain</h2>
          <table className="table">
            <thead><tr><th>Domain</th><th>Average</th><th>Submissions</th></tr></thead>
            <tbody>{stats.domainStats.map((d) => (
              <tr key={d.domain}><td>{d.domain.replace(/_/g, " ")}</td><td>{d.averageRating}</td><td>{d.submissionCount}</td></tr>
            ))}</tbody>
          </table>
        </>
      )}

      {stats.questionStats.length > 0 && (
        <>
          <h2 className="section-title">By question</h2>
          <table className="table">
            <thead><tr><th>Question</th><th>Average</th><th>Responses</th></tr></thead>
            <tbody>{stats.questionStats.map((q) => (
              <tr key={q.questionId}><td>{q.questionId}</td><td>{q.averageRating}</td><td>{q.responseCount}</td></tr>
            ))}</tbody>
          </table>
        </>
      )}

      <h2 className="section-title">Comments by domain</h2>
      {themes.length === 0 ? <p className="muted">No written comments yet.</p> : themes.map((t) => (
        <div className="panel" key={t.domain}>
          <h3>{t.domain.replace(/_/g, " ")}</h3>
          {t.comments.map((c, i) => (
            <p key={i}><span className="tag">{c.field}</span> {c.text}</p>
          ))}
        </div>
      ))}

      <h2 className="section-title">All submissions ({feedback.length})</h2>
      <table className="table">
        <thead><tr><th>Activity</th><th>Rating</th><th>Partner</th><th>When</th></tr></thead>
        <tbody>{feedback.map((f) => (
          <tr key={f._id}>
            <td>{f.activity?.title || "—"}</td>
            <td>{"★".repeat(f.rating)}</td>
            <td className="muted">{f.corporatePartner?.name || "—"}</td>
            <td className="muted">{new Date(f.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  )
}
