import Link from "next/link";
import ProcessingLab from "./processing-lab";
import styles from "./developers.module.css";

const endpoints = [
  {
    method: "GET",
    path: "/api/public/v1/evidence?source=all",
    copy: "Privacy-safe EyeEarn observations plus labelled external fixtures.",
  },
  {
    method: "GET",
    path: "/api/public/v1/evidence?source=eyeearn",
    copy: "Runner-collected evidence only, returned as GeoJSON.",
  },
  {
    method: "GET",
    path: "/api/public/v1/evidence?source=external",
    copy: "Derived-only TfL JamCam-shaped demo records; never raw imagery.",
  },
];

export default function DevelopersPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav>
          <Link href="/intelligence">Intelligence</Link>
          <Link href="/operations">Authority</Link>
          <Link href="/replay">Replay</Link>
        </nav>
        <span>PUBLIC DATA · PHASE 8</span>
      </header>
      <section className={styles.hero}>
        <p>Evidence passport · v1</p>
        <h1>
          Useful data.
          <br />
          <em>No raw people.</em>
        </h1>
        <div className={styles.promise}>
          <strong>GeoJSON in</strong>
          <i>→</i>
          <strong>cited products out</strong>
          <small>
            Coordinates, category, provenance, time and privacy state. No raw
            camera frames, continuous audio or identity fields.
          </small>
        </div>
      </section>
      <ProcessingLab />
      <section className={styles.console}>
        <div className={styles.consoleHead}>
          <span>Safe public surface</span>
          <a href="/api/public/v1/evidence?source=all">Open live response ↗</a>
        </div>
        {endpoints.map((endpoint) => (
          <article key={endpoint.path}>
            <b>{endpoint.method}</b>
            <code>{endpoint.path}</code>
            <p>{endpoint.copy}</p>
            <a href={endpoint.path} aria-label={`Open ${endpoint.path}`}>
              ↗
            </a>
          </article>
        ))}
      </section>
      <section className={styles.sample}>
        <div>
          <p>External sample</p>
          <h2>TfL-shaped, clearly labelled.</h2>
        </div>
        <div className={styles.sampleCard}>
          <span>EXT-TFL-A12-BOW</span>
          <strong>A12 Bow interchange</strong>
          <p>Moderate eastbound flow; no persistent queue detected.</p>
          <footer>
            DERIVED AGGREGATE <b>·</b> NO IMAGE <b>·</b> DEMO FIXTURE
          </footer>
        </div>
      </section>
      <footer className={styles.footer}>
        <span>EyeEarn · evidence with a boundary</span>
        <Link href="/">Back to demo launchpad →</Link>
      </footer>
    </main>
  );
}
