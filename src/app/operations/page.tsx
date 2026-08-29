"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { londonSatelliteImageStyle } from "@/lib/map-styles";
import styles from "./operations.module.css";
type Run = {
  id: string;
  runnerName?: string;
  status?: string;
  startedAt?: string;
  routePoints?: Array<{
    lng?: number;
    lat?: number;
    longitude?: number;
    latitude?: number;
  }>;
  observations?: Array<{
    category?: string;
    description?: string;
    modality?: string;
    privacyState?: string;
    capturedAt?: string;
    longitude?: number;
    latitude?: number;
  }>;
};
const center: [number, number] = [-0.11, 51.51];
function SubmissionsMap({
  selected,
  mode,
}: {
  selected: Run | null;
  mode: "2d" | "3d";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: londonSatelliteImageStyle,
      center,
      zoom: 10.7,
      fadeDuration: 0,
      attributionControl: false,
    });
    map.current = m;
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    m.once("idle", () => m.resize());
    const resizeTimer = window.setTimeout(() => m.resize(), 350);
    return () => {
      window.clearTimeout(resizeTimer);
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (m) {
      m.easeTo({
        pitch: mode === "3d" ? 48 : 0,
        bearing: mode === "3d" ? 24 : 0,
        duration: 450,
      });
    }
  }, [mode]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const drawSubmission = () => {
      const coordinates =
        selected?.routePoints
          ?.map(
            (p) =>
              [Number(p.lng ?? p.longitude), Number(p.lat ?? p.latitude)] as [
                number,
                number,
              ],
          )
          .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])) || [];
      if (m.getLayer("selected-route")) m.removeLayer("selected-route");
      if (m.getSource("selected-route")) m.removeSource("selected-route");
      if (m.getLayer("evidence-points")) m.removeLayer("evidence-points");
      if (m.getSource("evidence-points")) m.removeSource("evidence-points");
      if (coordinates.length > 1) {
        m.addSource("selected-route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates },
            properties: {},
          },
        });
        m.addLayer({
          id: "selected-route",
          type: "line",
          source: "selected-route",
          paint: {
            "line-color": "#ff603c",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
        m.fitBounds(
          coordinates.reduce(
            (b, p) => b.extend(p),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
          ),
          { padding: 70, duration: 0, maxZoom: 13 },
        );
      } else {
        m.easeTo({ center, zoom: 10.7, duration: 400 });
      }
      const evidence = (selected?.observations || [])
        .filter(
          (item) =>
            Number.isFinite(item.longitude) && Number.isFinite(item.latitude),
        )
        .map((item) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [item.longitude!, item.latitude!],
          },
          properties: {},
        }));
      if (evidence.length) {
        m.addSource("evidence-points", {
          type: "geojson",
          data: { type: "FeatureCollection", features: evidence },
        });
        m.addLayer({
          id: "evidence-points",
          type: "circle",
          source: "evidence-points",
          paint: {
            "circle-radius": 7,
            "circle-color": "#79d5a3",
            "circle-stroke-color": "#101417",
            "circle-stroke-width": 3,
          },
        });
      }
    };
    if (m.isStyleLoaded()) drawSubmission();
    else m.once("load", drawSubmission);
    return () => {
      m.off("load", drawSubmission);
    };
  }, [selected]);
  return (
    <div ref={ref} className={styles.map} aria-label="Submitted runs map" />
  );
}
export default function OperationsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.runs || [])
          .filter(
            (run: Run) =>
              run.status === "handed-off" || run.status === "finished",
          )
          .slice(0, 8);
        setRuns(list);
        setSelected(
          list.find(
            (run: Run) =>
              (run.routePoints?.length || 0) > 5 &&
              (run.observations?.length || 0) > 2 &&
              run.observations?.some(
                (item) => item.category?.toLowerCase() === "route survey",
              ),
          ) ||
            list[0] ||
            null,
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav>
          <Link href="/explore">Explore & Earn</Link>
          <Link href="/buyer">Buyer</Link>
          <b>Submissions</b>
        </nav>
        <span className={styles.status}>● AUTHORITY VIEW</span>
      </header>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Operations · submitted evidence</p>
          <h1>
            See what
            <br />
            <em>came back.</em>
          </h1>
          <p>
            Every runner route, observation and privacy state in one reviewable
            field map.
          </p>
        </div>
        <div className={styles.summary}>
          <strong>{runs.length}</strong>
          <span>runs received</span>
          <strong>
            {runs.reduce((n, r) => n + (r.observations?.length || 0), 0)}
          </strong>
          <span>observations</span>
        </div>
      </section>
      <section className={styles.workspace}>
        <div className={styles.mapPanel}>
          <div className={styles.mapTools}>
            <strong>Submission map</strong>
            <div>
              <button
                className={mode === "2d" ? styles.active : ""}
                onClick={() => setMode("2d")}
              >
                2D
              </button>
              <button
                className={mode === "3d" ? styles.active : ""}
                onClick={() => setMode("3d")}
              >
                3D
              </button>
            </div>
          </div>
          <SubmissionsMap selected={selected} mode={mode} />
          <p className={styles.mapNote}>
            {mode === "3d"
              ? "Raised map view · pitch enabled where supported"
              : "Flat satellite route · select a run to inspect its evidence"}
          </p>
        </div>
        <aside className={styles.list}>
          <div className={styles.listHead}>
            <span>Recent submissions</span>
            <small>{loading ? "Loading…" : `${runs.length} total`}</small>
          </div>
          {!loading && !runs.length && (
            <div className={styles.empty}>
              No submissions yet.
              <br />
              <Link href="/explore">Start a runner run →</Link>
            </div>
          )}
          {runs.map((run) => (
            <button
              key={run.id}
              className={`${styles.run} ${selected?.id === run.id ? styles.selected : ""}`}
              onClick={() => setSelected(run)}
            >
              <span className={styles.runDot} />
              <div>
                <strong>{run.id}</strong>
                <small>
                  {run.runnerName || "Runner"} · {run.status || "received"}
                </small>
              </div>
              <b>
                {run.observations?.length || 0}
                <small>evidence</small>
              </b>
            </button>
          ))}
        </aside>
      </section>
      {selected && (
        <section className={styles.evidence}>
          <div>
            <p className={styles.eyebrow}>Evidence review</p>
            <h2>{selected.id}</h2>
            <p className={styles.meta}>
              {selected.runnerName || "Anonymous runner"} ·{" "}
              {selected.status || "submitted"} ·{" "}
              {selected.startedAt
                ? new Date(selected.startedAt).toLocaleString()
                : "recent"}
            </p>
          </div>
          <div className={styles.cards}>
            {(selected.observations || []).map((o, i) => (
              <article key={i}>
                <div>
                  <strong>{o.category || "Observation"}</strong>
                  <span>{o.modality || "manual"}</span>
                </div>
                <p>{o.description || "Evidence captured during the route."}</p>
                <small>
                  {o.privacyState || "privacy review pending"} ·{" "}
                  {o.capturedAt
                    ? new Date(o.capturedAt).toLocaleTimeString()
                    : "timestamped"}
                </small>
              </article>
            ))}
          </div>
        </section>
      )}
      <footer className={styles.footer}>
        <span>EyeEarn · authority review</span>
        <Link href="/buyer">Back to buyer map →</Link>
      </footer>
    </main>
  );
}
