"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { seededObservations } from "@/lib/eyeearn-data";
import styles from "./buyer.module.css";
type Evidence = {
  id: string;
  place: string;
  freshness: string;
  age: string;
  available: string;
  coverage: string;
  source: string;
  privacy: string;
  confidence: string;
  note: string;
  priceMinor: number;
  range: string;
  color: string;
};
const evidence: Evidence[] = [
  {
    id: "south",
    place: "South access route",
    freshness: "Fresh",
    age: "12 min ago",
    available: "92%",
    coverage: "Visual + sound level",
    source: "Runner 01 · demo run",
    privacy: "Anonymized",
    confidence: "High",
    note: "Step-free route is clear. One temporary delivery barrier at the east kerb.",
    priceMinor: 920,
    range: "08:42–08:49",
    color: "hot",
  },
  {
    id: "river",
    place: "River gate approach",
    freshness: "Fresh",
    age: "31 min ago",
    available: "64%",
    coverage: "Visual only",
    source: "Runner 02 · external",
    privacy: "Anonymized",
    confidence: "Medium",
    note: "Gate visible and open. Sound sample is missing; traffic conditions may have changed.",
    priceMinor: 610,
    range: "08:12–08:16",
    color: "warm",
  },
  {
    id: "north",
    place: "North loop signage",
    freshness: "Aging",
    age: "3 days ago",
    available: "38%",
    coverage: "Visual + GPS",
    source: "Runner 04 · external",
    privacy: "Derived only",
    confidence: "Medium",
    note: "Sign points toward the stadium. Coverage is stale and no current obstruction check exists.",
    priceMinor: 380,
    range: "14 Aug · 16:10–16:14",
    color: "cool",
  },
];
const money = (minor: number) => `£${(minor / 100).toFixed(2)}`;
export default function BuyerPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("south");
  const [message, setMessage] = useState("");
  const [asOf, setAsOf] = useState("2026-08-29T08:49");
  const [timeWindow, setTimeWindow] = useState("24 hours");
  const [funded, setFunded] = useState(false);
  const selected = evidence.find((i) => i.id === selectedId) || evidence[0];
  const matches = useMemo(
    () => {
      const search = query.trim().toLowerCase();
      return search
        ? evidence.filter((i) => i.place.toLowerCase().includes(search))
        : [];
    },
    [query],
  );
  const questions = [
    "Is the route step-free?",
    "What is blocking access?",
    "How busy is it right now?",
  ];
  function purchase() {
    setMessage("Demo report purchased · anonymized evidence unlocked");
  }
  async function fund() {
    setMessage("Funding request queued…");
    try {
      const r = await fetch("/api/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId: selected.id,
          amountMinor: selected.priceMinor,
          currency: "GBP",
        }),
      });
      if (!r.ok) throw Error();
      setFunded(true);
      setMessage("Coverage request funded · receipt ready for the demo");
    } catch {
      setFunded(true);
      setMessage(
        "Demo funding recorded locally · connect /api/fund for live checkout",
      );
    }
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav>
          <Link href="/explore">Explore & Earn</Link>
          <b>Buyer</b>
          <Link href="/operations">Authority</Link>
        </nav>
        <span className={styles.status}>● DEMO EVIDENCE</span>
      </header>
      <section className={styles.intro}>
        <div>
          <p className={styles.kicker}>Buyer data map · phase 3</p>
          <h1>
            Buy the answer.
            <br />
            <em>See the gaps.</em>
          </h1>
          <p className={styles.lede}>
            A location dossier built from time-stamped, privacy-safe
            observations. Runner evidence and external data stay clearly
            labelled.
          </p>
        </div>
        <div className={styles.search}>
          <label htmlFor="location-search">Search locations</label>
          <input
            id="location-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “south” or “river”"
          />
          <div className={styles.suggestions}>
            {matches.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setQuery("");
                }}
              >
                {item.place}
                <small>
                  {item.freshness} · {money(item.priceMinor)}
                </small>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.mapWrap}>
        <div className={styles.map} aria-label="Evidence coverage map">
          <span className={styles.river}>RIVER LEA</span>
          <span className={styles.stadium}>LONDON STADIUM</span>
          <div className={styles.route} />
          {evidence.map((item, index) => (
            <button
              key={item.id}
              aria-label={`Open dossier for ${item.place}`}
              className={`${styles.pin} ${styles[item.color]} ${item.id === selected.id ? styles.active : ""}`}
              style={{
                left: `${[25, 70, 57][index]}%`,
                top: `${[66, 49, 20][index]}%`,
              }}
              onClick={() => setSelectedId(item.id)}
            >
              <span>{item.available}</span>
            </button>
          ))}
        </div>
        <div className={styles.mapKey}>
          <span>
            <i className={styles.hot} />
            fresh coverage
          </span>
          <span>
            <i className={styles.warm} />
            partial coverage
          </span>
          <span>
            <i className={styles.cool} />
            aging coverage
          </span>
          <b>{evidence.length} dossiers · anonymized first</b>
        </div>
      </section>
      <section className={styles.dossier}>
        <div className={styles.dossierHead}>
          <div>
            <p className={styles.kicker}>
              Location dossier · {selected.id.toUpperCase()}
            </p>
            <h2>{selected.place}</h2>
            <p className={styles.truth}>
              <span>●</span> {selected.source} · {selected.privacy} ·{" "}
              {selected.confidence} confidence
            </p>
          </div>
          <div className={styles.price}>
            <small>BUY CURRENT ANSWER</small>
            <strong>{money(selected.priceMinor)}</strong>
            <button onClick={fund} disabled={funded}>
              {funded ? "FUNDED ✓" : "Fund fresh coverage →"}
            </button>
            <button className={styles.report} onClick={purchase}>
              Purchase report
            </button>
            <label className={styles.time}>
              VIEW AS OF{" "}
              <input
                type="datetime-local"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </label>
            <label className={styles.time}>
              TIME RANGE{" "}
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
              >
                <option>1 hour</option>
                <option>24 hours</option>
                <option>7 days</option>
              </select>
            </label>
          </div>
        </div>
        <div className={styles.metrics}>
          {[
            ["Freshness", selected.freshness, selected.age],
            ["Availability", selected.available, "usable evidence"],
            ["Media / sound", selected.coverage, "sampled, not continuous"],
            [
              "Time coverage",
              selected.range,
              `${timeWindow} ending ${asOf.replace("T", " ")}`,
            ],
          ].map(([a, b, c]) => (
            <div key={a}>
              <small>{a}</small>
              <strong>{b}</strong>
              <span>{c}</span>
            </div>
          ))}
        </div>
        <div className={styles.columns}>
          <article className={styles.observation}>
            <p className={styles.kicker}>Observation cards</p>
            <h3>What the evidence says</h3>
            <div className={styles.card}>
              <div>
                <b>ACCESSIBILITY</b>
                <span>AI + runner</span>
              </div>
              <p>{selected.note}</p>
              <small>Timestamped observation · privacy review passed</small>
            </div>
            {seededObservations.slice(0, 3).map((item) => (
              <div className={styles.miniCard} key={item.id}>
                <b>{item.category}</b>
                <span>
                  {item.modality} · {item.privacyState}
                </span>
              </div>
            ))}
          </article>
          <article className={styles.answers}>
            <p className={styles.kicker}>Supported questions</p>
            <h3>Ask with confidence</h3>
            {questions.map((q) => (
              <button
                key={q}
                onClick={() =>
                  setMessage(
                    `${q} · answer available from ${selected.freshness.toLowerCase()} evidence`,
                  )
                }
              >
                {q}
                <span>→</span>
              </button>
            ))}
            <div className={styles.gaps}>
              <b>Evidence gaps</b>
              <p>
                {selected.coverage.includes("only")
                  ? "No sound sample. Crowd flow and current conditions are not answerable."
                  : "No continuous audio or identifying imagery is retained."}
              </p>
            </div>
          </article>
        </div>
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </section>
      <footer className={styles.footer}>
        <span>EyeEarn · evidence with a boundary</span>
        <Link href="/explore">Need coverage? Become a runner →</Link>
      </footer>
    </main>
  );
}
