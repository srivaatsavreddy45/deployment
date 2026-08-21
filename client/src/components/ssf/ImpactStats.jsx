import CountUpStat from "./CountUpStat";

const STATS = [
  { target: 200, suffix: "+", label: "Regular volunteers" },
  { target: 33, suffix: "+", label: "Designed activities" },
  { target: 227, suffix: "", label: "Activities conducted" },
  { target: 23766, suffix: "", label: "Volunteer reach" },
];

export default function ImpactStats() {
  return (
    <section className="ssf-impact" id="impact">
      <div className="ssf-wrap">
        <div className="ssf-impact-heading">
          <p className="ssf-eyebrow">Our reach</p>
          <h2>Small acts become collective impact.</h2>
        </div>
        <div className="ssf-stat-row">
          {STATS.map((stat) => (
            <CountUpStat key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
