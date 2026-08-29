"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { ChangeEvent } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { streetMapStyle } from "@/lib/map-styles";
import styles from "./buyer.module.css";
type Coverage = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  coverage: number;
  freshness: string;
  rewardMinor: number;
  note: string;
};
const locations: Coverage[] = [
  {
    id: "zone-south-access",
    name: "South Bank access route",
    lng: -0.106,
    lat: 51.505,
    coverage: 92,
    freshness: "Fresh · 12m",
    rewardMinor: 920,
    note: "Step-free route check and temporary obstruction scan.",
  },
  {
    id: "zone-river-gate",
    name: "River gate approach",
    lng: -0.01485,
    lat: 51.5404,
    coverage: 64,
    freshness: "Fresh · 31m",
    rewardMinor: 610,
    note: "Visual coverage is good; a sound sample is still needed.",
  },
  {
    id: "zone-north-loop",
    name: "North loop signage",
    lng: -0.142,
    lat: 51.565,
    coverage: 38,
    freshness: "Aging · 3d",
    rewardMinor: 380,
    note: "Refresh signage and obstruction evidence around the loop.",
  },
  {
    id: "london-camden",
    name: "Camden market approach",
    lng: -0.142,
    lat: 51.541,
    coverage: 54,
    freshness: "Fresh · 2h",
    rewardMinor: 740,
    note: "Crowd flow and step-free access around the market.",
  },
  {
    id: "london-greenwich",
    name: "Greenwich footway",
    lng: 0.002,
    lat: 51.478,
    coverage: 27,
    freshness: "Aging · 6d",
    rewardMinor: 520,
    note: "Current route condition and wayfinding refresh.",
  },
  {
    id: "london-paddington",
    name: "Paddington interchange",
    lng: -0.176,
    lat: 51.516,
    coverage: 71,
    freshness: "Fresh · 45m",
    rewardMinor: 680,
    note: "Entrance accessibility and temporary works scan.",
  },
  {
    id: "london-clapham",
    name: "Clapham junction",
    lng: -0.17,
    lat: 51.465,
    coverage: 43,
    freshness: "Fresh · 4h",
    rewardMinor: 460,
    note: "Crossing safety and pavement obstruction evidence.",
  },
  {
    id: "london-hampstead",
    name: "Hampstead Heath edge",
    lng: -0.178,
    lat: 51.56,
    coverage: 19,
    freshness: "Aging · 9d",
    rewardMinor: 810,
    note: "Trail entrance condition and accessible route check.",
  },
  {
    id: "london-stratford",
    name: "Stratford east route",
    lng: -0.004,
    lat: 51.542,
    coverage: 61,
    freshness: "Fresh · 1h",
    rewardMinor: 590,
    note: "Route continuity and signage near the station.",
  },
  {
    id: "london-richmond",
    name: "Richmond riverside",
    lng: -0.301,
    lat: 51.461,
    coverage: 34,
    freshness: "Aging · 4d",
    rewardMinor: 430,
    note: "Riverside access, steps and temporary barriers.",
  },
];
const money = (minor: number) => `£${(minor / 100).toFixed(2)}`;
const bounds: [[number, number], [number, number]] = [
  [-0.52, 51.3],
  [0.32, 51.7],
];
function CoverageMap({
  locations,
  selected,
  satellite,
  onSelect,
  onMapClick,
}: {
  locations: Coverage[];
  selected: Coverage | null;
  satellite: boolean;
  onSelect: (item: Coverage) => void;
  onMapClick: (lng: number, lat: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    if (!host.current || map.current) return;
    const instance = new maplibregl.Map({
      container: host.current,
      style: streetMapStyle,
      center: [-0.11, 51.51],
      zoom: 10.2,
      maxBounds: bounds,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    instance.on("click", (e) => onMapClick(e.lngLat.lng, e.lngLat.lat));
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [onMapClick]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !instance.isStyleLoaded()) return;
    if (satellite && !instance.getSource("satellite")) {
      instance.addSource("satellite", {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
      });
      instance.addLayer({
        id: "satellite",
        type: "raster",
        source: "satellite",
      });
    } else if (!satellite && instance.getLayer("satellite")) {
      instance.removeLayer("satellite");
      instance.removeSource("satellite");
    }
  }, [satellite]);
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((m) => m.remove());
    markers.current = locations.map((item) => {
      const el = document.createElement("button");
      el.type = "button";
      el.title = `${item.name} · ${money(item.rewardMinor)}`;
      el.className = `${styles.marker} ${item.coverage < 40 ? styles.low : item.coverage < 70 ? styles.mid : styles.high}`;
      el.innerHTML = `<span>${item.coverage}%</span>`;
      el.onclick = (e) => {
        e.stopPropagation();
        onSelect(item);
      };
      return new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .addTo(map.current!);
    });
    if (selected)
      map.current.flyTo({
        center: [selected.lng, selected.lat],
        zoom: Math.max(map.current.getZoom(), 12),
        duration: 500,
      });
  }, [locations, selected, onSelect]);
  return (
    <div ref={host} className={styles.map} aria-label="London coverage map" />
  );
}
export default function BuyerPage() {
  const [coverageLocations, setCoverageLocations] =
    useState<Coverage[]>(locations);
  const [selected, setSelected] = useState<Coverage | null>(locations[0]);
  const [satellite, setSatellite] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requirement, setRequirement] = useState(
    "Access and obstruction check",
  );
  const [budget, setBudget] = useState("8");
  useEffect(() => {
    fetch("/api/fund")
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.zones)) return;
        const live = data.zones
          .filter((zone: { safeForDemo?: boolean }) => zone.safeForDemo)
          .map(
            (
              zone: {
                id: string;
                name: string;
                coordinates: [number, number];
                rewardMinor: number;
                evidence: string;
              },
              index: number,
            ) => {
              const known = locations.find((item) => item.id === zone.id);
              return {
                id: zone.id,
                name: zone.name,
                lng: zone.coordinates[0],
                lat: zone.coordinates[1],
                coverage: known?.coverage ?? (index * 17 + 23) % 76,
                freshness: known?.freshness ?? "Needs fresh evidence",
                rewardMinor: zone.rewardMinor,
                note: zone.evidence,
              } satisfies Coverage;
            },
          );
        if (live.length) {
          setCoverageLocations(live);
          setSelected(
            (current) =>
              live.find((item: Coverage) => item.id === current?.id) ?? live[0],
          );
        }
      })
      .catch(() => {});
  }, []);
  const matches = coverageLocations
    .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
  async function postFund(amount: number, verb: string) {
    if (!selected) return;
    setMessage("Sending coverage request…");
    try {
      const r = await fetch("/api/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId: selected.id,
          amountMinor: amount,
          currency: "GBP",
          requirement,
          safeForDemo: true,
          name: selected.name,
          coordinates: [selected.lng, selected.lat],
        }),
      });
      if (!r.ok) throw Error();
      setMessage(`${selected.name} is funded · runners can now collect it`);
    } catch {
      setMessage(
        `${verb} recorded for the demo · ${selected.name} · ${money(amount)} bounty`,
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
          <Link href="/operations">Submissions</Link>
        </nav>
        <span className={styles.status}>● BUYER CONSOLE</span>
      </header>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Coverage desk · London</p>
          <h1>
            Find the
            <br />
            <em>missing view.</em>
          </h1>
          <p>
            Click any point on the map to inspect evidence, buy a current
            answer, or request fresh coverage.
          </p>
        </div>
        <div className={styles.search}>
          <label htmlFor="location-search">Search London</label>
          <input
            id="location-search"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            placeholder="Camden, Greenwich…"
          />
          {query && (
            <div className={styles.suggestions}>
              {matches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelected(item);
                    setQuery("");
                  }}
                >
                  {item.name}
                  <span>
                    {item.coverage}% · {money(item.rewardMinor)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className={styles.mapSection}>
        <div className={styles.mapHeader}>
          <div>
            <strong>London coverage</strong>
            <span> · {coverageLocations.length} active requests</span>
          </div>
          <div>
            <button
              className={styles.requestTop}
              onClick={() => setSatellite((value) => !value)}
            >
              {satellite ? "Street map" : "Satellite"}
            </button>
            <button
              className={styles.requestTop}
              onClick={() => setRequestOpen(true)}
            >
              ＋ Request coverage
            </button>
          </div>
        </div>
        <CoverageMap
          locations={coverageLocations}
          selected={selected}
          satellite={satellite}
          onSelect={setSelected}
          onMapClick={(lng, lat) => {
            setSelected({
              id: `point-${Date.now()}`,
              name: "New London location",
              lng,
              lat,
              coverage: 0,
              freshness: "No evidence",
              rewardMinor: 800,
              note: "Start a request for this public location.",
            });
            setRequestOpen(true);
          }}
        />
        <div className={styles.legend}>
          <span>
            <i className={styles.high} />
            fresh
          </span>
          <span>
            <i className={styles.mid} />
            partial
          </span>
          <span>
            <i className={styles.low} />
            needs coverage
          </span>
          <span className={styles.hint}>
            Click the map to request a new point
          </span>
        </div>
      </section>
      {selected && (
        <aside className={styles.dossier}>
          <div className={styles.dossierTitle}>
            <div>
              <p className={styles.eyebrow}>Location dossier</p>
              <h2>{selected.name}</h2>
              <span className={styles.truth}>
                {selected.freshness} · privacy-safe evidence
              </span>
            </div>
            <button
              className={styles.close}
              onClick={() => setSelected(null)}
              aria-label="Close dossier"
            >
              ×
            </button>
          </div>
          <div className={styles.stats}>
            <div>
              <small>Coverage</small>
              <strong>{selected.coverage}%</strong>
            </div>
            <div>
              <small>Current bounty</small>
              <strong>{money(selected.rewardMinor)}</strong>
            </div>
            <div>
              <small>Evidence mode</small>
              <strong>Sampled</strong>
            </div>
          </div>
          <p className={styles.note}>{selected.note}</p>
          <div className={styles.actions}>
            <button
              onClick={() => postFund(selected.rewardMinor, "Demo funding")}
            >
              Fund this bounty
            </button>
            <button
              className={styles.secondary}
              onClick={() => setRequestOpen(true)}
            >
              Request fresh coverage
            </button>
            <Link href={`/operations?location=${selected.id}`}>
              View submissions →
            </Link>
          </div>
        </aside>
      )}
      {message && (
        <div className={styles.toast} role="status">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
      {requestOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <form
            className={styles.modal}
            onSubmit={(e) => {
              e.preventDefault();
              setRequestOpen(false);
              postFund(Math.round(Number(budget) * 100), "Coverage request");
            }}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setRequestOpen(false)}
            >
              ×
            </button>
            <p className={styles.eyebrow}>New buyer request</p>
            <h2>{selected?.name || "London location"}</h2>
            <label>
              What should a runner check?
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={3}
              />
            </label>
            <label>
              Runner bounty (£)
              <input
                type="number"
                min="1"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <label className={styles.check}>
              <input type="checkbox" required /> This is a public, safe demo
              location.
            </label>
            <button type="submit">Create coverage request →</button>
            <small>
              Only sampled, privacy-processed evidence is collected.
            </small>
          </form>
        </div>
      )}
      <footer className={styles.footer}>
        <span>EyeEarn · evidence with a boundary</span>
        <Link href="/explore">Need more eyes? Open runner map →</Link>
      </footer>
    </main>
  );
}
