import { useCallback, useEffect, useState } from "react"
import { listForms, createForm, archiveForm, listActivities, errorMessage } from "../../services/endpoints"

const TYPES = ["rating", "text", "single_choice", "multi_choice", "boolean"]
const blankQuestion = () => ({ id: "", type: "rating", text: "", required: false, options: "" })

export default function AdminForms() {
  const [forms, setForms] = useState([])
  const [activities, setActivities] = useState([])
  const [activityId, setActivityId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState([blankQuestion()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    listForms().then(setForms).catch((e) => setError(errorMessage(e, "Could not load forms.")))
    listActivities().then(setActivities).catch(() => {})
  }, [])
  useEffect(load, [load])

  const setQ = (i, k, v) => setQuestions((c) => c.map((q, idx) => (idx === i ? { ...q, [k]: v } : q)))

  async function submit(event) {
    event.preventDefault(); setError("")
    if (!activityId || !title.trim()) { setError("Pick an activity and give the form a title."); return }
    const cleaned = questions
      .filter((q) => q.text.trim())
      .map((q, i) => ({
        id: q.id.trim() || `q${i + 1}`,
        type: q.type,
        text: q.text.trim(),
        required: q.required,
        ...(q.type === "single_choice" || q.type === "multi_choice"
          ? { options: q.options.split(",").map((o) => o.trim()).filter(Boolean).map((v) => ({ value: v, label: v })) }
          : {}),
      }))
    if (cleaned.length === 0) { setError("Add at least one question."); return }

    setSaving(true)
    try {
      await createForm({ activityId, title: title.trim(), description: description.trim(), questions: cleaned })
      setTitle(""); setDescription(""); setQuestions([blankQuestion()])
      load()
    } catch (e) {
      setError(errorMessage(e, "Could not create the form."))
    } finally { setSaving(false) }
  }

  async function archive(id) {
    setError("")
    try { await archiveForm(id); load() }
    catch (e) { setError(errorMessage(e, "Could not archive the form.")) }
  }

  return (
    <section className="page">
      <header className="page-head"><h1>Feedback forms</h1><p>Each form belongs to one activity. Volunteers see active forms only.</p></header>

      <form className="stack panel" onSubmit={submit}>
        <h2 className="section-title">New form</h2>
        <div className="field-row">
          <div className="field"><label htmlFor="f-act">Activity</label>
            <select id="f-act" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
              <option value="">Select…</option>
              {activities.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
            </select></div>
          <div className="field"><label htmlFor="f-title">Form title</label>
            <input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="f-desc">Description</label>
          <textarea id="f-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>

        <h3 className="section-title">Questions</h3>
        {questions.map((q, i) => (
          <div className="question-row" key={i}>
            <input placeholder={`id (default q${i + 1})`} value={q.id} onChange={(e) => setQ(i, "id", e.target.value)} />
            <select value={q.type} onChange={(e) => setQ(i, "type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Question text" value={q.text} onChange={(e) => setQ(i, "text", e.target.value)} />
            {(q.type === "single_choice" || q.type === "multi_choice") && (
              <input placeholder="options, comma separated" value={q.options} onChange={(e) => setQ(i, "options", e.target.value)} />
            )}
            <label className="inline"><input type="checkbox" checked={q.required} onChange={(e) => setQ(i, "required", e.target.checked)} /> required</label>
            <button type="button" className="btn is-small is-ghost" onClick={() => setQuestions((c) => c.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="btn is-small is-ghost" onClick={() => setQuestions((c) => [...c, blankQuestion()])}>+ Add question</button>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={saving}>{saving ? "Creating…" : "Create form"}</button>
      </form>

      <h2 className="section-title">All forms</h2>
      <table className="table">
        <thead><tr><th>Title</th><th>Questions</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {forms.map((f) => (
            <tr key={f._id}>
              <td>{f.title}</td>
              <td className="muted">{(f.questions || []).length}</td>
              <td><span className={`pill is-${f.status}`}>{f.status}</span></td>
              <td className="row-actions">
                <button className="btn is-small is-ghost" disabled={f.status !== "active"} onClick={() => archive(f._id)}>Archive</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
