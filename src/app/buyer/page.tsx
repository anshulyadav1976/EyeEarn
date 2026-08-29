"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { ChangeEvent } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { streetMapStyle } from "@/lib/map-styles";
import styles from "./buyer.module.css";
import BuyerToolsNav from "../buyer-tools-nav";
import PrimaryNav from "../primary-nav";
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
type RequestScope = "building" | "circle" | "rectangle";
type RequestGeometry =
  | { scope: "building"; lng: number; lat: number }
  | { scope: "circle"; lng: number; lat: number; radius: number }
  | {
      scope: "rectangle";
      west: number;
      south: number;
      east: number;
      north: number;
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
  {
    id: "london-wembley",
    name: "Wembley event approach",
    lng: -0.2795,
    lat: 51.556,
    coverage: 22,
    freshness: "Aging · 8d",
    rewardMinor: 980,
    note: "Crowd routing, barriers and step-free stadium approach.",
  },
  {
    id: "london-brixton",
    name: "Brixton market route",
    lng: -0.114,
    lat: 51.4627,
    coverage: 48,
    freshness: "Fresh · 3h",
    rewardMinor: 530,
    note: "Market access, crowd flow and ambient conditions.",
  },
  {
    id: "london-canary",
    name: "Canary Wharf dock edge",
    lng: -0.0198,
    lat: 51.5054,
    coverage: 76,
    freshness: "Fresh · 22m",
    rewardMinor: 640,
    note: "Dock crossing, lifts and temporary route closures.",
  },
  {
    id: "london-hackney",
    name: "Hackney Central corridor",
    lng: -0.0556,
    lat: 51.5471,
    coverage: 57,
    freshness: "Fresh · 1h",
    rewardMinor: 690,
    note: "Crossings, cycle-lane conflicts and station access.",
  },
  {
    id: "london-croydon",
    name: "Croydon tram interchange",
    lng: -0.0986,
    lat: 51.3752,
    coverage: 31,
    freshness: "Aging · 5d",
    rewardMinor: 710,
    note: "Tram crossing, lifts and pavement condition refresh.",
  },
  {
    id: "london-woolwich",
    name: "Woolwich Elizabeth line",
    lng: 0.0692,
    lat: 51.4915,
    coverage: 44,
    freshness: "Fresh · 4h",
    rewardMinor: 820,
    note: "Station approach, signage and construction edge.",
  },
  {
    id: "london-walthamstow",
    name: "Walthamstow market mile",
    lng: -0.0199,
    lat: 51.5832,
    coverage: 39,
    freshness: "Aging · 3d",
    rewardMinor: 570,
    note: "Market congestion, kerb access and obstructions.",
  },
  {
    id: "london-ealing",
    name: "Ealing Broadway interchange",
    lng: -0.3017,
    lat: 51.5142,
    coverage: 68,
    freshness: "Fresh · 50m",
    rewardMinor: 620,
    note: "Station access, bus interchange and temporary works.",
  },
];
const money = (minor: number) => `£${(minor / 100).toFixed(2)}`;
const bounds: [[number, number], [number, number]] = [
  [-0.52, 51.3],
  [0.32, 51.7],
];
function geometryCenter(selection: RequestGeometry) {
  if (selection.scope !== "rectangle") {
    return { lng: selection.lng, lat: selection.lat };
  }
  return {
    lng: (selection.west + selection.east) / 2,
    lat: (selection.south + selection.north) / 2,
  };
}
function geometryLabel(selection: RequestGeometry) {
  if (selection.scope === "building") return "Specific building · draggable pin";
  if (selection.scope === "circle") {
    return `Circle · ${Math.round(selection.radius)} m radius`;
  }
  const centre = geometryCenter(selection);
  const width =
    (selection.east - selection.west) *
    111320 *
    Math.cos((centre.lat * Math.PI) / 180);
  const height = (selection.north - selection.south) * 111320;
  return `Rectangle · ${Math.round(width)} × ${Math.round(height)} m`;
}
function CoverageMap({
  locations,
  satellite,
  onSelect,
  onMapClick,
  onSelectionChange,
  activeScope,
  requestSelection,
}: {
  locations: Coverage[];
  satellite: boolean;
  onSelect: (item: Coverage) => void;
  onMapClick: (lng: number, lat: number) => void;
  onSelectionChange: (selection: RequestGeometry) => void;
  activeScope: RequestScope | null;
  requestSelection: RequestGeometry | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const selectionMarker = useRef<maplibregl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const satelliteRef = useRef(satellite);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  useEffect(() => {
    satelliteRef.current = satellite;
  }, [satellite]);
  useEffect(() => {
    if (!host.current || map.current) return;
    const instance = new maplibregl.Map({
      container: host.current,
      style: streetMapStyle,
      center: [-0.11, 51.51],
      zoom: 9.7,
      maxBounds: bounds,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const canvas = instance.getCanvas();
    requestAnimationFrame(() => instance.resize());
    canvas.style.cursor = activeScope ? "crosshair" : "";
    let start: { lng: number; lat: number } | null = null;

    const metresBetween = (
      first: { lng: number; lat: number },
      second: { lng: number; lat: number },
    ) =>
      Math.hypot(
        (second.lng - first.lng) *
          111320 *
          Math.cos((first.lat * Math.PI) / 180),
        (second.lat - first.lat) * 111320,
      );
    const click = (event: maplibregl.MapMouseEvent) => {
      if (activeScope === "building") {
        onMapClickRef.current(event.lngLat.lng, event.lngLat.lat);
      }
    };
    const move = (event: maplibregl.MapMouseEvent) => {
      if (!start || !activeScope || activeScope === "building") return;
      if (activeScope === "circle") {
        onSelectionChangeRef.current({
          scope: "circle",
          lng: start.lng,
          lat: start.lat,
          radius: Math.max(20, metresBetween(start, event.lngLat)),
        });
      } else {
        onSelectionChangeRef.current({
          scope: "rectangle",
          west: Math.min(start.lng, event.lngLat.lng),
          south: Math.min(start.lat, event.lngLat.lat),
          east: Math.max(start.lng, event.lngLat.lng),
          north: Math.max(start.lat, event.lngLat.lat),
        });
      }
    };
    const down = (event: maplibregl.MapMouseEvent) => {
      if (!activeScope || activeScope === "building") return;
      event.preventDefault();
      start = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      instance.dragPan.disable();
      move(event);
    };
    const up = (event: maplibregl.MapMouseEvent) => {
      if (!start) return;
      move(event);
      start = null;
      instance.dragPan.enable();
    };
    instance.on("click", click);
    instance.on("mousedown", down);
    instance.on("mousemove", move);
    instance.on("mouseup", up);
    return () => {
      canvas.style.cursor = "";
      instance.off("click", click);
      instance.off("mousedown", down);
      instance.off("mousemove", move);
      instance.off("mouseup", up);
      instance.dragPan.enable();
    };
  }, [activeScope]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const syncSatellite = () => {
      if (!instance.isStyleLoaded()) return;
      if (satelliteRef.current && !instance.getSource("satellite")) {
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
      } else if (!satelliteRef.current && instance.getLayer("satellite")) {
        instance.removeLayer("satellite");
        instance.removeSource("satellite");
      }
    };
    syncSatellite();
    instance.on("load", syncSatellite);
    return () => {
      instance.off("load", syncSatellite);
    };
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
        map.current?.flyTo({
          center: [item.lng, item.lat],
          zoom: 12,
          duration: 500,
        });
      };
      return new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .addTo(map.current!);
    });
  }, [locations, onSelect]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const syncSelection = () => {
      if (!instance.isStyleLoaded()) return;
      const feature = requestSelection
        ? requestSelection.scope === "building"
          ? {
              type: "Feature" as const,
              properties: {},
              geometry: {
                type: "Point" as const,
                coordinates: [requestSelection.lng, requestSelection.lat],
              },
            }
          : (() => {
              const radius =
                requestSelection.scope === "circle"
                  ? Math.max(20, requestSelection.radius) / 111320
                  : 0;
              const points =
                requestSelection.scope === "circle"
                  ? Array.from({ length: 41 }, (_, index) => {
                      const angle = (index / 40) * Math.PI * 2;
                      return [
                        requestSelection.lng +
                          (Math.cos(angle) * radius) /
                            Math.cos((requestSelection.lat * Math.PI) / 180),
                        requestSelection.lat + Math.sin(angle) * radius,
                      ];
                    })
                  : [
                      [
                        requestSelection.west,
                        requestSelection.south,
                      ],
                      [
                        requestSelection.east,
                        requestSelection.south,
                      ],
                      [
                        requestSelection.east,
                        requestSelection.north,
                      ],
                      [
                        requestSelection.west,
                        requestSelection.north,
                      ],
                      [
                        requestSelection.west,
                        requestSelection.south,
                      ],
                    ];
              return {
                type: "Feature" as const,
                properties: {},
                geometry: { type: "Polygon" as const, coordinates: [points] },
              };
            })()
        : null;
      const data = {
        type: "FeatureCollection" as const,
        features: feature ? [feature] : [],
      };
      const source = instance.getSource("request-selection") as
        maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(data);
      else {
        instance.addSource("request-selection", { type: "geojson", data });
        instance.addLayer({
          id: "request-area",
          type: "fill",
          source: "request-selection",
          paint: { "fill-color": "#ff1f6b", "fill-opacity": 0.32 },
        });
        instance.addLayer({
          id: "request-outline",
          type: "line",
          source: "request-selection",
          paint: { "line-color": "#ff1f6b", "line-width": 5 },
        });
        instance.addLayer({
          id: "request-point",
          type: "circle",
          source: "request-selection",
          paint: {
            "circle-color": "#ff1f6b",
            "circle-radius": 10,
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 3,
          },
        });
      }
    };
    syncSelection();
    instance.on("load", syncSelection);
    return () => {
      instance.off("load", syncSelection);
    };
  }, [requestSelection]);
  useEffect(() => {
    selectionMarker.current?.remove();
    selectionMarker.current = null;
    const instance = map.current;
    if (!instance || !requestSelection) return;
    const centre = geometryCenter(requestSelection);
    const element = document.createElement("div");
    const building = requestSelection.scope === "building";
    element.className = building ? styles.selectionPin : styles.shapeOverlay;
    element.title = building
      ? "Drag to refine the building location"
      : "Selected coverage footprint";
    if (!building) element.innerHTML = "<span>AREA</span>";
    const marker = new maplibregl.Marker({ element, draggable: building })
      .setLngLat([centre.lng, centre.lat])
      .addTo(instance);
    let updateOverlay: (() => void) | null = null;
    if (building) {
      marker.on("dragend", () => {
        const point = marker.getLngLat();
        onSelectionChangeRef.current({
          scope: "building",
          lng: point.lng,
          lat: point.lat,
        });
      });
    } else {
      updateOverlay = () => {
        const centerPoint = instance.project([centre.lng, centre.lat]);
        if (requestSelection.scope === "circle") {
          const edgeLng =
            requestSelection.lng +
            requestSelection.radius /
              (111320 * Math.cos((requestSelection.lat * Math.PI) / 180));
          const edgePoint = instance.project([edgeLng, requestSelection.lat]);
          const diameter = Math.max(20, Math.abs(edgePoint.x - centerPoint.x) * 2);
          element.style.width = `${diameter}px`;
          element.style.height = `${diameter}px`;
          element.style.borderRadius = "50%";
        } else {
          const northWest = instance.project([
            requestSelection.west,
            requestSelection.north,
          ]);
          const southEast = instance.project([
            requestSelection.east,
            requestSelection.south,
          ]);
          element.style.width = `${Math.max(20, Math.abs(southEast.x - northWest.x))}px`;
          element.style.height = `${Math.max(20, Math.abs(southEast.y - northWest.y))}px`;
        }
      };
      updateOverlay();
      instance.on("zoom", updateOverlay);
      instance.on("resize", updateOverlay);
    }
    selectionMarker.current = marker;
    return () => {
      if (updateOverlay) {
        instance.off("zoom", updateOverlay);
        instance.off("resize", updateOverlay);
      }
      marker.remove();
    };
  }, [requestSelection]);
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
  const [requestMode, setRequestMode] = useState(false);
  const [requestDraft, setRequestDraft] = useState<Coverage | null>(null);
  const [requestScope, setRequestScope] = useState<RequestScope>("building");
  const [requestGeometry, setRequestGeometry] =
    useState<RequestGeometry | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customOrganisation, setCustomOrganisation] = useState("");
  const [customBrief, setCustomBrief] = useState("");
  const [locationName, setLocationName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Demo card · •••• 4242");
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
  function updateRequestSelection(selection: RequestGeometry) {
    const point = geometryCenter(selection);
    const draft = {
      id: "draft-coverage-request",
      name:
        selection.scope === "building"
          ? "Selected building"
          : "Selected coverage area",
      lng: point.lng,
      lat: point.lat,
      coverage: 0,
      freshness: "No evidence",
      rewardMinor: 800,
      note: "Start a request for this public location.",
    };
    setRequestGeometry(selection);
    setRequestDraft(draft);
  }
  async function postFund(amount: number, verb: string, target = selected) {
    if (!target) return;
    setMessage("Sending coverage request…");
    try {
      const r = await fetch("/api/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId: target.id,
          amountMinor: amount,
          currency: "GBP",
          requirement,
          safeForDemo: true,
          name: target.name,
          coordinates: [target.lng, target.lat],
        }),
      });
      if (!r.ok) throw Error();
      setCoverageLocations((current) => {
        const exists = current.some((item) => item.id === target.id);
        const updated = {
          ...target,
          rewardMinor: amount,
          freshness: "Request just created",
          note: requirement,
        };
        return exists
          ? current.map((item) => (item.id === target.id ? updated : item))
          : [updated, ...current];
      });
      setSelected((current) =>
        current?.id === target.id
          ? {
              ...current,
              rewardMinor: amount,
              freshness: "Request just created",
              note: requirement,
            }
          : current,
      );
      setMessage(`${target.name} is funded · runners can now collect it`);
    } catch {
      setMessage(
        `${verb} recorded for the demo · ${target.name} · ${money(amount)} bounty`,
      );
    }
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <PrimaryNav active="buyer" />
        <span className={styles.status}>● BUYER CONSOLE</span>
      </header>
      <BuyerToolsNav active="coverage" />
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
          <div className={styles.mapActions}>
            <button
              className={styles.requestTop}
              onClick={() => setSatellite((value) => !value)}
            >
              {satellite ? "Street map" : "Satellite"}
            </button>
            <button
              className={`${styles.requestTop} ${requestMode ? styles.activeRequest : ""}`}
              onClick={() => {
                setRequestMode(true);
                setRequestDraft(null);
                setRequestGeometry(null);
                setMessage(
                  "Choose a footprint, place it precisely, then confirm",
                );
              }}
            >
              ＋ Request coverage
            </button>
          </div>
        </div>
        {requestMode && (
          <div className={styles.requestBuilder}>
            <div className={styles.requestBuilderHead}>
              <div>
                <small>New coverage request</small>
                <strong>Choose, draw and confirm the exact footprint</strong>
              </div>
              <button
                type="button"
                className={styles.cancelRequest}
                onClick={() => {
                  setRequestMode(false);
                  setRequestDraft(null);
                  setRequestGeometry(null);
                }}
              >
                Cancel
              </button>
            </div>
            <div className={styles.scopePicker}>
              {(
                [
                  ["building", "Specific building"],
                  ["circle", "Circle area"],
                  ["rectangle", "Rectangle area"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={requestScope === value ? styles.activeScope : ""}
                  onClick={() => {
                    setRequestScope(value);
                    setRequestDraft(null);
                    setRequestGeometry(null);
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={styles.customScope}
                onClick={() => setCustomOpen(true)}
              >
                Request custom coverage ↗
              </button>
            </div>
            <p className={styles.drawInstruction}>
              {requestScope === "building"
                ? "Click to place the pin, then drag it for precision."
                : `Click and drag to draw a ${requestScope}. Draw again to correct it.`}
            </p>
            <div className={styles.selectionReview}>
              <div>
                <small>
                  {requestGeometry ? "Footprint ready" : "Map selection"}
                </small>
                <strong>
                  {requestGeometry
                    ? geometryLabel(requestGeometry)
                    : "Place or draw a footprint on the map below"}
                </strong>
                {requestDraft && (
                  <span>
                    {requestDraft.lat.toFixed(5)}, {requestDraft.lng.toFixed(5)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.clearSelection}
                disabled={!requestGeometry}
                onClick={() => {
                  setRequestDraft(null);
                  setRequestGeometry(null);
                }}
              >
                Clear &amp; redraw
              </button>
              <button
                type="button"
                className={styles.confirmSelection}
                disabled={!requestDraft}
                onClick={() => {
                  if (!requestDraft) return;
                  setLocationName(requestDraft.name);
                  setRequestOpen(true);
                }}
              >
                Use this footprint →
              </button>
            </div>
          </div>
        )}
        <CoverageMap
          locations={coverageLocations}
          satellite={satellite}
          onSelect={setSelected}
          activeScope={requestMode ? requestScope : null}
          requestSelection={requestGeometry}
          onSelectionChange={updateRequestSelection}
          onMapClick={(lng, lat) => {
            if (!requestMode || requestScope !== "building") return;
            updateRequestSelection({ scope: "building", lng, lat });
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
            {requestMode
              ? "Selection mode · confirm above before payment"
              : "Select Request coverage to place a footprint"}
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
              onClick={() => {
                setRequestDraft(selected);
                setRequestGeometry({
                  scope: "building",
                  lng: selected.lng,
                  lat: selected.lat,
                });
                setLocationName(selected.name);
                setRequestScope("building");
                setRequestMode(true);
                setMessage("Review or drag the pin, then confirm the footprint");
              }}
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
              if (!requestDraft) return;
              const target = {
                ...requestDraft,
                name: locationName.trim() || requestDraft.name,
                note: `${requirement} · ${requestScope} coverage`,
              };
              setSelected(target);
              setRequestOpen(false);
              setRequestMode(false);
              setRequestDraft(null);
              setRequestGeometry(null);
              postFund(
                Math.round(Number(budget) * 100),
                `${paymentMethod} payment`,
                target,
              );
            }}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setRequestOpen(false)}
              aria-label="Close request form"
            >
              ×
            </button>
            <p className={styles.eyebrow}>New buyer request</p>
            <h2>Fund fresh coverage.</h2>
            <div className={styles.formStep}>
              <div>
                <small>Confirmed footprint</small>
                <strong>
                  {requestGeometry
                    ? geometryLabel(requestGeometry)
                    : "Map selection"}
                </strong>
                <span>
                  {requestDraft?.lat.toFixed(5)}, {requestDraft?.lng.toFixed(5)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
              >
                Edit on map
              </button>
            </div>
            <label>
              Location name
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Stratford station west entrance"
              />
            </label>
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
            <label>
              Pay with
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Demo card · •••• 4242</option>
                <option>Buyer credits · £54.00</option>
              </select>
            </label>
            <label className={styles.check}>
              <input type="checkbox" required /> This is a public, safe demo
              location.
            </label>
            <button type="submit">
              Pay £{Number(budget || 0).toFixed(2)} &amp; publish bounty →
            </button>
            <small>
              Only sampled, privacy-processed evidence is collected.
            </small>
          </form>
        </div>
      )}
      {customOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <form
            className={styles.modal}
            onSubmit={(event) => {
              event.preventDefault();
              const subject = encodeURIComponent(
                `EyeEarn custom coverage · ${customOrganisation}`,
              );
              const body = encodeURIComponent(
                `Organisation: ${customOrganisation}\n\nCoverage request:\n${customBrief}\n\nPlease contact me to scope this request.`,
              );
              window.location.href = `mailto:sales@eyeearn.com?subject=${subject}&body=${body}`;
            }}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setCustomOpen(false)}
              aria-label="Close custom coverage form"
            >
              ×
            </button>
            <p className={styles.eyebrow}>Custom coverage</p>
            <h2>Contact sales.</h2>
            <p className={styles.modalCopy}>
              For corridors, recurring surveys, multi-site programmes or a
              footprint that cannot be drawn here, send the EyeEarn coverage
              team a scoped brief.
            </p>
            <label>
              Organisation
              <input
                type="text"
                required
                value={customOrganisation}
                onChange={(event) =>
                  setCustomOrganisation(event.target.value)
                }
                placeholder="e.g. London Borough of Newham"
              />
            </label>
            <label>
              Coverage brief
              <textarea
                required
                rows={5}
                value={customBrief}
                onChange={(event) => setCustomBrief(event.target.value)}
                placeholder="Locations, evidence needed, frequency and target dates"
              />
            </label>
            <button type="submit">Contact sales@eyeearn.com →</button>
            <small>Your email app will open with this brief prefilled.</small>
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
