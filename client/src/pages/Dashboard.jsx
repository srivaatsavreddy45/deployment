import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// Canonical backend roles: volunteer | admin | spoc.
// "Corporate SPOC" is a display label for `spoc`; it is never a role value.
const ROLE_COPY = {
  volunteer: {
    label: "Volunteer",
    title: "Your volunteer experience",
    description: "Submit feedback after an activity and keep a record of your participation.",
  },
  spoc: {
    label: "Corporate SPOC",
    title: "Your partner activities",
    description: "View activities, volunteer feedback themes and experience outcomes.",
  },
  admin: {
    label: "Admin",
    title: "Volunteer experience management",
    description: "Create activities, review feedback, identify recurring themes and prepare reports.",
  },
}

// Verification applies to volunteers only. Admin and SPOC accounts are
// provisioned by an administrator and do not go through this workflow.
const VERIFICATION_COPY = {
  pending: {
    tone: "pending",
    title: "Awaiting administrator verification",
    description:
      "Your volunteer account has been created and is waiting for an administrator to verify it. You can sign in, but feedback submission stays unavailable until it is verified.",
  },
  rejected: {
    tone: "rejected",
    title: "Account not approved",
    description:
      "An administrator did not approve this volunteer account, so volunteer features are restricted. Contact Seva Sahayog if you believe this is a mistake.",
  },
}

// Entry points into each role's area, so the overview page is a hub rather
// than a dead end.
const QUICK_LINKS = {
  volunteer: [
    { to: "/feedback", title: "Give feedback", description: "Choose an activity and share how it went." },
    { to: "/feedback/mine", title: "My feedback", description: "Everything you have submitted." },
  ],
  admin: [
    { to: "/admin/users", title: "Users", description: "Verify volunteers and provision accounts." },
    { to: "/admin/activities", title: "Activities", description: "Create and review activities." },
    { to: "/admin/forms", title: "Feedback forms", description: "Build the forms volunteers fill in." },
    { to: "/admin/insights", title: "Insights", description: "Ratings, themes and submissions." },
  ],
  spoc: [
    { to: "/spoc", title: "SPOC dashboard", description: "Feedback themes across partner activities." },
  ],
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const copy = ROLE_COPY[user?.role] || ROLE_COPY.volunteer
  const verification =
    user?.role === "volunteer" ? VERIFICATION_COPY[user?.verificationStatus] : null

  return (
    <section className="dashboard-shell">
      <div>
        <p className="dashboard-eyebrow">{copy.label}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      {verification && (
        <div
          className={`dashboard-verification is-${verification.tone}`}
          role="status"
        >
          <strong>{verification.title}</strong>
          <span>{verification.description}</span>
        </div>
      )}

      <nav className="quick-links">
        {QUICK_LINKS[user?.role]?.map((l) => (
          <Link key={l.to} className="quick-link" to={l.to}>
            <strong>{l.title}</strong>
            <span>{l.description}</span>
          </Link>
        ))}
      </nav>

      <div className="dashboard-card">
        <span>Signed in as</span>
        <strong>{user?.name || user?.email}</strong>
        <small>{user?.email}</small>
      </div>
      <button className="dashboard-logout" onClick={logout}>Sign out</button>
    </section>
  )
}
