import { Link } from "react-router-dom";
import Reveal from "./Reveal";

const CHAIN = ["One Voice", "Many Experiences", "Patterns", "Action"];

export function WhyFeedbackSection() {
  return (
    <section className="ssf-section ssf-why-section">
      <div className="ssf-wrap">
        <Reveal>
          <p className="ssf-eyebrow">Why Feedback Matters</p>
          <h2>Feedback Shouldn't Disappear After the Activity.</h2>
          <p className="ssf-sub">
            Every rating, suggestion and concern carries information about how volunteering can
            be made more meaningful. By bringing those experiences into one place, SevaSahayog
            can turn individual voices into collective learning.
          </p>
          <div className="ssf-chain">
            {CHAIN.map((c, i) => (
              <span key={c} style={{ display: "inline-flex", alignItems: "center" }}>
                {i > 0 && <span className="ssf-chain-arrow">→</span>}
                <span className={`ssf-chain-item ${i === CHAIN.length - 1 ? "ssf-strong" : ""}`}>{c}</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCTASection() {
  return (
    <section className="ssf-section ssf-final-cta">
      <div className="ssf-wrap">
        <Reveal className="ssf-final-cta-inner">
          <h2>Be Part of the Next Better Experience.</h2>
          <p>
            Your time matters. Your experience matters. Your feedback helps make the next
            volunteering activity better.
          </p>
          <div className="ssf-final-ctas">
            <Link to="/volunteer" className="ssf-btn ssf-btn-primary">Share Your Experience</Link>
            <a href="https://sevasahayog.org/volunteer/" className="ssf-btn ssf-btn-ghost-light">
              Join Us as a Volunteer
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
