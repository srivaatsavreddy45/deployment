import Reveal from "./Reveal";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85";
const DETAIL_IMAGE =
  "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=900&q=85";

const PILLARS = [
  "Education",
  "Women empowerment",
  "Health",
  "Environment",
  "Rural development",
  "Child development",
];

export default function AboutSection() {
  return (
    <section className="ssf-section ssf-about" id="about">
      <div className="ssf-wrap ssf-about-grid">
        <Reveal className="ssf-about-media">
          <div className="ssf-photo ssf-about-main">
            <img src={ABOUT_IMAGE} alt="Children learning together in a community setting" />
          </div>
          <div className="ssf-photo ssf-about-detail">
            <img src={DETAIL_IMAGE} alt="Community members taking part in a learning activity" />
          </div>
          <span className="ssf-photo-note">Celebrating Humanity</span>
        </Reveal>

        <Reveal className="ssf-about-copy">
          <p className="ssf-eyebrow">Who we are</p>
          <h2>A volunteer-driven foundation built around people and possibility.</h2>
          <p>
            What began in 2005 as a family's commitment to the welfare of society grew into
            Seva Sahayog Foundation, formally registered in 2009. Today, SSF works with
            communities, volunteers, NGOs and corporate partners to turn resources into
            practical, long-term support.
          </p>
          <p>
            Our work focuses on the areas where opportunity can change a life: education,
            women empowerment, health, environment, rural development and holistic child
            development.
          </p>

          <a
            className="ssf-text-link"
            href="https://sevasahayog.org/about-us/"
            target="_blank"
            rel="noreferrer"
          >
            Read our full story <span aria-hidden="true">↗</span>
          </a>

          <div className="ssf-pillar-list">
            {PILLARS.map((pillar) => (
              <span key={pillar}>{pillar}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
