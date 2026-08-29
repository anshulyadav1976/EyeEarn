"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { satelliteMapStyle, streetMapStyle } from "@/lib/map-styles";
import styles from "./operations.module.css";

type Point = {
  lng?: number;
  lat?: number;
  longitude?: number;
  latitude?: number;
};
type Observation = {
  category?: string;
  description?: string;
  modality?: string;
  privacyState?: string;
  capturedAt?: string;
  longitude?: number;
  latitude?: number;
};
type Run = {
  id: string;
  runnerName?: string;
  status?: string;
  startedAt?: string;
  routePoints?: Point[];
  observations?: Observation[];
};
const london: [number, number] = [-0.11, 51.51];
const coordinate = (point: Point): [number, number] | null => {
  const rawLng = point.lng ?? point.longitude;
  const rawLat = point.lat ?? point.latitude;
  if (rawLng == null || rawLat == null) return null;
  const lng = Number(rawLng);
  const lat = Number(rawLat);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
};
const runCoordinates = (run: Run | null) =>
  run?.routePoints
    ?.map(coordinate)
    .filter((point): point is [number, number] => Boolean(point)) || [];
const kilometres = (points: [number, number][]) => {
  let metres = 0;
  for (let index = 1; index < points.length; index += 1) {
    const [aLng, aLat] = points[index - 1];
    const [bLng, bLat] = points[index];
    const x =
      (((bLng - aLng) * Math.PI) / 180) *
      Math.cos(((aLat + bLat) * Math.PI) / 360);
    const y = ((bLat - aLat) * Math.PI) / 180;
    metres += Math.sqrt(x * x + y * y) * 6371000;
  }
  return metres / 1000;
};

function SubmissionsMap({
  selected,
  runs,
  mode,
  basemap,
}: {
  selected: Run | null;
  runs: Run[];
  mode: "2d" | "3d";
  basemap: "street" | "satellite";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const selectedCoordinates = useMemo(
    () => runCoordinates(selected),
    [selected],
  );
  useEffect(() => {
    if (!ref.current) return;
    setReady(false);
    const instance = new maplibregl.Map({
      container: ref.current,
      style: basemap === "satellite" ? satelliteMapStyle : streetMapStyle,
      center: london,
      zoom: 10.9,
      maxZoom: 19,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    instance.once("load", () => {
      instance.resize();
      setReady(true);
    });
    return () => {
      setReady(false);
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      instance.remove();
      map.current = null;
    };
  }, [basemap]);
  useEffect(() => {
    map.current?.easeTo({
      pitch: mode === "3d" ? 52 : 0,
      bearing: mode === "3d" ? 22 : 0,
      duration: 450,
    });
  }, [mode]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || !instance.isStyleLoaded()) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    const addMarker = (
      point: [number, number],
      className: string,
      label?: string,
    ) => {
      const element = document.createElement("span");
      element.className = className;
      if (label) {
        element.textContent = label;
        element.setAttribute("aria-label", label);
      }
      markers.current.push(
        new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat(point)
          .addTo(instance),
      );
    };
    const remove = (id: string) => {
      if (instance.getLayer(id)) instance.removeLayer(id);
      if (instance.getSource(id)) instance.removeSource(id);
    };
    [
      "all-routes",
      "selected-halo",
      "selected-route",
      "route-ends",
      "evidence-halo",
      "evidence-points",
    ].forEach(remove);
    const allRoutes = runs.flatMap((run) => {
      const coordinates = runCoordinates(run);
      coordinates
        .filter(
          (_, index) =>
            index % Math.max(1, Math.ceil(coordinates.length / 8)) === 0,
        )
        .forEach((point) => addMarker(point, styles.allTrail));
      return coordinates.length > 1
        ? [
            {
              type: "Feature" as const,
              properties: { id: run.id },
              geometry: { type: "LineString" as const, coordinates },
            },
          ]
        : [];
    });
    if (allRoutes.length) {
      instance.addSource("all-routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: allRoutes },
      });
      instance.addLayer({
        id: "all-routes",
        type: "line",
        source: "all-routes",
        paint: {
          "line-color": basemap === "satellite" ? "#fff" : "#5d6c70",
          "line-width": 2.2,
          "line-opacity": 0.55,
        },
      });
    }
    if (selectedCoordinates.length > 1) {
      selectedCoordinates
        .filter(
          (_, index) =>
            index % Math.max(1, Math.ceil(selectedCoordinates.length / 28)) ===
            0,
        )
        .forEach((point) => addMarker(point, styles.selectedTrail));
      addMarker(selectedCoordinates[0], styles.routeEndpoint, "S");
      addMarker(
        selectedCoordinates[selectedCoordinates.length - 1],
        `${styles.routeEndpoint} ${styles.finishEndpoint}`,
        "F",
      );
      const line = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: selectedCoordinates,
        },
      };
      instance.addSource("selected-halo", { type: "geojson", data: line });
      instance.addLayer({
        id: "selected-halo",
        type: "line",
        source: "selected-halo",
        paint: {
          "line-color": "#f83367",
          "line-width": 10,
          "line-opacity": 0.28,
          "line-blur": 2,
        },
      });
      instance.addSource("selected-route", { type: "geojson", data: line });
      instance.addLayer({
        id: "selected-route",
        type: "line",
        source: "selected-route",
        paint: {
          "line-color": "#f83367",
          "line-width": 4.5,
          "line-opacity": 1,
        },
      });
      instance.addSource("route-ends", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature" as const,
              properties: { kind: "start" },
              geometry: {
                type: "Point" as const,
                coordinates: selectedCoordinates[0],
              },
            },
            {
              type: "Feature" as const,
              properties: { kind: "finish" },
              geometry: {
                type: "Point" as const,
                coordinates:
                  selectedCoordinates[selectedCoordinates.length - 1],
              },
            },
          ],
        },
      });
      instance.addLayer({
        id: "route-ends",
        type: "circle",
        source: "route-ends",
        paint: {
          "circle-radius": ["match", ["get", "kind"], "start", 8, 10],
          "circle-color": [
            "match",
            ["get", "kind"],
            "start",
            "#42d392",
            "#f83367",
          ],
          "circle-stroke-color": "#101417",
          "circle-stroke-width": 3,
        },
      });
    }
    const evidence = (selected?.observations || []).flatMap((item, index) =>
      Number.isFinite(item.longitude) && Number.isFinite(item.latitude)
        ? [
            {
              type: "Feature" as const,
              properties: {
                index,
                secure:
                  item.privacyState?.toLowerCase().includes("safe") ||
                  item.privacyState?.toLowerCase().includes("approved")
                    ? "safe"
                    : "review",
              },
              geometry: {
                type: "Point" as const,
                coordinates: [item.longitude!, item.latitude!],
              },
            },
          ]
        : [],
    );
    if (evidence.length) {
      evidence.forEach((item, index) =>
        addMarker(
          item.geometry.coordinates as [number, number],
          item.properties.secure === "safe"
            ? styles.safeEvidence
            : styles.reviewEvidence,
          String(index + 1),
        ),
      );
      const collection = {
        type: "FeatureCollection" as const,
        features: evidence,
      };
      instance.addSource("evidence-halo", {
        type: "geojson",
        data: collection,
      });
      instance.addLayer({
        id: "evidence-halo",
        type: "circle",
        source: "evidence-halo",
        paint: {
          "circle-radius": 16,
          "circle-color": "#42d392",
          "circle-opacity": 0.16,
          "circle-blur": 0.35,
        },
      });
      instance.addSource("evidence-points", {
        type: "geojson",
        data: collection,
      });
      instance.addLayer({
        id: "evidence-points",
        type: "circle",
        source: "evidence-points",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "secure"],
            "safe",
            "#42d392",
            "#ffd166",
          ],
          "circle-stroke-color": "#101417",
          "circle-stroke-width": 2.5,
        },
      });
    }
    if (selectedCoordinates.length > 1) {
      instance.fitBounds(
        selectedCoordinates.reduce(
          (bounds, point) => bounds.extend(point),
          new maplibregl.LngLatBounds(
            selectedCoordinates[0],
            selectedCoordinates[0],
          ),
        ),
        {
          padding: { top: 88, right: 82, bottom: 82, left: 82 },
          maxZoom: 17,
          duration: 600,
        },
      );
    }
  }, [basemap, ready, runs, selected, selectedCoordinates]);
  return (
    <div className={styles.mapWrap}>
      <div
        ref={ref}
        className={styles.map}
        aria-label="Interactive submitted runs map"
      />
      <div className={styles.mapLegend}>
        <span>
          <i className={styles.routeKey} />
          selected route
        </span>
        <span>
          <i className={styles.evidenceKey} />
          evidence point
        </span>
      </div>
      {selected && (
        <div className={styles.mapReadout}>
          <span>ACTIVE REVIEW</span>
          <strong>{selected.runnerName || "Anonymous runner"}</strong>
          <small>
            {selectedCoordinates.length > 1
              ? `${kilometres(selectedCoordinates).toFixed(2)} km · `
              : ""}
            {selected.observations?.length || 0} evidence points
          </small>
        </div>
      )}
    </div>
  );
}

export default function OperationsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [basemap, setBasemap] = useState<"street" | "satellite">("street");
  const [loading, setLoading] = useState(true);
  const observations = useMemo(
    () =>
      runs.reduce((total, run) => total + (run.observations?.length || 0), 0),
    [runs],
  );
  useEffect(() => {
    fetch("/api/runs")
      .then((response) => response.json())
      .then((data) => {
        const list = (data.runs || [])
          .filter(
            (run: Run) =>
              run.status === "handed-off" || run.status === "finished",
          )
          .slice(0, 12);
        setRuns(list);
        setSelected(
          list
            .filter((run: Run) => runCoordinates(run).length > 1)
            .sort(
              (a: Run, b: Run) =>
                (b.observations?.length || 0) - (a.observations?.length || 0) ||
                kilometres(runCoordinates(b)) - kilometres(runCoordinates(a)),
            )[0] ||
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
          <p className={styles.eyebrow}>Operations · evidence intelligence</p>
          <h1>
            City
            <br />
            <em>coverage.</em>
          </h1>
          <p>
            Routes, verified observations and collection gaps—read as one live
            London field picture.
          </p>
        </div>
        <div className={styles.summary}>
          <strong>{runs.length}</strong>
          <span>runs received</span>
          <strong>{observations}</strong>
          <span>evidence points</span>
        </div>
      </section>
      <section className={styles.workspace}>
        <div className={styles.mapPanel}>
          <div className={styles.mapTools}>
            <div>
              <strong>London evidence field</strong>
              <small>
                {selected
                  ? `Viewing ${selected.id.slice(0, 12)}`
                  : "Choose a submission"}
              </small>
            </div>
            <div className={styles.toolButtons}>
              <button
                className={basemap === "street" ? styles.active : ""}
                onClick={() => setBasemap("street")}
              >
                Street
              </button>
              <button
                className={basemap === "satellite" ? styles.active : ""}
                onClick={() => setBasemap("satellite")}
              >
                Satellite
              </button>
              <span className={styles.divider} />
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
          <SubmissionsMap
            selected={selected}
            runs={runs}
            mode={mode}
            basemap={basemap}
          />
          <p className={styles.mapNote}>
            {mode === "3d"
              ? "Perspective view · drag to inspect terrain and evidence sequence"
              : "Pink: selected route · green: privacy-cleared evidence · amber: review state"}
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
          {runs.map((run) => {
            const points = runCoordinates(run);
            return (
              <button
                key={run.id}
                className={`${styles.run} ${selected?.id === run.id ? styles.selected : ""}`}
                onClick={() => setSelected(run)}
              >
                <span className={styles.runDot} />
                <div>
                  <strong>{run.runnerName || "Anonymous runner"}</strong>
                  <small>
                    {points.length > 1
                      ? `${kilometres(points).toFixed(1)} km`
                      : "Route pending"}{" "}
                    · {run.status || "received"}
                  </small>
                </div>
                <b>
                  {run.observations?.length || 0}
                  <small>evidence</small>
                </b>
              </button>
            );
          })}
        </aside>
      </section>
      {selected && (
        <section className={styles.evidence}>
          <div className={styles.evidenceHead}>
            <div>
              <p className={styles.eyebrow}>Selected submission</p>
              <h2>{selected.runnerName || "Anonymous runner"}</h2>
              <p className={styles.meta}>
                {selected.status || "submitted"} ·{" "}
                {selected.startedAt
                  ? new Date(selected.startedAt).toLocaleString()
                  : "recent"}{" "}
                · evidence is privacy-screened before review
              </p>
            </div>
            <div className={styles.evidenceStat}>
              <strong>{selected.observations?.length || 0}</strong>
              <span>recorded signals</span>
            </div>
          </div>
          <div className={styles.cards}>
            {(selected.observations || [])
              .slice(0, 6)
              .map((observation, index) => (
                <article key={`${observation.capturedAt}-${index}`}>
                  <div>
                    <strong>
                      #{String(index + 1).padStart(2, "0")} ·{" "}
                      {observation.category || "Observation"}
                    </strong>
                    <span>{observation.modality || "manual"}</span>
                  </div>
                  <p>
                    {observation.description ||
                      "Evidence captured during the route."}
                  </p>
                  <small>
                    {observation.privacyState || "privacy review pending"} ·{" "}
                    {observation.capturedAt
                      ? new Date(observation.capturedAt).toLocaleTimeString()
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
