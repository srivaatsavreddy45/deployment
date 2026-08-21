import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { listAvailableForms, submitFeedback, errorMessage } from "../../services/endpoints"

const RATING_MIN = 1
const RATING_MAX = 5

export default function FeedbackForm() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState({ whatWentWell: "", whatCouldBeImproved: "", suggestions: "" })
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listAvailableForms()
      .then((all) => {
        const match = all.find((f) => f._id === formId)
        if (!match) setError("That feedback form is not available.")
        setForm(match || null)
      })
      .catch((e) => setError(errorMessage(e, "Could not load the form.")))
  }, [formId])

  const questions = useMemo(() => form?.questions || [], [form])

  function setAnswer(id, value) {
    setAnswers((current) => ({ ...current, [id]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    if (rating < RATING_MIN || rating > RATING_MAX) {
      setError("Please give an overall rating from 1 to 5.")
      return
    }
    const missing = questions.filter(
      (q) => q.required && (answers[q.id] === undefined || answers[q.id] === ""),
    )
    if (missing.length) {
      setError("Please answer every required question.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        formId: form._id,
        activityId: form.activityId,
        rating,
        ...text,
        answers: questions
          .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
          .map((q) => ({ questionId: q.id, value: answers[q.id] })),
      }
      if (payload.answers.length === 0) delete payload.answers
      const created = await submitFeedback(payload)
      navigate(`/feedback/confirmation/${created._id}`, { replace: true })
    } catch (e) {
      setError(errorMessage(e, "Could not submit your feedback."))
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <section className="page">
        {error ? <p className="auth-error" role="alert">{error}</p> : <p className="muted">Loading…</p>}
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>{form.activity?.title || form.title}</h1>
        <p>{form.description || "Your feedback helps us run this better next time."}</p>
      </header>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label>Overall experience</label>
          <div className="stars" role="radiogroup" aria-label="Overall rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={`star ${rating >= n ? "is-on" : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {questions.map((q) => (
          <div className="field" key={q.id}>
            <label htmlFor={`q-${q.id}`}>
              {q.text} {q.required && <span className="req">*</span>}
            </label>

            {q.type === "rating" && (
              <div className="stars" role="radiogroup" aria-label={q.text}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button" key={n} role="radio" aria-checked={answers[q.id] === n}
                    aria-label={`${n}`} className={`star ${answers[q.id] >= n ? "is-on" : ""}`}
                    onClick={() => setAnswer(q.id, n)}
                  >★</button>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <textarea id={`q-${q.id}`} rows={3} value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)} />
            )}

            {q.type === "boolean" && (
              <div className="choices">
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <button type="button" key={label}
                    className={`choice ${answers[q.id] === val ? "is-on" : ""}`}
                    onClick={() => setAnswer(q.id, val)}>{label}</button>
                ))}
              </div>
            )}

            {(q.type === "single_choice" || q.type === "multi_choice") && (
              <div className="choices">
                {(q.options || []).map((opt) => {
                  const value = typeof opt === "object" ? opt.value : opt
                  const label = typeof opt === "object" ? opt.label || opt.value : opt
                  const selected = q.type === "multi_choice"
                    ? (answers[q.id] || []).includes(value)
                    : answers[q.id] === value
                  return (
                    <button type="button" key={value}
                      className={`choice ${selected ? "is-on" : ""}`}
                      onClick={() => {
                        if (q.type === "single_choice") return setAnswer(q.id, value)
                        const current = answers[q.id] || []
                        setAnswer(q.id, selected ? current.filter((v) => v !== value) : [...current, value])
                      }}>{label}</button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {[["whatWentWell", "What went well?"], ["whatCouldBeImproved", "What could be improved?"], ["suggestions", "Your suggestions"]].map(([key, label]) => (
          <div className="field" key={key}>
            <label htmlFor={key}>{label}</label>
            <textarea id={key} rows={2} value={text[key]}
              onChange={(e) => setText((c) => ({ ...c, [key]: e.target.value }))} />
          </div>
        ))}

        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit feedback"}
        </button>
      </form>
    </section>
  )
}
