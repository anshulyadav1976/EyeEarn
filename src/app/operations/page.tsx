"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  id?: string;
  category?: string;
  description?: string;
  modality?: string;
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
type State = "detected" | "analysing" | "confirmed" | "rejected" | "duplicate";
type Signal = Observation & {
  id: string;
  runId: string;
  state: State;
  severity: "low" | "medium" | "high";
  source: "runner" | "street sensor";
  time: string;
};
const centre: [number, number] = [-0.11, 51.51],
  states: State[] = [
    "confirmed",
    "analysing",
    "detected",
    "rejected",
    "duplicate",
  ];
const xy = (p: Point): [number, number] | null => {
  const rawX = p.lng ?? p.longitude,
    rawY = p.lat ?? p.latitude;
  if (rawX == null || rawY == null) return null;
  const x = Number(rawX),
    y = Number(rawY);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
};
const route = (r?: Run | null) =>
  r?.routePoints?.map(xy).filter((p): p is [number, number] => !!p) || [];
const signalData = (runs: Run[]): Signal[] =>
  [
    ...runs.flatMap((run, n) =>
      (run.observations || []).map((o, i) => ({
        ...o,
        id: o.id || `RUN-${n}${i}`,
        runId: run.id,
        state: states[(n + i) % 3],
        severity: (i % 3 === 0
          ? "high"
          : i % 2
            ? "medium"
            : "low") as Signal["severity"],
        source: "runner" as const,
        time: o.capturedAt || run.startedAt || new Date().toISOString(),
      })),
    ),
    ...(
      [
        [
          -0.091,
          51.514,
          "Footfall pulse",
          "High pedestrian flow at crossing",
          "analysing",
          "medium",
          "street sensor",
        ],
        [
          -0.122,
          51.505,
          "Roadworks",
          "Temporary lane closure observed",
          "confirmed",
          "high",
          "runner",
        ],
        [
          -0.074,
          51.521,
          "Street activity",
          "Late-night activity signal",
          "detected",
          "low",
          "runner",
        ],
        [
          -0.145,
          51.519,
          "Vehicle queue",
          "Duplicate of nearby sensor event",
          "duplicate",
          "low",
          "street sensor",
        ],
        [
          -0.103,
          51.509,
          "Low-light frame",
          "Evidence rejected before buyer use",
          "rejected",
          "low",
          "runner",
        ],
      ] as const
    ).map(
      (s, i) =>
        ({
          id: `L-04${i + 1}`,
          runId: "CITY-LIVE",
          longitude: s[0],
          latitude: s[1],
          category: s[2],
          description: s[3],
          state: s[4],
          severity: s[5],
          source: s[6],
          modality: i === 1 ? "fused" : "vision",
          time: new Date(Date.now() - (i + 1) * 150000).toISOString(),
        }) as Signal,
    ),
  ].sort((a, b) => +new Date(b.time) - +new Date(a.time));

function Map({
  runs,
  signals,
  selected,
  basemap,
  mode,
  pick,
}: {
  runs: Run[];
  signals: Signal[];
  selected: Signal | null;
  basemap: "street" | "satellite";
  mode: "2d" | "3d";
  pick: (s: Signal) => void;
}) {
  const el = useRef<HTMLDivElement>(null),
    map = useRef<MapLibreMap | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style: basemap === "street" ? streetMapStyle : satelliteMapStyle,
      center: centre,
      zoom: 11.2,
      maxZoom: 19,
      attributionControl: false,
    });
    map.current = m;
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    m.once("load", () => setReady(true));
    return () => {
      setReady(false);
      m.remove();
      map.current = null;
    };
  }, [basemap]);
  useEffect(() => {
    map.current?.easeTo({
      pitch: mode === "3d" ? 48 : 0,
      bearing: mode === "3d" ? 22 : 0,
      duration: 450,
    });
  }, [mode]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.isStyleLoaded()) return;
    ["routes", "signal-dots", "signal-halo"].forEach((id) => {
      if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(id)) m.removeSource(id);
    });
    const lines = runs.flatMap((r) => {
      const p = route(r);
      return p.length > 1
        ? [
            {
              type: "Feature" as const,
              properties: {},
              geometry: { type: "LineString" as const, coordinates: p },
            },
          ]
        : [];
    });
    m.addSource("routes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: lines },
    });
    m.addLayer({
      id: "routes",
      type: "line",
      source: "routes",
      paint: { "line-color": "#f83367", "line-width": 3, "line-opacity": 0.72 },
    });
    const points = signals
      .filter((s) => s.longitude != null && s.latitude != null)
      .map((s) => ({
        type: "Feature" as const,
        properties: { id: s.id, state: s.state, severity: s.severity },
        geometry: {
          type: "Point" as const,
          coordinates: [s.longitude!, s.latitude!],
        },
      }));
    m.addSource("signal-dots", {
      type: "geojson",
      data: { type: "FeatureCollection", features: points },
    });
    const colour = [
      "match",
      ["get", "state"],
      "confirmed",
      "#42d392",
      "analysing",
      "#ffd166",
      "rejected",
      "#f83367",
      "duplicate",
      "#6f7b80",
      "#9ac9ff",
    ] as unknown as maplibregl.ExpressionSpecification;
    m.addLayer({
      id: "signal-halo",
      type: "circle",
      source: "signal-dots",
      paint: {
        "circle-radius": [
          "match",
          ["get", "severity"],
          "high",
          18,
          "medium",
          14,
          11,
        ],
        "circle-color": colour,
        "circle-opacity": 0.18,
        "circle-blur": 0.2,
      },
    });
    m.addLayer({
      id: "signal-dots",
      type: "circle",
      source: "signal-dots",
      paint: {
        "circle-radius": [
          "match",
          ["get", "severity"],
          "high",
          8,
          "medium",
          6,
          5,
        ],
        "circle-color": colour,
        "circle-stroke-color": "#111619",
        "circle-stroke-width": 2,
      },
    });
    const stateColour: Record<State, string> = {
      confirmed: "#42d392",
      analysing: "#ffd166",
      detected: "#9ac9ff",
      rejected: "#f83367",
      duplicate: "#6f7b80",
    };
    const markers = signals.flatMap((signal) => {
      if (signal.longitude == null || signal.latitude == null) return [];
      const element = document.createElement("button");
      element.type = "button";
      element.title = `${signal.category || "Observation"} · ${signal.state}`;
      element.style.cssText = `width:16px;height:16px;border:2px solid #101416;border-radius:50%;background:${stateColour[signal.state]};box-shadow:0 0 0 7px ${stateColour[signal.state]}33;cursor:pointer`;
      element.addEventListener("click", () => pick(signal));
      return [
        new maplibregl.Marker({ element })
          .setLngLat([signal.longitude, signal.latitude])
          .addTo(m),
      ];
    });
    const click = (
      e: maplibregl.MapMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[];
      },
    ) => {
      const s = signals.find((x) => x.id === e.features?.[0]?.properties?.id);
      if (s) pick(s);
    };
    m.on("click", "signal-dots", click);
    m.on(
      "mouseenter",
      "signal-dots",
      () => (m.getCanvas().style.cursor = "pointer"),
    );
    m.on("mouseleave", "signal-dots", () => (m.getCanvas().style.cursor = ""));
    return () => {
      m.off("click", "signal-dots", click);
      markers.forEach((marker) => marker.remove());
    };
  }, [ready, runs, signals, pick]);
  useEffect(() => {
    if (selected?.longitude != null && selected.latitude != null)
      map.current?.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 14,
        duration: 500,
      });
  }, [selected, ready, basemap]);
  return (
    <div
      ref={el}
      className={styles.map}
      aria-label="Live London evidence map"
    />
  );
}

export default function OperationsPage() {
  const [runs, setRuns] = useState<Run[]>([]),
    [tab, setTab] = useState<"live" | "atlas">("live"),
    [selected, setSelected] = useState<Signal | null>(null),
    [mode, setMode] = useState<"2d" | "3d">("2d"),
    [base, setBase] = useState<"street" | "satellite">("street"),
    [now, setNow] = useState(0),
    [filters, setFilters] = useState({
      state: "all",
      severity: "all",
      modality: "all",
      source: "all",
      minutes: 90,
    });
  useEffect(() => {
    const load = () =>
      fetch("/api/runs")
        .then((x) => x.json())
        .then((d) => {
          setRuns((d.runs || []).slice(0, 20));
          setNow(Date.now());
        })
        .catch(() => {});
    load();
    const id = setInterval(() => {
      load();
      setNow(Date.now());
    }, 12000);
    return () => clearInterval(id);
  }, []);
  const all = useMemo(() => signalData(runs), [runs]);
  const visible = all.filter(
    (s) =>
      (filters.state === "all" || s.state === filters.state) &&
      (filters.severity === "all" || s.severity === filters.severity) &&
      (filters.modality === "all" || s.modality === filters.modality) &&
      (filters.source === "all" || s.source === filters.source) &&
      (!now || +new Date(s.time) > now - Number(filters.minutes) * 60000),
  );
  const shown = tab === "live" ? all.slice(0, 9) : visible;
  const set = (key: keyof typeof filters, value: string) =>
    setFilters((old) => ({ ...old, [key]: value }));
  const pick = useCallback((s: Signal) => setSelected(s), []);
  const count = (state: State) => all.filter((s) => s.state === state).length;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav>
          <Link href="/explore">Explore & Earn</Link>
          <Link href="/buyer">Buyer</Link>
          <b>Operations</b>
        </nav>
        <span className={styles.status}>● LIVE FIELD</span>
      </header>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Authority operations</p>
          <h1>
            City <em>signal.</em>
          </h1>
          <p>
            Every route, observation and review state as one usable London field
            picture.
          </p>
        </div>
        <div className={styles.tabbar}>
          <button
            className={tab === "live" ? styles.active : ""}
            onClick={() => setTab("live")}
          >
            Live
          </button>
          <button
            className={tab === "atlas" ? styles.active : ""}
            onClick={() => setTab("atlas")}
          >
            Atlas
          </button>
          <small>auto-sync · connected</small>
        </div>
      </section>
      <section className={styles.counters}>
        <div>
          <strong>{count("confirmed")}</strong>
          <span>confirmed</span>
        </div>
        <div>
          <strong>{count("analysing") + count("detected")}</strong>
          <span>needs review</span>
        </div>
        <div>
          <strong>{runs.length}</strong>
          <span>mapped runs</span>
        </div>
        <div>
          <strong>2</strong>
          <span>live sources</span>
        </div>
      </section>
      {tab === "atlas" && (
        <section className={styles.filters}>
          {(
            [
              ["state", "Status", ["all", ...states]],
              ["severity", "Severity", ["all", "high", "medium", "low"]],
              [
                "modality",
                "Mode",
                ["all", ...new Set(all.map((s) => s.modality || "manual"))],
              ],
              ["source", "Source", ["all", "runner", "street sensor"]],
            ] as const
          ).map(([key, label, options]) => (
            <label key={key}>
              {label}
              <select
                value={filters[key]}
                onChange={(e) => set(key, e.target.value)}
              >
                {options.map((x) => (
                  <option key={x} value={x}>
                    {x === "all" ? `All ${label.toLowerCase()}s` : x}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className={styles.time}>
            Last {filters.minutes} min
            <input
              aria-label="Time window"
              type="range"
              min="15"
              max="180"
              step="15"
              value={filters.minutes}
              onChange={(e) => set("minutes", e.target.value)}
            />
          </label>
        </section>
      )}
      <section className={styles.workspace}>
        <div className={styles.mapPanel}>
          <div className={styles.mapTools}>
            <span>
              {tab === "live"
                ? "LIVE INTELLIGENCE · LONDON"
                : `${shown.length} ATLAS SIGNALS`}
            </span>
            <div>
              <button
                className={base === "street" ? styles.active : ""}
                onClick={() => setBase("street")}
              >
                Street
              </button>
              <button
                className={base === "satellite" ? styles.active : ""}
                onClick={() => setBase("satellite")}
              >
                Satellite
              </button>
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
          <div className={styles.mapWrap}>
            <Map
              runs={runs}
              signals={shown}
              selected={selected}
              basemap={base}
              mode={mode}
              pick={pick}
            />
            <div className={styles.legend}>
              <i className={styles.confirmed} />
              confirmed <i className={styles.analysing} />
              analysing <i className={styles.detected} />
              detected <i className={styles.rejected} />
              rejected <i className={styles.duplicate} />
              duplicate
            </div>
          </div>
        </div>
        <aside className={styles.feed}>
          <div className={styles.feedHead}>
            <strong>
              {tab === "live" ? "Evidence ribbon" : "Atlas results"}
            </strong>
            <small>{shown.length} signals</small>
          </div>
          {shown.map((s) => (
            <button
              key={s.id}
              className={`${styles.signal} ${selected?.id === s.id ? styles.selected : ""}`}
              onClick={() => pick(s)}
            >
              <i className={styles[s.state]} />
              <div>
                <strong>{s.category || "Observation"}</strong>
                <small>{s.description || "Field evidence received"}</small>
                <span>
                  {s.state} · {s.modality} · {s.source}
                </span>
              </div>
              <time>
                {now
                  ? `${Math.max(1, Math.round((now - +new Date(s.time)) / 60000))}m`
                  : "now"}
              </time>
            </button>
          ))}
        </aside>
      </section>
      <section className={styles.detail}>
        {selected ? (
          <>
            <div>
              <p className={styles.eyebrow}>
                Selected evidence · {selected.id}
              </p>
              <h2>{selected.category}</h2>
              <p>{selected.description}</p>
            </div>
            <dl>
              <div>
                <dt>Review state</dt>
                <dd>
                  <i className={styles[selected.state]} />
                  {selected.state}
                </dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>
                  {selected.modality} · {selected.source}
                </dd>
              </div>
              <div>
                <dt>Severity</dt>
                <dd>{selected.severity}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>
            Select a point on the map or ribbon to inspect its evidence chain.
          </p>
        )}
      </section>
      <footer className={styles.footer}>
        <span>EyeEarn · Authority intelligence</span>
        <Link href="/buyer">Open buyer coverage →</Link>
      </footer>
    </main>
  );
}
