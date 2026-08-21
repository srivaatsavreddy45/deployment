import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import logo from "../assets/seva-logo.png"

// Display labels for the canonical backend roles. "Corporate SPOC" is the label
// for `spoc`; "corporate" is not a role value anywhere.
const ROLE_LABELS = {
  volunteer: "Volunteer",
  admin: "Admin",
  spoc: "Corporate SPOC",
}

// Navigation mirrors the server-side authorisation. These links are convenience
// only — every route is re-checked by the backend on each request.
const NAV = {
  volunteer: [
    { to: "/dashboard", label: "Overview" },
    { to: "/feedback", label: "Give feedback" },
    { to: "/feedback/mine", label: "My feedback" },
  ],
  admin: [
    { to: "/dashboard", label: "Overview" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/activities", label: "Activities" },
    { to: "/admin/forms", label: "Forms" },
    { to: "/admin/insights", label: "Insights" },
    { to: "/spoc", label: "SPOC view" },
  ],
  spoc: [
    { to: "/dashboard", label: "Overview" },
    { to: "/spoc", label: "Dashboard" },
  ],
}

function Layout() {
  const { user, logout } = useAuth()
  const links = NAV[user?.role] || []

  return (
    <div className="platform-layout">
      <header className="platform-header">
        <Link to="/" className="platform-brand">
          <img src={logo} alt="Seva Sahayog Foundation" />
        </Link>

        <nav className="platform-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/feedback"}
              className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="platform-user">
          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="platform-main"><Outlet /></main>
    </div>
  )
}

export default Layout
