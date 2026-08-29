import Link from "next/link";
import styles from "./page.module.css";

const roles = [
  {
    code: "01",
    title: "Explore & Earn",
    copy: "Choose a London bounty, follow its itinerary and collect privacy-processed evidence.",
    href: "/explore",
    action: "Open earn map",
    state: "Ready",
  },
  {
    code: "02",
    title: "Buy Intelligence",
    copy: "Inspect known coverage, click an evidence gap and fund a fresh runner mission.",
    href: "/buyer",
    action: "Open buyer map",
    state: "Ready",
  },
  {
    code: "03",
    title: "Authority Atlas",
    copy: "See London routes, evidence signals and review states from one operational view.",
    href: "/operations",
    action: "Open operations",
    state: "Live",
  },
  {
    code: "04",
    title: "Ask the Street",
    copy: "Get a cited answer—or create a new bounty when the evidence is not strong enough.",
    href: "/intelligence",
    action: "Ask EyeEarn",
    state: "Cited",
  },
  {
    code: "05",
    title: "Replay a Run",
    copy: "Watch a recorded route, its evidence and accepted earnings unfold together.",
    href: "/replay",
    action: "Play evidence",
    state: "Recorded",
  },
  {
    code: "06",
    title: "Public Evidence",
    copy: "Inspect the privacy-safe GeoJSON product without raw people, video or audio.",
    href: "/developers",
    action: "View public API",
    state: "V1",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.edgePulse} aria-hidden="true" />
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="EyeEarn home">
          EYE<span>EARN</span>
        </Link>
        <span className={styles.system}>Field system · London · Phase 8</span>
        <nav aria-label="Primary navigation">
          <Link href="/explore">Earn</Link>
          <Link href="/buyer">Buy</Link>
          <Link href="/operations">Operate</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Movement-powered place intelligence</p>
        <h1>
          <span>Run</span>
          <span>and earn.</span>
        </h1>
        <p className={styles.statement}>
          Run where the map needs <em>eyes.</em>
        </p>
        <div className={styles.heroFoot}>
          <p>
            EyeEarn pays explorers to fill real-world evidence gaps, then turns
            privacy-processed observations into cited answers.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/explore">
              Start earning <span aria-hidden="true">↗</span>
            </Link>
            <Link className={styles.secondary} href="/buyer">
              Buy coverage
            </Link>
          </div>
        </div>
        <a className={styles.scrollCue} href="#demo-surfaces">
          Explore the system <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className={styles.surfaces} id="demo-surfaces">
        <div className={styles.sectionHead}>
          <p>One field system</p>
          <h2>Six ways to prove the loop.</h2>
          <span>Demand → bounty → run → evidence → earn → answer</span>
        </div>
        <div className={styles.grid}>
          {roles.map((role) => (
            <article className={styles.card} key={role.code}>
              <div className={styles.meta}>
                <span>{role.code}</span>
                <small>{role.state}</small>
              </div>
              <h3>{role.title}</h3>
              <p>{role.copy}</p>
              <Link href={role.href}>
                {role.action}
                <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Privacy processed · evidence grounded · London demo</span>
        <Link href="/build-status.html">Build status ↗</Link>
      </footer>
    </main>
  );
}
