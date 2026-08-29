import Link from "next/link";

const roles = [
  { code: "01", title: "Explore & Earn", copy: "Choose a high-value coverage gap, build a safe itinerary, and collect evidence with one start action.", href: "/explore", action: "Open Earn Map", state: "Ready" },
  { code: "02", title: "Buy Intelligence", copy: "Inspect what is known, what is missing, and fund a fresh evidence mission without invented certainty.", href: "/buyer", action: "View seeded dossier", state: "Seeded" },
  { code: "03", title: "Authority Operations", copy: "Follow runner movement and inspect the same evidence stream from an operational field view.", href: "/operations", action: "View operations", state: "Seeded" },
];

export default function Home() {
  return <main className="shell-page">
    <header className="topbar"><Link className="wordmark" href="/" aria-label="EyeEarn home">EYE<span>EARN</span></Link><div className="topbar-status"><i /> FIELD SYSTEM · PHASE 0</div></header>
    <section className="thesis">
      <p className="eyebrow">Movement becomes verified place intelligence</p>
      <h1>Run where the map<br />needs <em>eyes.</em></h1>
      <p className="lede">EyeEarn rewards explorers for filling valuable real-world evidence gaps, then turns privacy-processed observations into cited answers for buyers and operators.</p>
      <div className="market-loop" aria-label="EyeEarn product loop">{['Demand', 'Bounty', 'Run', 'Evidence', 'Earn', 'Answer'].map((item, index) => <span key={item}>{item}{index < 5 && <b aria-hidden="true">→</b>}</span>)}</div>
    </section>
    <section className="role-grid" aria-label="Choose a role">{roles.map((role) => <article className="role-card" key={role.code}>
      <div className="role-meta"><span>{role.code}</span><small>{role.state}</small></div><h2>{role.title}</h2><p>{role.copy}</p><Link href={role.href}>{role.action}<span aria-hidden="true">↗</span></Link>
    </article>)}</section>
    <footer className="shell-footer"><span>3 bounty zones · 5 seeded observations</span><Link href="/build-status.html">Build status</Link></footer>
  </main>;
}
