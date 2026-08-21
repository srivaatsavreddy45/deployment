import Reveal from "./Reveal";

const OPTIONS = [
  {
    title: "Volunteer",
    text: "Give your time, skills and energy through activities that match your interests.",
    href: "https://sevasahayog.org/volunteer/",
    label: "Join as a volunteer",
  },
  {
    title: "CSR Partner",
    text: "Work with Seva Sahayog to engage teams in purposeful, measurable community initiatives.",
    href: "https://sevasahayog.org/",
    label: "Explore partnerships",
  },
  {
    title: "Support the work",
    text: "Contribute resources that help programmes reach communities with consistency and scale.",
    href: "https://donations.sevasahayog.in/OnlineDonation.html",
    label: "Support a programme",
  },
];

export default function GetInvolvedSection() {
  return (
    <section className="ssf-section ssf-involved" id="get-involved">
      <div className="ssf-wrap">
        <Reveal className="ssf-involved-intro">
          <p className="ssf-eyebrow">Get involved</p>
          <h2>There is more than one way to be part of Seva.</h2>
          <p>
            Choose the kind of contribution that fits you. The common thread is simple:
            purposeful action, shared responsibility and sustained cooperation.
          </p>
        </Reveal>

        <div className="ssf-involved-grid">
          {OPTIONS.map((option, index) => (
            <Reveal as="article" className="ssf-involved-card" key={option.title}>
              <span className="ssf-involved-number">0{index + 1}</span>
              <h3>{option.title}</h3>
              <p>{option.text}</p>
              <a href={option.href} target="_blank" rel="noreferrer" className="ssf-card-link">
                {option.label} <span aria-hidden="true">↗</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
