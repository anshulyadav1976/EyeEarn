"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  intelligenceQuestions,
  type IntelligenceQuestion,
  type IntelligenceResponse,
} from "@/lib/intelligence";
import styles from "./intelligence.module.css";
import BuyerToolsNav from "../buyer-tools-nav";

type Citation = IntelligenceResponse["citations"][number];
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  provider?: string;
  result?: IntelligenceResponse;
};

const quickLabels: Record<IntelligenceQuestion, string> = {
  access: "Check South Bank access",
  compare: "Compare morning footfall",
  gap: "Find a coverage gap",
};

export default function IntelligencePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Secure channel open. Ask about London coverage, access, crowd flow or evidence freshness. I will cite the ledger—or tell you what is missing.",
      provider: "EyeEarn field desk",
    },
  ]);
  const [active, setActive] = useState<IntelligenceResponse | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const [funded, setFunded] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = async (text: string, question?: IntelligenceQuestion) => {
    if (loading || text.trim().length < 2) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
    };
    setMessages((old) => [...old, userMessage]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          question ? { question } : { message: text.trim() },
        ),
      });
      const data = (await response.json()) as {
        answer?: string;
        provider?: string;
        result?: IntelligenceResponse;
        citations?: Citation[];
        error?: string;
      };
      if (!response.ok || !data.answer)
        throw new Error(data.error || "Secure channel unavailable");
      if (data.result) setActive(data.result);
      setCitations(data.result?.citations || data.citations || []);
      setMessages((old) => [
        ...old,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer!,
          provider: data.provider,
          result: data.result,
        },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ask again");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav aria-label="Workspace">
          <Link href="/buyer">Buyer</Link>
          <Link href="/operations">Operations</Link>
          <b>Intelligence</b>
        </nav>
        <span className={styles.status}>● LUNA SECURE · MEDIUM</span>
      </header>
      <BuyerToolsNav active="ask" />
      <section className={styles.workspace}>
        <aside className={styles.leftRail}>
          <p className={styles.kicker}>Field intelligence / London</p>
          <h1>
            Ask the
            <br />
            <em>street.</em>
          </h1>
          <p className={styles.railCopy}>
            A private evidence desk for interrogating what London runners
            actually captured.
          </p>
          <div className={styles.channel}>
            <span>Channel</span>
            <b>EE-LDN-08</b>
            <span>Mode</span>
            <b>Evidence only</b>
            <span>Raw media</span>
            <b>Blocked</b>
          </div>
          <div className={styles.guardrail}>
            <i /> No fabrication protocol active
          </div>
        </aside>

        <section className={styles.chat}>
          <div className={styles.chatTop}>
            <div>
              <span>Secure transcript</span>
              <b>London evidence desk</b>
            </div>
            <small>
              Encrypted demo channel · {messages.length - 1} queries
            </small>
          </div>
          <div
            className={styles.quickActions}
            aria-label="Quick intelligence actions"
          >
            {intelligenceQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => void ask(question.label, question.id)}
                disabled={loading}
              >
                <small>{question.eyebrow}</small>
                <span>{quickLabels[question.id]}</span>
                <b>↗</b>
              </button>
            ))}
          </div>
          <div className={styles.transcript} aria-live="polite">
            {messages.map((message) => (
              <article className={styles[message.role]} key={message.id}>
                <div className={styles.avatar}>
                  {message.role === "user" ? "YOU" : "EE"}
                </div>
                <div>
                  <span>
                    {message.role === "user"
                      ? "Field request"
                      : message.provider}
                  </span>
                  <p>{message.text}</p>
                  {message.result && (
                    <div className={styles.resultStrip}>
                      <b>{message.result.headline}</b>
                      <span>{message.result.confidence}% confidence</span>
                      <span>{message.result.coverage}% coverage</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {loading && (
              <article className={styles.assistant}>
                <div className={styles.avatar}>EE</div>
                <div>
                  <span>Luna is checking the ledger</span>
                  <p className={styles.typing}>● ● ●</p>
                </div>
              </article>
            )}
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <form className={styles.composer} onSubmit={submit}>
            <label htmlFor="intel-question">
              Ask anything about London coverage
            </label>
            <div>
              <input
                ref={inputRef}
                id="intel-question"
                value={input}
                maxLength={500}
                onChange={(event) => setInput(event.target.value)}
                placeholder="e.g. Where is accessibility evidence going stale?"
              />
              <button disabled={loading || input.trim().length < 2}>
                Send ↗
              </button>
            </div>
            <small>Answers may cite only privacy-safe ledger records.</small>
          </form>
        </section>

        <aside className={styles.evidenceRail}>
          <div className={styles.radar} aria-hidden="true">
            <i />
            <b>LDN</b>
          </div>
          <div className={styles.evidenceHead}>
            <span>Live evidence intercept</span>
            <b>{citations.length || "—"} records</b>
          </div>
          {active ? (
            <section className={styles.dossier}>
              <small>
                {active.state === "gap" ? "Coverage gap" : "Verified brief"}
              </small>
              <h2>{active.headline}</h2>
              <div className={styles.scores}>
                <span>
                  <b>{active.confidence}%</b>Confidence
                </span>
                <span>
                  <b>{active.coverage}%</b>Coverage
                </span>
              </div>
              {active.mission && (
                <div className={styles.mission}>
                  <small>Recommended mission</small>
                  <strong>{active.mission.title}</strong>
                  <mark>{active.mission.reward}</mark>
                  <p>{active.mission.rationale}</p>
                  {funded ? (
                    <Link href="/explore">Funded — open bounty ↗</Link>
                  ) : (
                    <button onClick={fundMission} disabled={funding}>
                      {funding ? "Funding…" : "Fund mission"}
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            <p className={styles.emptyEvidence}>
              Run a quick action or ask a question to pin its evidence here.
            </p>
          )}
          <div className={styles.citations}>
            {citations.map((item) => (
              <article key={item.id}>
                <div>
                  <b>{item.id}</b>
                  <span>{item.time}</span>
                </div>
                <p>{item.label}</p>
                <small>{item.modality} · privacy processed</small>
              </article>
            ))}
          </div>
          <footer>Raw video · audio · identity never enter this channel</footer>
        </aside>
      </section>
    </main>
  );
}
