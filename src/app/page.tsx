import Link from "next/link";
import BurningWick from "./burning-wick";
import MotionHeadline from "./motion-headline";
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
    title: "Ultra Enriched Data",
    copy: "Inspect the privacy-safe GeoJSON product without raw people, video or audio.",
    href: "/developers",
    action: "View methodology",
    state: "V1",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <BurningWick />
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="EyeEarn home">
          EYE<span>EARN</span>
        </Link>
        <span className={styles.system}>Field system · London · Phase 8</span>
        <nav aria-label="Primary navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/buyer">Buyer</Link>
          <Link href="/developers">Ultra Enriched Data</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Movement-powered place intelligence</p>
        <MotionHeadline />
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
          <h2>Three ways into the field loop.</h2>
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
