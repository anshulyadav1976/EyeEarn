"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  intelligenceQuestions,
  type IntelligenceQuestion,
  type IntelligenceResponse,
} from "@/lib/intelligence";
import styles from "./intelligence.module.css";

const initial = "access" as IntelligenceQuestion;
const score = (number: number) => ({ width: `${number}%` });

export default function IntelligencePage() {
  const [selected, setSelected] = useState<IntelligenceQuestion>(initial);
  const [result, setResult] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [funding, setFunding] = useState(false);
  const [funded, setFunded] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/intelligence?question=${selected}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          result?: IntelligenceResponse;
          error?: string;
        };
        if (!response.ok || !data.result)
          throw new Error(data.error || "Intelligence is unavailable");
        return data.result;
      })
      .then((data) => mounted && setResult(data))
      .catch((reason: Error) => mounted && setError(reason.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [selected]);

  const fundMission = async () => {
    setFunding(true);
    const response = await fetch("/api/fund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locationId: "zone-greenwich",
        amountMinor: 820,
        currency: "GBP",
      }),
    });
    setFunding(false);
    setFunded(response.ok);
    if (!response.ok) setError("The demo bounty could not be funded.");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav aria-label="Workspace">
          <Link href="/buyer">Buyer workspace</Link>
          <Link href="/operations">Operations</Link>
          <Link className={styles.active} href="/intelligence">
            Intelligence
          </Link>
        </nav>
        <span className={styles.status}>
          <i /> privacy-safe answers
        </span>
      </header>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Buyer intelligence / London</p>
          <h1>
            Ask the <em>street.</em>
          </h1>
        </div>
        <p>
          Decision-ready place intelligence, grounded only in privacy-processed
          observations. Every answer shows its evidence—or says what is missing.
        </p>
      </section>
      <section className={styles.workspace}>
        <aside className={styles.questions} aria-label="Suggested questions">
          <p className={styles.sectionLabel}>Suggested questions</p>
          {intelligenceQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => {
                setSelected(question.id);
                setLoading(true);
                setError("");
              }}
              className={
                selected === question.id ? styles.selectedQuestion : ""
              }
            >
              <small>{question.eyebrow}</small>
              <span>{question.label}</span>
              <b>↗</b>
            </button>
          ))}
          <div className={styles.guardrail}>
            <strong>No fabrication.</strong>
            <span>Thin evidence creates a mission, not a made-up answer.</span>
          </div>
        </aside>
        <section className={styles.answer} aria-live="polite">
          {loading && (
            <div className={styles.loading}>Checking the evidence ledger…</div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          {result && !loading && (
            <>
              <div className={styles.answerTop}>
                <p className={styles.sectionLabel}>
                  {result.state === "gap"
                    ? "Evidence gap"
                    : "Evidence-backed answer"}
                </p>
                <div className={styles.scores}>
                  <span>
                    Confidence <b>{result.confidence}%</b>
                  </span>
                  <span>
                    Coverage <b>{result.coverage}%</b>
                  </span>
                </div>
              </div>
              <h2>{result.headline}</h2>
              <p className={styles.answerCopy}>{result.answer}</p>
              <div className={styles.meters}>
                <div>
                  <span>Confidence</span>
                  <i>
                    <b style={score(result.confidence)} />
                  </i>
                </div>
                <div>
                  <span>Area coverage</span>
                  <i>
                    <b style={score(result.coverage)} />
                  </i>
                </div>
              </div>
              {result.mission ? (
                <div className={styles.mission}>
                  <p className={styles.sectionLabel}>Proposed fresh coverage</p>
                  <h3>
                    {result.mission.title} <mark>{result.mission.reward}</mark>
                  </h3>
                  <p>{result.mission.rationale}</p>
                  <span>◎ {result.mission.location}</span>
                  {funded ? (
                    <Link href="/explore">Funded — view runner bounty →</Link>
                  ) : (
                    <button onClick={fundMission} disabled={funding}>
                      {funding ? "Funding…" : "Fund this coverage →"}
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.compare}>
                  <p className={styles.sectionLabel}>
                    Matched evidence comparison
                  </p>
                  {result.comparison.map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <i>
                        <b style={score(item.value)} />
                      </i>
                      <em>{item.note}</em>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.method}>
                <p className={styles.sectionLabel}>Method</p>
                <p>{result.methodology}</p>
              </div>
            </>
          )}
        </section>
        {result && !loading && (
          <aside className={styles.evidence}>
            <div className={styles.evidenceHeader}>
              <p className={styles.sectionLabel}>Cited evidence</p>
              <span>{result.citations.length} records</span>
            </div>
            <div className={styles.miniMap} aria-label="Evidence positions map">
              {result.citations.map((item, index) => (
                <span
                  key={item.id}
                  className={styles[`pin${index}`]}
                  title={item.id}
                >
                  +
                </span>
              ))}
              <b>South Bank</b>
              <i>River Thames</i>
            </div>
            <div className={styles.evidenceGrid}>
              {result.citations.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.id}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.label}</p>
                  <small>{item.modality} · privacy processed</small>
                </article>
              ))}
            </div>
            <p className={styles.citationNote}>
              Evidence IDs are durable references. Raw video, audio, device
              identity and direct identifiers are never exposed here.
            </p>
          </aside>
        )}
      </section>
    </main>
  );
}
