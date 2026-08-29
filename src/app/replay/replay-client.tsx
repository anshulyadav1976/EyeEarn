"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { satelliteMapStyle } from "@/lib/map-styles";
import styles from "./replay.module.css";
import BuyerToolsNav from "../buyer-tools-nav";

type Point = { latitude: number; longitude: number; recordedAt: string };
type Observation = {
  id: string;
  category: string;
  description: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  privacyState?: string;
};
type Completion = {
  zoneId: string;
  accepted: boolean;
  completedAt: string;
  rewardMinor: number;
};
type Run = {
  id: string;
  runnerName: string;
  startedAt: string;
  routePoints: Point[];
  observations: Observation[];
  completions: Completion[];
  earnedMinor: number;
  status: string;
};

const stratfordStart = Date.parse("2026-08-29T14:10:00.000Z");
const stratfordAnchors: Array<[number, number]> = [
  [-0.0032, 51.5413],
  [-0.0092, 51.5426],
  [-0.0137, 51.5449],
  [-0.0168, 51.5471],
  [-0.0115, 51.5489],
  [-0.0062, 51.5457],
  [-0.0032, 51.5413],
];
const stratfordPoints: Point[] = stratfordAnchors
  .slice(0, -1)
  .flatMap((start, segment) =>
    Array.from({ length: 8 }, (_, step) => {
      const end = stratfordAnchors[segment + 1];
      const t = step / 8;
      const index = segment * 8 + step;
      return {
        longitude: start[0] + (end[0] - start[0]) * t,
        latitude: start[1] + (end[1] - start[1]) * t,
        recordedAt: new Date(stratfordStart + index * 18_000).toISOString(),
      };
    }),
  );
stratfordPoints.push({
  longitude: stratfordAnchors.at(-1)![0],
  latitude: stratfordAnchors.at(-1)![1],
  recordedAt: new Date(stratfordStart + 48 * 18_000).toISOString(),
});
const demoObservation = (
  id: string,
  index: number,
  category: string,
  description: string,
): Observation => ({
  id,
  category,
  description,
  capturedAt: stratfordPoints[index].recordedAt,
  longitude: stratfordPoints[index].longitude,
  latitude: stratfordPoints[index].latitude,
  privacyState: "redacted",
});
const stratfordDemoRun: Run = {
  id: "DEMO-ANSHUL-STRATFORD",
  runnerName: "Anshul Walk · Stratford",
  startedAt: new Date(stratfordStart).toISOString(),
  routePoints: stratfordPoints,
  observations: [
    demoObservation(
      "STRAT-01",
      8,
      "Station accessibility",
      "Step-free Stratford station entrance clear; temporary wayfinding board visible.",
    ),
    demoObservation(
      "STRAT-02",
      19,
      "Crossing works",
      "Temporary barrier narrows the Olympic Park crossing while preserving a passable route.",
    ),
    demoObservation(
      "STRAT-03",
      31,
      "Crowd flow",
      "Moderate pedestrian flow near the park entrance with clear forward movement.",
    ),
    demoObservation(
      "STRAT-04",
      42,
      "Cycle lane",
      "Protected cycle lane and adjacent footway remain unobstructed on the return leg.",
    ),
  ],
  completions: [
    {
      zoneId: "stratford-station",
      accepted: true,
      completedAt: new Date(stratfordStart + 570_000).toISOString(),
      rewardMinor: 690,
    },
    {
      zoneId: "olympic-park-loop",
      accepted: true,
      completedAt: new Date(stratfordStart + 840_000).toISOString(),
      rewardMinor: 520,
    },
  ],
  earnedMinor: 1210,
  status: "handed-off",
};

const money = (minor: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(minor / 100);
const cleanPoints = (run?: Run | null) =>
  (run?.routePoints ?? []).filter(
    (point) =>
      Number.isFinite(point.longitude) && Number.isFinite(point.latitude),
  );
const coords = (points: Point[]) =>
  points.map((point) => [point.longitude, point.latitude] as [number, number]);
const km = (points: Point[]) =>
  points.slice(1).reduce((sum, point, index) => {
    const prior = points[index];
    const x =
      (point.longitude - prior.longitude) *
      Math.cos((((point.latitude + prior.latitude) / 2) * Math.PI) / 180);
    const y = point.latitude - prior.latitude;
    return sum + Math.sqrt(x * x + y * y) * 111.32;
  }, 0);

function ReplayMap({
  points,
  observations,
  progress,
}: {
  points: Point[];
  observations: Observation[];
  progress: number;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const visibleCount = Math.max(1, Math.ceil(points.length * progress));
  useEffect(() => {
    if (!element.current) return;
    const instance = new maplibregl.Map({
      container: element.current,
      style: satelliteMapStyle,
      center: points[0]
        ? [points[0].longitude, points[0].latitude]
        : [-0.11, 51.51],
      zoom: 14.4,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    instance.once("load", () => {
      setReady(true);
      if (points.length > 1)
        instance.fitBounds(
          [
            coords(points).reduce(
              (a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1])],
              [Infinity, Infinity],
            ),
            coords(points).reduce(
              (a, p) => [Math.max(a[0], p[0]), Math.max(a[1], p[1])],
              [-Infinity, -Infinity],
            ),
          ],
          { padding: 72, maxZoom: 15.5, duration: 0 },
        );
    });
    return () => {
      setReady(false);
      instance.remove();
      map.current = null;
    };
  }, [points]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance?.isStyleLoaded()) return;
    ["future-halo", "future", "revealed", "runner", "evidence"].forEach(
      (id) => {
        if (instance.getLayer(id)) instance.removeLayer(id);
        if (instance.getSource(id)) instance.removeSource(id);
      },
    );
    const line = (
      id: string,
      lineCoords: [number, number][],
      color: string,
      width: number,
      opacity: number,
    ) => {
      if (lineCoords.length < 2) return;
      instance.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: lineCoords },
        },
      });
      instance.addLayer({
        id,
        type: "line",
        source: id,
        paint: {
          "line-color": color,
          "line-width": width,
          "line-opacity": opacity,
        },
      });
    };
    const all = coords(points),
      shown = all.slice(0, visibleCount);
    line("future-halo", all, "#ffffff", 15, 0.92);
    line("future", all, "#ff1f6b", 9, 1);
    line("revealed", shown, "#161719", 6, 1);
    if (shown.length) {
      const current = shown.at(-1)!;
      instance.addSource("runner", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: current },
        },
      });
      instance.addLayer({
        id: "runner",
        type: "circle",
        source: "runner",
        paint: {
          "circle-radius": 9,
          "circle-color": "#ff1f6b",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fff",
        },
      });
      instance.easeTo({ center: current, duration: 700 });
    }
    const visibleObservations = observations.filter((observation) => {
      const index = points.findIndex(
        (point) =>
          Date.parse(point.recordedAt) >= Date.parse(observation.capturedAt),
      );
      return (
        index >= 0 &&
        index < visibleCount &&
        observation.latitude != null &&
        observation.longitude != null
      );
    });
    if (visibleObservations.length) {
      instance.addSource("evidence", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: visibleObservations.map((observation) => ({
            type: "Feature",
            properties: { label: observation.category },
            geometry: {
              type: "Point",
              coordinates: [observation.longitude!, observation.latitude!],
            },
          })),
        },
      });
      instance.addLayer({
        id: "evidence",
        type: "circle",
        source: "evidence",
        paint: {
          "circle-radius": 6,
          "circle-color": "#48d597",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#102b27",
        },
      });
    }
  }, [observations, points, progress, ready, visibleCount]);
  return (
    <>
      <div ref={element} className={styles.map} aria-label="Run replay map" />
      <svg
        className={styles.replayTrace}
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className={styles.traceHalo}
          d="M170 570 C95 430 160 210 350 155 C520 105 790 190 835 355 C870 485 650 575 470 545 C335 522 245 630 170 570"
        />
        <path
          className={styles.traceFuture}
          d="M170 570 C95 430 160 210 350 155 C520 105 790 190 835 355 C870 485 650 575 470 545 C335 522 245 630 170 570"
        />
        <path
          className={styles.traceRevealed}
          pathLength="100"
          style={{ strokeDashoffset: 100 - progress * 100 }}
          d="M170 570 C95 430 160 210 350 155 C520 105 790 190 835 355 C870 485 650 575 470 545 C335 522 245 630 170 570"
        />
        <circle
          className={styles.traceRunner}
          style={{ offsetDistance: `${progress * 100}%` }}
          cx="0"
          cy="0"
          r="10"
        />
      </svg>
    </>
  );
}

export default function ReplayClient() {
  const [runs, setRuns] = useState<Run[]>([stratfordDemoRun]);
  const [selectedId, setSelectedId] = useState(stratfordDemoRun.id);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const progressRef = useRef(0);
  const moveTo = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };
  useEffect(() => {
    fetch("/api/runs")
      .then((response) => response.json())
      .then((data) => {
        const usable = (data.runs ?? [])
          .filter((run: Run) => cleanPoints(run).length > 1)
          .sort(
            (a: Run, b: Run) =>
              b.completions.filter((item) => item.accepted).length * 100 +
              b.observations.length * 10 +
              cleanPoints(b).length / 100 -
              (a.completions.filter((item) => item.accepted).length * 100 +
                a.observations.length * 10 +
                cleanPoints(a).length / 100),
          );
        setRuns([stratfordDemoRun, ...usable]);
        setSelectedId(stratfordDemoRun.id);
      })
      .catch(() => setRuns([stratfordDemoRun]));
  }, []);
  const run = runs.find((item) => item.id === selectedId) ?? null;
  const points = useMemo(() => cleanPoints(run), [run]);
  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - (progressRef.current * 36000) / speed;
    let id = 0;
    const tick = (now: number) => {
      const next = Math.min(1, ((now - started) * speed) / 36000);
      progressRef.current = next;
      setProgress(next);
      if (next < 1) id = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, speed]);
  const visibleEvidence =
    run?.observations.filter((observation) => {
      const index = points.findIndex(
        (point) =>
          Date.parse(point.recordedAt) >= Date.parse(observation.capturedAt),
      );
      return index >= 0 && index < Math.ceil(points.length * progress);
    }) ?? [];
  const accepted =
    run?.completions.filter((completion) => completion.accepted) ?? [];
  const distance = km(points);
  const seconds = Math.round(progress * 36);
  const narration = run
    ? `${run.runnerName}'s route covers ${distance.toFixed(1)} kilometres. ${visibleEvidence.length ? `${visibleEvidence.length} privacy-processed observations have appeared.` : "Evidence appears as the route reaches each capture point."} ${progress === 1 ? `${accepted.length} bounty zones are now covered, earning ${money(run.earnedMinor)}.` : ""}`
    : "Choose a completed filmed run to see the route, evidence, coverage and earnings unfold together.";
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>
          EYE<span>EARN</span>
        </Link>
        <nav>
          <Link href="/explore">Explore</Link>
          <Link href="/buyer">Buyer</Link>
          <Link href="/operations">Operations</Link>
          <b>Replay</b>
        </nav>
        <span className={styles.live}>REPLAY STUDIO</span>
      </header>
      <BuyerToolsNav active="replay" />
      {run ? (
        <section className={styles.stage}>
          <aside className={styles.rail}>
            <p className={styles.eyebrow}>Recorded run</p>
            <h1>
              Evidence,
              <br />
              <em>in motion.</em>
            </h1>
            <select
              aria-label="Choose recorded run"
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value);
                moveTo(0);
                setPlaying(false);
              }}
            >
              {runs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id === stratfordDemoRun.id
                    ? item.runnerName
                    : `${item.runnerName} · ${item.id.slice(-5)}`}
                </option>
              ))}
            </select>
            <div className={styles.metrics}>
              <div>
                <small>Distance</small>
                <strong>
                  {distance.toFixed(1)}
                  <i>km</i>
                </strong>
              </div>
              <div>
                <small>Accepted</small>
                <strong>
                  {accepted.length}
                  <i>zones</i>
                </strong>
              </div>
              <div>
                <small>Earned</small>
                <strong>{money(run.earnedMinor)}</strong>
              </div>
            </div>
            <p className={styles.narration}>
              <span>FIELD NARRATION</span>
              {narration}
            </p>
          </aside>
          <div className={styles.mapFrame}>
            <ReplayMap
              points={points}
              observations={run.observations}
              progress={progress}
            />
            <div className={styles.progress}>
              <span>00:{String(seconds).padStart(2, "0")}</span>
              <input
                aria-label="Replay position"
                type="range"
                min="0"
                max="100"
                value={progress * 100}
                onChange={(event) => {
                  setPlaying(false);
                  moveTo(Number(event.target.value) / 100);
                }}
              />
              <span>00:36</span>
            </div>
            <div className={styles.controls}>
              <button
                className={styles.play}
                onClick={() => {
                  if (progress >= 1) moveTo(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "Pause" : progress >= 1 ? "Replay" : "Play run"}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  moveTo(0);
                }}
              >
                Restart
              </button>
              <div className={styles.speeds}>
                {([0.5, 1, 2] as const).map((item) => (
                  <button
                    key={item}
                    className={speed === item ? styles.active : ""}
                    onClick={() => setSpeed(item)}
                  >
                    {item}×
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.stamps}>
              {accepted.map((completion, index) => (
                <span
                  className={
                    progress >= (index + 1) / Math.max(1, accepted.length)
                      ? styles.covered
                      : ""
                  }
                  key={completion.zoneId}
                >
                  ★{" "}
                  {progress >= (index + 1) / Math.max(1, accepted.length)
                    ? "Covered"
                    : "Bounty open"}
                </span>
              ))}
            </div>
          </div>
          <aside className={styles.evidence}>
            <p className={styles.eyebrow}>Evidence feed</p>
            <h2>What the route saw</h2>
            {run.observations.length ? (
              <ol>
                {run.observations.map((observation) => {
                  const revealed = visibleEvidence.some(
                    (item) => item.id === observation.id,
                  );
                  return (
                    <li
                      key={observation.id}
                      className={revealed ? styles.revealed : ""}
                    >
                      <b>{revealed ? "✓" : "○"}</b>
                      <div>
                        <strong>{observation.category}</strong>
                        <p>
                          {revealed
                            ? observation.description
                            : "Waiting for route position"}
                        </p>
                        <small>
                          {observation.privacyState ?? "safe"} evidence
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.empty}>
                This run contains route data but no accepted observations.
              </p>
            )}
            <div className={styles.endcard}>
              <small>END STATE</small>
              <strong>
                {progress === 1
                  ? `${money(run.earnedMinor)} unlocked`
                  : "Run the replay"}
              </strong>
              <span>
                {accepted.length} accepted bounty zones · {run.status}
              </span>
            </div>
          </aside>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <p className={styles.eyebrow}>Replay studio</p>
          <h1>
            Every great field
            <br />
            story starts <em>outside.</em>
          </h1>
          <p>
            Once a runner submits a route with location points, its evidence and
            reward story will appear here. The static end card keeps this screen
            useful even before a live demo run.
          </p>
          <Link href="/explore">
            Start a filmed run <span>→</span>
          </Link>
          <div>
            <b>01</b>
            <span>Record a route</span>
            <b>02</b>
            <span>Submit safe evidence</span>
            <b>03</b>
            <span>Replay the payoff</span>
          </div>
        </section>
      )}
    </main>
  );
}
