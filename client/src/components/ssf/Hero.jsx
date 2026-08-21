import { Link } from "react-router-dom";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1800&q=85";

export default function Hero() {
  return (
    <section className="ssf-hero" id="top">
      <div
        className="ssf-hero-image"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        aria-hidden="true"
      />
      <div className="ssf-hero-overlay" />

      <div className="ssf-hero-content ssf-wrap">
        <p className="ssf-hero-kicker">Seva Sahayog Foundation</p>
        <h1>Celebrating humanity through service and cooperation.</h1>
        <p className="ssf-hero-sub">
          We connect socially conscious people, organisations and resources with
          grassroots communities to create meaningful, sustainable change.
        </p>
        <div className="ssf-hero-actions">
          <a
            href="https://sevasahayog.org/volunteer/"
            className="ssf-btn ssf-btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            Volunteer with us
            <span aria-hidden="true">↗</span>
          </a>
          <a href="#about" className="ssf-btn ssf-btn-light">
            Discover our work
          </a>
        </div>
      </div>

      <div className="ssf-hero-bottom ssf-wrap">
        <span>Since 2005</span>
        <span className="ssf-hero-divider" />
        <span>Education · Empowerment · Health · Environment</span>
      </div>
    </section>
  );
}
