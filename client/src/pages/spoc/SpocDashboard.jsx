import { useEffect, useState } from "react"
import { spocDashboard, spocInsights, spocResponses, errorMessage } from "../../services/endpoints"

export default function SpocDashboard() {
  const [summary, setSummary] = useState(null)
  const [selected, setSelected] = useState("")
  const [insights, setInsights] = useState(null)
  const [responses, setResponses] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    spocDashboard()
      .then((d) => { if (!cancelled) setSummary(d) })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, "Could not load the dashboard.")) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!selected) {
      // Cleared asynchronously so no state is set synchronously in the effect.
      Promise.resolve().then(() => {
        if (!cancelled) { setInsights(null); setResponses([]) }
      })
      return () => { cancelled = true }
    }
    spocInsights(selected)
      .then((d) => { if (!cancelled) setInsights(d) })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, "Could not load insights.")) })
    spocResponses(selected)
      .then((r) => { if (!cancelled) setResponses(Array.isArray(r) ? r : []) })
      .catch(() => { if (!cancelled) setResponses([]) })
    return () => { cancelled = true }
  }, [selected])

  return (
    <section className="page">
      <header className="page-head">
        <h1>Corporate SPOC dashboard</h1>
        <p>Feedback themes and outcomes across your partner activities. Volunteer identities are not shown.</p>
      </header>

      {error && <p className="auth-error" role="alert">{error}</p>}

      {summary && (
        <div className="stat-row">
          <div className="stat"><span>{summary.totalFeedbackForms}</span><small>feedback forms</small></div>
          <div className="stat"><span>{summary.activeFeedbackForms}</span><small>active</small></div>
          <div className="stat"><span>{summary.totalResponses}</span><small>responses</small></div>
        </div>
      )}

      <h2 className="section-title">Activity insights</h2>
      <div className="field">
        <label htmlFor="spoc-activity">Activity id</label>
        <input id="spoc-activity" placeholder="Paste an activity id to inspect"
          value={selected} onChange={(e) => setSelected(e.target.value.trim())} />
        <p className="meta">Activity ids appear in the admin Activities page.</p>
      </div>

      {insights && (
        <>
          <div className="stat-row">
            <div className="stat"><span>{insights.totalResponses}</span><small>responses</small></div>
            <div className="stat"><span>{insights.sentiment?.positive ?? 0}</span><small>positive</small></div>
            <div className="stat"><span>{insights.sentiment?.neutral ?? 0}</span><small>neutral</small></div>
            <div className="stat"><span>{insights.sentiment?.negative ?? 0}</span><small>negative</small></div>
          </div>

          <h3 className="section-title">Top keywords</h3>
          {(insights.keywords || []).length === 0 ? <p className="muted">No keywords yet.</p> : (
            <div className="chips">
              {insights.keywords.map((k) => (
                <span className="chip" key={k.keyword}>{k.keyword} <b>{k.count}</b></span>
              ))}
            </div>
          )}

          <h3 className="section-title">Responses ({responses.length})</h3>
          <table className="table">
            <thead><tr><th>Rating</th><th>What went well</th><th>To improve</th><th>When</th></tr></thead>
            <tbody>{responses.map((r) => (
              <tr key={r._id}>
                <td>{"★".repeat(r.rating || 0)}</td>
                <td>{r.whatWentWell || "—"}</td>
                <td>{r.whatCouldBeImproved || "—"}</td>
                <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </>
      )}
    </section>
  )
}
