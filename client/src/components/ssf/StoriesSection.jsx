import Reveal from "./Reveal";

const STORIES = [
  {
    date: "June 2026",
    title: "Empowering Dreams, One Kit at a Time",
    text: "Seva Sahayog's flagship School Kit drive continues to bring educational resources and volunteer energy together for children across Maharashtra.",
    href: "https://sevasahayog.org/empowering-dreams-one-kit-at-a-time/",
  },
  {
    date: "July 2026",
    title: "A Laptop, a Green Stool, and a Voice Finding Itself",
    text: "The Global Voices programme connects students from Samutkarsh centres with volunteers for interactive English conversations and confidence-building.",
    href: "https://sevasahayog.org/a-laptop-a-green-stool-and-a-voice-finding-itself/",
  },
];

export default function StoriesSection() {
  return (
    <section className="ssf-section ssf-stories">
      <div className="ssf-wrap">
        <Reveal className="ssf-section-head">
          <p className="ssf-eyebrow">Stories from the field</p>
          <h2>Real work. Real people. Real change.</h2>
        </Reveal>

        <div className="ssf-story-grid">
          {STORIES.map((story) => (
            <article className="ssf-story-card" key={story.title}>
              <div className="ssf-story-date">{story.date}</div>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
              <a href={story.href} target="_blank" rel="noreferrer" className="ssf-text-link">
                Read story <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>

        <div className="ssf-center-link">
          <a href="https://sevasahayog.org/" target="_blank" rel="noreferrer" className="ssf-text-link">
            Visit Seva Sahayog for more updates <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
