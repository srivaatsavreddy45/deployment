import { useCallback, useEffect, useState } from "react"
import { listActivities, createActivity, listUsers, errorMessage } from "../../services/endpoints"

const CATEGORIES = ["women_empowerment", "child_education", "environment", "other"]
const STATUSES = ["draft", "published", "completed", "cancelled"]

export default function AdminActivities() {
  const [items, setItems] = useState([])
  const [partners, setPartners] = useState([])
  const [form, setForm] = useState({ title: "", description: "", partner: "", date: "", location: "", category: "environment", status: "published", slotsAvailable: 0 })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    listActivities().then(setItems).catch((e) => setError(errorMessage(e, "Could not load activities.")))
    listUsers().then((u) => setPartners(u.filter((x) => x.role === "spoc" || x.role === "admin"))).catch(() => {})
  }, [])
  useEffect(load, [load])

  async function submit(event) {
    event.preventDefault(); setError("")
    if (!form.title.trim() || !form.partner || !form.date) {
      setError("Title, partner and date are required."); return
    }
    setSaving(true)
    try {
      await createActivity({ ...form, slotsAvailable: Number(form.slotsAvailable) || 0 })
      setForm({ ...form, title: "", description: "", location: "" })
      load()
    } catch (e) {
      setError(errorMessage(e, "Could not create the activity."))
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm((c) => ({ ...c, [k]: v }))

  return (
    <section className="page">
      <header className="page-head"><h1>Activities</h1><p>Create the activities volunteers give feedback on.</p></header>

      <form className="stack panel" onSubmit={submit}>
        <h2 className="section-title">New activity</h2>
        <div className="field"><label htmlFor="a-title">Title</label>
          <input id="a-title" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="field"><label htmlFor="a-desc">Description</label>
          <textarea id="a-desc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="field-row">
          <div className="field"><label htmlFor="a-partner">Corporate partner</label>
            <select id="a-partner" value={form.partner} onChange={(e) => set("partner", e.target.value)}>
              <option value="">Select…</option>
              {partners.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
            </select></div>
          <div className="field"><label htmlFor="a-date">Date</label>
            <input id="a-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="a-cat">Category</label>
            <select id="a-cat" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select></div>
          <div className="field"><label htmlFor="a-status">Status</label>
            <select id="a-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="a-loc">Location</label>
            <input id="a-loc" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
          <div className="field"><label htmlFor="a-slots">Slots</label>
            <input id="a-slots" type="number" min="0" value={form.slotsAvailable} onChange={(e) => set("slotsAvailable", e.target.value)} /></div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={saving}>{saving ? "Creating…" : "Create activity"}</button>
      </form>

      <h2 className="section-title">All activities</h2>
      <table className="table">
        <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Partner</th></tr></thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              <td>{a.title}</td>
              <td>{String(a.category || "").replace(/_/g, " ")}</td>
              <td className="muted">{a.date ? new Date(a.date).toLocaleDateString() : "—"}</td>
              <td><span className={`pill is-${a.status}`}>{a.status}</span></td>
              <td className="muted">{a.partner?.name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
