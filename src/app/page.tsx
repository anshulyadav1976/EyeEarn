import Link from "next/link";

const roles = [
  {
    code: "01",
    title: "Explore & Earn",
    copy: "Choose a valuable coverage gap, follow its itinerary and film a privacy-processed evidence run.",
    href: "/explore",
    action: "Start the field demo",
    state: "Live",
  },
  {
    code: "02",
    title: "Buyer Map",
    copy: "Inspect what is known, click where evidence is missing and fund a fresh runner bounty.",
    href: "/buyer",
    action: "Open buyer map",
    state: "Live",
  },
  {
    code: "03",
    title: "Authority Live",
    copy: "Watch routes, evidence states and the city evidence ribbon from one operational field view.",
    href: "/operations",
    action: "Open Live + Atlas",
    state: "Phase 5",
  },
  {
    code: "04",
    title: "Ask EyeEarn",
    copy: "Answer a buyer question with cited observations—or propose a bounty when coverage is too thin.",
    href: "/intelligence",
    action: "Run cited intelligence",
    state: "Phase 6",
  },
  {
    code: "05",
    title: "Run Replay",
    copy: "Turn the real route, observations and accepted earnings into a short cinematic proof of value.",
    href: "/replay",
    action: "Play the evidence",
    state: "Phase 7",
  },
  {
    code: "06",
    title: "Public Evidence",
    copy: "Inspect the privacy-safe GeoJSON product and clearly labelled external demo fixtures.",
    href: "/developers",
    action: "View the public API",
    state: "Phase 8",
  },
];

export default function Home() {
  return (
    <main className="shell-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="EyeEarn home">
          EYE<span>EARN</span>
        </Link>
        <div className="topbar-status">
          <i /> FIVE-MINUTE DEMO · PHASE 8
        </div>
      </header>
      <section className="thesis">
        <p className="eyebrow">Movement becomes verified place intelligence</p>
        <h1>
          Run where the map
          <br />
          needs <em>eyes.</em>
        </h1>
        <p className="lede">
          EyeEarn rewards explorers for filling valuable real-world evidence
          gaps, then turns privacy-processed observations into cited answers for
          buyers and operators.
        </p>
        <div className="market-loop" aria-label="EyeEarn product loop">
          {["Demand", "Bounty", "Run", "Evidence", "Earn", "Answer"].map(
            (item, index) => (
              <span key={item}>
                {item}
                {index < 5 && <b aria-hidden="true">→</b>}
              </span>
            ),
          )}
        </div>
      </section>
      <section className="role-grid" aria-label="Choose a role">
        {roles.map((role) => (
          <article className="role-card" key={role.code}>
            <div className="role-meta">
              <span>{role.code}</span>
              <small>{role.state}</small>
            </div>
            <h2>{role.title}</h2>
            <p>{role.copy}</p>
            <Link href={role.href}>
              {role.action}
              <span aria-hidden="true">↗</span>
            </Link>
          </article>
        ))}
      </section>
      <footer className="shell-footer">
        <span>Runner → evidence → cited answer → replay</span>
        <Link href="/build-status.html">Build status</Link>
      </footer>
    </main>
  );
}
