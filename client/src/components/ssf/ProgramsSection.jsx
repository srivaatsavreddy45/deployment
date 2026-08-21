import Reveal from "./Reveal";

const PROGRAMS = [
  {
    name: "School Kit",
    category: "Education",
    desc: "Essential learning materials that help children begin the school year with confidence.",
    href: "https://sevasahayog.org/programs/school-kit/",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Kishori Vikas",
    category: "Empowerment",
    desc: "Holistic development, confidence and life skills for adolescent girls.",
    href: "https://sevasahayog.org/programs/kishori-vikas/",
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Samutkarsh",
    category: "Education",
    desc: "Community learning support that helps children build stronger educational foundations.",
    href: "https://sevasahayog.org/programs/samutkarsh/",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Urban Forestation",
    category: "Environment",
    desc: "Native urban forests that create greener, healthier and more resilient communities.",
    href: "https://sevasahayog.org/programs/urban-forestation/",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=85",
  },
];

export default function ProgramsSection() {
  return (
    <section className="ssf-section ssf-programs" id="focus">
      <div className="ssf-wrap">
        <Reveal className="ssf-section-head ssf-section-head-wide">
          <div>
            <p className="ssf-eyebrow">Where we work</p>
            <h2>Programs designed around real community needs.</h2>
          </div>
          <p>
            From education and empowerment to environmental action, our programs are built
            with grassroots realities at the centre.
          </p>
        </Reveal>

        <div className="ssf-program-grid">
          {PROGRAMS.map((program, index) => (
            <Reveal as="article" className="ssf-program-card" key={program.name}>
              <a href={program.href} target="_blank" rel="noreferrer" className="ssf-program-image">
                <img src={program.image} alt={`${program.name} programme`} loading="lazy" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </a>
              <div className="ssf-program-body">
                <p className="ssf-card-kicker">{program.category}</p>
                <h3>{program.name}</h3>
                <p>{program.desc}</p>
                <a href={program.href} target="_blank" rel="noreferrer" className="ssf-card-link">
                  Explore programme <span aria-hidden="true">↗</span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="ssf-programs-footer">
          <p>Explore the full range of Seva Sahayog initiatives.</p>
          <a href="https://sevasahayog.org/programs/" target="_blank" rel="noreferrer" className="ssf-btn ssf-btn-outline">
            View all programs <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
