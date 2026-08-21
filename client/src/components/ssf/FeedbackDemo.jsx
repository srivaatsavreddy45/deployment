import { Link } from "react-router-dom";
import Reveal from "./Reveal";

const STAR = (filled) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l2.9 6.9L22 9.6l-5.5 4.9L18 22l-6-3.9L6 22l1.5-7.5L2 9.6l7.1-.7z" />
  </svg>
);

export default function FeedbackDemo() {
  return (
    <section className="ssf-section" id="volunteer-flow">
      <div className="ssf-wrap ssf-demo-grid">
        <Reveal className="ssf-demo-copy">
          <span className="ssf-badge">Product Prototype</span>
          <h2>How Volunteer Feedback Works</h2>
          <p>
            Feedback takes less than a minute to submit — a few taps right after the activity,
            while the experience is still fresh.
          </p>
          <p>
            What volunteers share doesn't just sit in a form. It becomes a rating trend, a
            recurring theme, and eventually, a better-run activity next time.
          </p>
          <Link to="/volunteer" className="ssf-btn ssf-btn-primary" style={{ marginTop: 22 }}>
            Try the Feedback Flow
          </Link>
        </Reveal>

        <Reveal className="ssf-mock-stack">
          <div className="ssf-mock-card">
            <p className="ssf-mock-title">Tree Plantation Drive</p>
            <p className="ssf-mock-tag">How was your experience?</p>
            <div className="ssf-stars" aria-hidden="true">
              {[1, 1, 1, 1, 0].map((f, i) => <span key={i}>{STAR(f)}</span>)}
            </div>
            <div className="ssf-mock-field">
              <label>What went well?</label>
              <div className="ssf-fake-input">The site coordination was smooth and clear.</div>
            </div>
            <div className="ssf-mock-field">
              <label>What could be improved?</label>
              <div className="ssf-fake-input">Transport pickup timing</div>
            </div>
            <div className="ssf-mock-field">
              <label>Your suggestions</label>
              <div className="ssf-fake-input">A short briefing before we start would help.</div>
            </div>
            <button className="ssf-btn ssf-btn-primary ssf-mock-submit" tabIndex={-1}>
              Submit Feedback
            </button>
          </div>

          <div className="ssf-mock-card">
            <p className="ssf-mock-title">Volunteer Experience Insights</p>
            <div className="ssf-insight-row">
              <span className="ssf-k">Average Rating</span>
              <span className="ssf-v">4.1 / 5</span>
            </div>
            <div className="ssf-insight-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
              <span className="ssf-k">Top Themes</span>
              <div className="ssf-theme-pills">
                <span className="ssf-theme-pill">Communication</span>
                <span className="ssf-theme-pill">Transportation</span>
                <span className="ssf-theme-pill">Activity Planning</span>
              </div>
            </div>
            <p className="ssf-mock-disclaimer">Illustrative product mockup — not real activity data.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
