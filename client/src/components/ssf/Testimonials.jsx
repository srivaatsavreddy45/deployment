import { useState } from "react";
import Reveal from "./Reveal";

const TESTIMONIALS = [
  {
    quote: "Submitting feedback right after the activity meant I could say exactly what stood out, while it was still fresh.",
    name: "Volunteer, Corporate Partner Team",
    role: "Illustrative example",
  },
  {
    quote: "As a SPOC, seeing themes across activities instead of scattered messages changed how we plan the next one.",
    name: "Corporate SPOC",
    role: "Illustrative example",
  },
  {
    quote: "It took less than a minute, and I could tell the suggestions were actually going somewhere.",
    name: "Volunteer",
    role: "Illustrative example",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const goTo = (i) => setIndex((i + TESTIMONIALS.length) % TESTIMONIALS.length);
  const t = TESTIMONIALS[index];

  return (
    <section className="ssf-section ssf-testi-section">
      <div className="ssf-wrap">
        <Reveal className="ssf-section-head">
          <p className="ssf-eyebrow">Impact Stories</p>
          <h2>In Volunteers' Own Words</h2>
        </Reveal>

        <Reveal>
          <div className="ssf-testi-slide">
            <div>
              <p className="ssf-testi-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="ssf-testi-person">
                <div className="ssf-name">{t.name}</div>
                <div className="ssf-role">{t.role}</div>
              </div>
            </div>
            <div className="ssf-testi-img ssf-img-placeholder">
              <span className="ssf-cap">Photo placeholder</span>
            </div>
          </div>

          <div className="ssf-testi-nav">
            <button className="ssf-testi-arrow" aria-label="Previous testimonial" onClick={() => goTo(index - 1)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`ssf-testi-dot ${i === index ? "ssf-active" : ""}`}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
            <button className="ssf-testi-arrow" aria-label="Next testimonial" onClick={() => goTo(index + 1)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <p className="ssf-testi-disclaimer">
            Placeholder testimonials for demonstration — to be replaced with sourced volunteer quotes.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
