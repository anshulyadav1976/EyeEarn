"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { satelliteMapStyle } from "@/lib/map-styles";
import styles from "./replay.module.css";

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
      instance.remove();
      map.current = null;
    };
  }, [points]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance?.isStyleLoaded()) return;
    ["future", "revealed", "runner", "evidence"].forEach((id) => {
      if (instance.getLayer(id)) instance.removeLayer(id);
      if (instance.getSource(id)) instance.removeSource(id);
    });
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
    line("future", all, "#fff", 5, 0.24);
    line("revealed", shown, "#ff4261", 5, 1);
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
          "circle-color": "#ff4261",
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
    <div ref={element} className={styles.map} aria-label="Run replay map" />
  );
}

export default function ReplayClient() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
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
        setRuns(usable);
        setSelectedId(usable[0]?.id ?? "");
      })
      .catch(() => setRuns([]));
  }, []);
  const run = runs.find((item) => item.id === selectedId) ?? null;
  const points = useMemo(() => cleanPoints(run), [run]);
  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - (progress * 36000) / speed;
    let id = 0;
    const tick = (now: number) => {
      const next = Math.min(1, ((now - started) * speed) / 36000);
      setProgress(next);
      if (next < 1) id = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, progress, speed]);
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
                setProgress(0);
                setPlaying(false);
              }}
            >
              {runs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.runnerName} · {item.id.slice(-5)}
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
                  setProgress(Number(event.target.value) / 100);
                }}
              />
              <span>00:36</span>
            </div>
            <div className={styles.controls}>
              <button
                className={styles.play}
                onClick={() => {
                  if (progress >= 1) setProgress(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "Pause" : progress >= 1 ? "Replay" : "Play run"}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setProgress(0);
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
