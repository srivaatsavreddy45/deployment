import Reveal from "./Reveal";

const STEPS = [
  { num: "01", title: "Share", desc: "Tell us about your experience in under a minute." },
  { num: "02", title: "Understand", desc: "Feedback is organised and classified into meaningful themes." },
  { num: "03", title: "Learn", desc: "SevaSahayog teams identify recurring issues and opportunities." },
  { num: "04", title: "Improve", desc: "Insights help shape better volunteering experiences." },
];

export default function PlatformSection() {
  return (
    <section className="ssf-section ssf-platform-section" id="platform">
      <div className="ssf-wrap">
        <Reveal className="ssf-section-head">
          <p className="ssf-eyebrow">The Volunteer Experience Platform</p>
          <h2>Your Experience Helps Us Do Better.</h2>
          <p>
            Volunteer experiences often live across conversations, messages, emails and notes.
            Important patterns can be missed when feedback is fragmented — so we built one place
            for it to go.
          </p>
        </Reveal>
        <div className="ssf-loop-steps">
          {STEPS.map((s) => (
            <Reveal as="div" className="ssf-loop-step" key={s.num}>
              <div className="ssf-loop-num">{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
