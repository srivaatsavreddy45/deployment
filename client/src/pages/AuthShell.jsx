import { Link } from "react-router-dom"
import logo from "../assets/seva-logo.png"

export default function AuthShell({ eyebrow, title, footer, children }) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/" className="auth-logo-link" aria-label="Seva Sahayog Foundation home">
          <img src={logo} alt="Seva Sahayog Foundation" />
        </Link>

        <div className="auth-brand-copy">
          <p className="auth-kicker">Volunteer Experience Platform</p>
          <h1>Every volunteer experience matters.</h1>
          <p>
            A simple space for volunteers, corporate partners and Seva Sahayog
            teams to connect activity experiences with better decisions.
          </p>
        </div>

        <p className="auth-brand-note">Seva Sahayog Foundation</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {children}
          {footer}
        </div>
      </section>
    </main>
  )
}
