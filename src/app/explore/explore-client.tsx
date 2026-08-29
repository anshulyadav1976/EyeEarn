"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { streetMapStyle } from "@/lib/map-styles";
import { buildItinerary } from "@/lib/itinerary";
import {
  fuseVoiceWithVisual,
  makeVoiceObservation,
  type VoiceObservation,
} from "@/lib/evidence-fusion";
import type { BountyZone } from "@/lib/eyeearn-data";
import styles from "./explore.module.css";

type SensorState = "idle" | "requesting" | "granted" | "unavailable" | "denied";
type PositionSnapshot = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
};
type Analysis = {
  id: string;
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  actionable: boolean;
  visibleObjects: string[];
  sceneConditions: string[];
  privacyRisk: boolean;
  facesDetected: boolean;
  platesDetected: boolean;
  privacyState: string;
  provider: string;
  metadata?: { position?: PositionSnapshot | null; capturedAt?: string };
};
type DeviceProfile = Record<string, string | number | boolean | null>;
function readDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  };
  const ua = nav.userAgent;
  return {
    deviceSessionId:
      localStorage.getItem("eyeearn:device-id") ?? crypto.randomUUID(),
    deviceType: /Mobi|Android/i.test(ua)
      ? "mobile"
      : /iPad|Tablet/i.test(ua)
        ? "tablet"
        : "desktop",
    platform: nav.platform || "unknown",
    userAgent: ua,
    language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${innerWidth}×${innerHeight}`,
    pixelRatio: devicePixelRatio,
    touchPoints: nav.maxTouchPoints,
    screenOrientation: screen.orientation?.type ?? "unknown",
    logicalProcessors: nav.hardwareConcurrency ?? null,
    deviceMemoryGb: nav.deviceMemory ?? null,
    networkType: nav.connection?.type ?? null,
    effectiveNetworkType: nav.connection?.effectiveType ?? null,
    downlinkMbps: nav.connection?.downlink ?? null,
    networkRttMs: nav.connection?.rtt ?? null,
    saveData: nav.connection?.saveData ?? false,
  };
}

export default function ExploreClient({
  zones,
  route,
}: {
  zones: BountyZone[];
  route: [number, number][];
}) {
  const [liveZones, setLiveZones] = useState(zones);
  const [selectedId, setSelectedId] = useState(
    zones.find((z) => z.safeForDemo)?.id ?? "",
  );
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState(2.5);
  const [earningsTarget, setEarningsTarget] = useState(0);
  const [runnerName, setRunnerName] = useState("Runner 01");
  const [runLive, setRunLive] = useState(false);
  const [, setRunId] = useState<string | null>(null);
  const [runEarned, setRunEarned] = useState(0);
  const [completedZones, setCompletedZones] = useState<string[]>([]);
  const [, setStatus] = useState("Choose a safe bounty zone");
  const [, setSensors] = useState<Record<string, SensorState>>({
    location: "idle",
    camera: "idle",
    microphone: "idle",
    motion: "idle",
  });
  const [, setPosition] = useState<PositionSnapshot | null>(null);
  const [, setAudioDb] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [, setVoices] = useState<VoiceObservation[]>([]);
  const [, setDevice] = useState<DeviceProfile | null>(null);
  const [, setMotion] = useState("waiting");
  const [restored, setRestored] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [coveredKm, setCoveredKm] = useState(0);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [runPaused, setRunPaused] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const mediaStreams = useRef<MediaStream[]>([]);
  const watchId = useRef<number | null>(null);
  const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisInFlight = useRef(false);
  const evidenceCount = useRef(0);
  const lastBrightness = useRef<number | null>(null);
  const latestPosition = useRef<PositionSnapshot | null>(null);
  const latestAudioDb = useRef<number | null>(null);
  const deviceRef = useRef<DeviceProfile | null>(null);
  const motionCleanup = useRef<(() => void) | null>(null);
  const runIdRef = useRef<string | null>(null);
  const pointBuffer = useRef<PositionSnapshot[]>([]);
  const pointFlushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const runStartedAt = useRef<number | null>(null);
  const lastRoutePoint = useRef<PositionSnapshot | null>(null);
  const runPausedRef = useRef(false);

  useEffect(() => {
    const refreshBounties = () =>
      fetch("/api/fund")
        .then((response) => response.json())
        .then((result) => {
          if (Array.isArray(result.zones)) {
            const clean = result.zones.filter(
              (zone: BountyZone) =>
                zone.rewardMinor > 0 &&
                zone.rewardMinor <= 20000 &&
                zone.name !== "New London location",
            );
            setLiveZones(clean);
          }
        })
        .catch(() => undefined);
    void refreshBounties();
    const timer = window.setInterval(refreshBounties, 4000);
    return () => window.clearInterval(timer);
  }, []);
  const selected =
    liveZones.find((zone) => zone.id === selectedId) ?? liveZones[0];
  const plannedRoute = useMemo<[number, number][]>(() => {
    if (!selected) return route;
    const [lng, lat] = selected.coordinates;
    const spread = Math.max(0.0025, Math.min(0.006, distance / 680));
    return [
      [lng - spread, lat],
      [lng - spread * 0.55, lat + spread * 0.72],
      [lng, lat + spread],
      [lng + spread * 0.65, lat + spread * 0.55],
      [lng + spread, lat],
      [lng + spread * 0.48, lat - spread * 0.72],
      [lng, lat - spread],
      [lng - spread * 0.62, lat - spread * 0.52],
      [lng - spread, lat],
    ];
  }, [selected, distance, route]);
  const itinerary = useMemo(
    () =>
      buildItinerary(
        liveZones,
        selectedId,
        duration,
        distance,
        earningsTarget * 100,
      ),
    [liveZones, selectedId, duration, distance, earningsTarget],
  );

  useEffect(() => {
    const saved = localStorage.getItem("eyeearn:itinerary:v1");
    if (saved)
      try {
        const data = JSON.parse(saved);
        queueMicrotask(() => {
          if (
            zones.some(
              (zone) => zone.id === data.selectedId && zone.safeForDemo,
            )
          )
            setSelectedId(data.selectedId);
          setDuration(Number(data.duration) || 30);
          setDistance(Number(data.distance) || 2.5);
          setEarningsTarget(Number(data.earningsTarget) || 0);
          setRunnerName(data.runnerName || "Runner 01");
          setRestored(true);
        });
      } catch {
        localStorage.removeItem("eyeearn:itinerary:v1");
        queueMicrotask(() => setRestored(true));
      }
    else queueMicrotask(() => setRestored(true));
    const savedVoices = localStorage.getItem("eyeearn:voice:v1");
    if (savedVoices)
      try {
        const parsed = JSON.parse(savedVoices);
        if (Array.isArray(parsed))
          queueMicrotask(() => setVoices(parsed.slice(0, 6)));
      } catch {
        localStorage.removeItem("eyeearn:voice:v1");
      }
  }, [zones]);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(
      "eyeearn:itinerary:v1",
      JSON.stringify({
        selectedId,
        duration,
        distance,
        earningsTarget,
        runnerName,
        itinerary,
      }),
    );
  }, [
    restored,
    selectedId,
    duration,
    distance,
    earningsTarget,
    runnerName,
    itinerary,
  ]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: streetMapStyle,
      center: [-0.1276, 51.5072],
      zoom: 10.6,
      attributionControl: false,
    });
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-left",
    );
    instance.addControl(new maplibregl.AttributionControl({ compact: true }));
    instance.on("load", () => {
      instance.addSource("safe-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
      instance.addLayer({
        id: "route-casing",
        type: "line",
        source: "safe-route",
        paint: {
          "line-color": "#0d0f10",
          "line-width": 10,
          "line-opacity": 0.78,
        },
      });
      instance.addLayer({
        id: "safe-route",
        type: "line",
        source: "safe-route",
        paint: {
          "line-color": "#ff1f6b",
          "line-width": 9,
          "line-opacity": 0.96,
        },
      });
      instance.addSource("live-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
      instance.addLayer({
        id: "live-route",
        type: "line",
        source: "live-route",
        paint: { "line-color": "#ffffff", "line-width": 5 },
      });
      setMapReady(true);
    });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    const source = instance.getSource("safe-route") as
      maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: plannedRoute },
    });
    instance.fitBounds(
      plannedRoute.reduce(
        (bounds, point) => bounds.extend(point),
        new maplibregl.LngLatBounds(plannedRoute[0], plannedRoute[0]),
      ),
      { padding: 84, maxZoom: 14.2, duration: 650 },
    );
  }, [mapReady, plannedRoute]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !instance.isStyleLoaded()) return;
    const data = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: routePoints },
    } as GeoJSON.Feature;
    const source = instance.getSource("live-route") as
      maplibregl.GeoJSONSource | undefined;
    source?.setData(data);
  }, [routePoints]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.current?.resize());
    return () => cancelAnimationFrame(frame);
  }, [runLive]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !liveZones.length) return;
    const markers: maplibregl.Marker[] = [];
    liveZones.forEach((zone) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = styles.mapMarker;
      el.textContent = zone.safeForDemo
        ? `£${(zone.rewardMinor / 100).toFixed(0)}`
        : "×";
      el.setAttribute(
        "aria-label",
        `${zone.name}, £${(zone.rewardMinor / 100).toFixed(2)}`,
      );
      el.disabled = !zone.safeForDemo;
      el.onclick = () => {
        setSelectedId(zone.id);
        instance.easeTo({
          center: zone.coordinates,
          zoom: 14.5,
          duration: 600,
        });
      };
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(zone.coordinates)
        .addTo(instance);
      markers.push(marker);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [liveZones, mapReady]);

  const cleanup = useCallback(() => {
    mediaStreams.current.forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    mediaStreams.current = [];
    if (watchId.current !== null)
      navigator.geolocation.clearWatch(watchId.current);
    if (frameTimer.current) clearInterval(frameTimer.current);
    if (pointFlushTimer.current) clearInterval(pointFlushTimer.current);
    motionCleanup.current?.();
    motionCleanup.current = null;
  }, []);

  const toggleMic = useCallback(() => {
    const nextMuted = !micMuted;
    mediaStreams.current.forEach((stream) =>
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      }),
    );
    setMicMuted(nextMuted);
  }, [micMuted]);

  const togglePause = useCallback(() => {
    const nextPaused = !runPausedRef.current;
    runPausedRef.current = nextPaused;
    mediaStreams.current.forEach((stream) =>
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !nextPaused;
      }),
    );
    setRunPaused(nextPaused);
  }, []);

  const flushPoints = useCallback(async () => {
    const id = runIdRef.current;
    if (!id || !pointBuffer.current.length) return;
    const points = pointBuffer.current.splice(0);
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "points", runId: id, points }),
    });
    if (!response.ok) pointBuffer.current.unshift(...points);
  }, []);

  const persistObservation = useCallback(
    async (observation: {
      id: string;
      category: string;
      description: string;
      modality: "vision" | "voice" | "fused";
      capturedAt: string;
      latitude?: number;
      longitude?: number;
      privacyState?: "safe" | "redacted" | "blocked";
    }) => {
      if (!runIdRef.current) return;
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "observation",
          runId: runIdRef.current,
          observation,
        }),
      });
      if (response.ok) evidenceCount.current += 1;
    },
    [],
  );
  useEffect(() => cleanup, [cleanup]);

  const captureFrame = useCallback(async () => {
    if (
      !video.current ||
      video.current.readyState < 2 ||
      analysisInFlight.current ||
      runPausedRef.current
    )
      return;
    const source = video.current;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 768 / source.videoWidth);
    canvas.width = Math.max(1, Math.round(source.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(source.videoHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(
      0,
      0,
      Math.min(canvas.width, 96),
      Math.min(canvas.height, 54),
    ).data;
    let luminance = 0;
    for (let index = 0; index < pixels.length; index += 16)
      luminance += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
    const brightness = luminance / Math.max(1, pixels.length / 16);
    if (
      brightness < 12 ||
      (lastBrightness.current !== null &&
        Math.abs(brightness - lastBrightness.current) < 1.2)
    )
      return;
    lastBrightness.current = brightness;
    analysisInFlight.current = true;
    try {
      const blobs: Blob[] = [];
      let facesRedacted = false;
      const FaceDetectorCtor = (
        globalThis as unknown as {
          FaceDetector?: new () => {
            detect(
              input: HTMLCanvasElement,
            ): Promise<{ boundingBox: DOMRectReadOnly }[]>;
          };
        }
      ).FaceDetector;
      for (let frameIndex = 0; frameIndex < 3; frameIndex += 1) {
        if (frameIndex)
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        let frameRedacted = false;
        if (FaceDetectorCtor) {
          const faces = await new FaceDetectorCtor().detect(canvas);
          for (const face of faces) {
            const b = face.boundingBox;
            context.save();
            context.filter = "blur(18px)";
            context.drawImage(
              canvas,
              b.x,
              b.y,
              b.width,
              b.height,
              b.x,
              b.y,
              b.width,
              b.height,
            );
            context.restore();
            frameRedacted = true;
          }
        }
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.7),
        );
        if (blob) blobs.push(blob);
        facesRedacted = facesRedacted || frameRedacted;
      }
      if (!blobs.length) return;
      const form = new FormData();
      blobs.forEach((blob, index) =>
        form.append("frames", blob, `frame-${Date.now()}-${index}.jpg`),
      );
      form.append(
        "metadata",
        JSON.stringify({
          position: latestPosition.current,
          audioDb: latestAudioDb.current,
          brightness: Number(brightness.toFixed(1)),
          facesRedacted,
          capturedAt: new Date().toISOString(),
          device: deviceRef.current,
        }),
      );
      const response = await fetch("/api/analyze-frame", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Frame analysis failed");
      setAnalyses((current) => [result, ...current].slice(0, 4));
      setFrameCount(
        (count) => count + Number(result.framesAnalyzed || blobs.length),
      );
      setStatus(`Observed: ${result.category}`);
      void persistObservation({
        id: result.id,
        category: result.category,
        description: result.description,
        modality: "vision",
        capturedAt: result.metadata?.capturedAt || new Date().toISOString(),
        latitude: result.metadata?.position?.latitude,
        longitude: result.metadata?.position?.longitude,
        privacyState:
          result.privacyState === "blocked"
            ? "blocked"
            : result.privacyState === "redacted"
              ? "redacted"
              : "safe",
      });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Frame analysis can be retried",
      );
    } finally {
      analysisInFlight.current = false;
    }
  }, [persistObservation]);

  const startRun = async () => {
    const startResponse = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "start",
        runnerName,
        zoneIds: selected ? [selected.id] : [],
      }),
    });
    const started = await startResponse.json();
    if (!startResponse.ok) {
      setStatus(started.error || "Could not start run");
      return;
    }
    runIdRef.current = started.run.id;
    evidenceCount.current = 0;
    setRunId(started.run.id);
    setRunEarned(0);
    setCompletedZones([]);
    runPausedRef.current = false;
    setRunPaused(false);
    setMicMuted(false);
    pointBuffer.current = [];
    cleanup();
    setStatus("Requesting camera, microphone and location…");
    setSensors({
      location: "requesting",
      camera: "requesting",
      microphone: "requesting",
      motion: "requesting",
    });
    const profile = readDeviceProfile();
    localStorage.setItem("eyeearn:device-id", String(profile.deviceSessionId));
    deviceRef.current = profile;
    setDevice(profile);
    let cameraStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;
    try {
      const combined = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: true,
      });
      mediaStreams.current.push(combined);
      cameraStream = new MediaStream(combined.getVideoTracks());
      audioStream = new MediaStream(combined.getAudioTracks());
      setSensors((current) => ({
        ...current,
        camera: combined.getVideoTracks().length ? "granted" : "unavailable",
        microphone: combined.getAudioTracks().length
          ? "granted"
          : "unavailable",
      }));
    } catch {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        mediaStreams.current.push(cameraStream);
        setSensors((current) => ({ ...current, camera: "granted" }));
      } catch {
        setSensors((current) => ({ ...current, camera: "denied" }));
      }
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreams.current.push(audioStream);
        setSensors((current) => ({ ...current, microphone: "granted" }));
      } catch {
        setSensors((current) => ({ ...current, microphone: "denied" }));
      }
    }
    if (cameraStream && video.current) {
      video.current.srcObject = cameraStream;
      await video.current.play();
    }
    if (audioStream?.getAudioTracks().length) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(audioStream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const meter = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(
          samples.reduce((sum, value) => sum + value * value, 0) /
            samples.length,
        );
        const db = Math.max(-96, 20 * Math.log10(Math.max(rms, 0.000016)));
        latestAudioDb.current = Number(db.toFixed(1));
        setAudioDb(latestAudioDb.current);
      }, 300);
      audioStream.getTracks()[0].addEventListener("ended", () => {
        clearInterval(meter);
        audioContext.close();
      });
    }
    if ("geolocation" in navigator)
      watchId.current = navigator.geolocation.watchPosition(
        (event) => {
          const c = event.coords;
          const next = {
            latitude: c.latitude,
            longitude: c.longitude,
            accuracy: c.accuracy,
            altitude: c.altitude,
            altitudeAccuracy: c.altitudeAccuracy,
            heading: c.heading,
            speed: c.speed,
            recordedAt: new Date(event.timestamp).toISOString(),
          };
          latestPosition.current = next;
          const previous = lastRoutePoint.current;
          if (previous) {
            const lat = ((next.latitude - previous.latitude) * Math.PI) / 180;
            const lon = ((next.longitude - previous.longitude) * Math.PI) / 180;
            const a =
              Math.sin(lat / 2) ** 2 +
              Math.cos((previous.latitude * Math.PI) / 180) *
                Math.cos((next.latitude * Math.PI) / 180) *
                Math.sin(lon / 2) ** 2;
            setCoveredKm(
              (value) =>
                value + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            );
          }
          lastRoutePoint.current = next;
          setRoutePoints((points) =>
            [
              ...points,
              [next.longitude, next.latitude] as [number, number],
            ].slice(-500),
          );
          pointBuffer.current.push(next);
          if (pointBuffer.current.length >= 5) void flushPoints();
          setPosition(next);
          setSensors((current) => ({ ...current, location: "granted" }));
        },
        () => setSensors((current) => ({ ...current, location: "denied" })),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      );
    else setSensors((current) => ({ ...current, location: "unavailable" }));
    const motionSupported =
      "DeviceMotionEvent" in window || "DeviceOrientationEvent" in window;
    if (motionSupported) {
      const Motion = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<PermissionState>;
      };
      const Orientation =
        window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<PermissionState>;
        };
      try {
        if (Motion.requestPermission) await Motion.requestPermission();
        if (Orientation.requestPermission)
          await Orientation.requestPermission();
      } catch {
        /* sensor permission remains optional */
      }
      const onMotion = (event: DeviceMotionEvent) => {
        const a = event.acceleration;
        const r = event.rotationRate;
        setMotion(
          `acc ${a?.x?.toFixed(1) ?? "—"}/${a?.y?.toFixed(1) ?? "—"}/${a?.z?.toFixed(1) ?? "—"} · rot ${r?.alpha?.toFixed(0) ?? "—"}/${r?.beta?.toFixed(0) ?? "—"}/${r?.gamma?.toFixed(0) ?? "—"}`,
        );
      };
      const onOrientation = (event: DeviceOrientationEvent) => {
        if (!event.absolute && event.alpha === null) return;
        setMotion(
          (current) =>
            `${current} · heading ${event.alpha?.toFixed(0) ?? "—"}°`,
        );
      };
      window.addEventListener("devicemotion", onMotion);
      window.addEventListener("deviceorientation", onOrientation);
      motionCleanup.current = () => {
        window.removeEventListener("devicemotion", onMotion);
        window.removeEventListener("deviceorientation", onOrientation);
      };
      setSensors((current) => ({ ...current, motion: "granted" }));
    } else setSensors((current) => ({ ...current, motion: "unavailable" }));
    setRunLive(true);
    runStartedAt.current = Date.now();
    lastRoutePoint.current = null;
    setElapsed(0);
    setCoveredKm(0);
    setRoutePoints([]);
    setStatus("Survey live — collecting only while this page remains open");
    pointFlushTimer.current = setInterval(() => void flushPoints(), 5000);
    localStorage.setItem(
      "eyeearn:run:v1",
      JSON.stringify({
        runId: started.run.id,
        runnerName,
        startedAt: new Date().toISOString(),
        itinerary,
        device: profile,
        privacy: "frames sampled; no continuous video/audio",
      }),
    );
    if (cameraStream) frameTimer.current = setInterval(captureFrame, 6000);
  };

  const completeSelected = async () => {
    if (!runIdRef.current || completedZones.includes(selected.id)) return;
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        runId: runIdRef.current,
        zoneId: selected.id,
        accepted: true,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error || "Could not complete zone");
      return;
    }
    setCompletedZones((current) => [...current, selected.id]);
    setRunEarned(result.run.earnedMinor);
    setStatus(
      `Accepted ${selected.name} · £${(result.run.earnedMinor / 100).toFixed(2)} earned`,
    );
  };

  const finishRun = async () => {
    await flushPoints();
    if (
      evidenceCount.current > 0 &&
      selected &&
      !completedZones.includes(selected.id)
    )
      await completeSelected();
    let earned = runEarned;
    if (runIdRef.current) {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          runId: runIdRef.current,
          handoff: true,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        earned = result.run.earnedMinor;
        setRunEarned(earned);
      }
    }
    cleanup();
    runStartedAt.current = null;
    runPausedRef.current = false;
    setRunPaused(false);
    setRunLive(false);
    setStatus(
      `Run handed off · £${(earned / 100).toFixed(2)} accepted earnings`,
    );
  };

  const saveVoice = useCallback(
    (text: string) => {
      const observation = makeVoiceObservation(
        text,
        runnerName,
        latestPosition.current,
      );
      if (!observation) return;
      const fused = fuseVoiceWithVisual(observation, analyses);
      setVoices((current) => {
        const next = [fused, ...current].slice(0, 6);
        localStorage.setItem("eyeearn:voice:v1", JSON.stringify(next));
        return next;
      });
      void persistObservation({
        id: fused.id,
        category:
          fused.modality === "fused" ? "fused observation" : "voice note",
        description: fused.text,
        modality: fused.modality,
        capturedAt: fused.capturedAt,
        latitude: fused.position?.latitude,
        longitude: fused.position?.longitude,
        privacyState: "safe",
      });
      setStatus(
        fused.modality === "fused"
          ? "Voice note fused with nearby frame"
          : "Voice note saved — voice-only evidence",
      );
    },
    [analyses, persistObservation, runnerName],
  );

  useEffect(() => {
    if (!runLive) return;
    const timer = window.setInterval(() => {
      if (runStartedAt.current)
        setElapsed(Math.floor((Date.now() - runStartedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [runLive]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="wordmark" href="/">
          EYE<span>EARN</span>
        </Link>
        <nav>
          <b>Explore & Earn</b>
          <Link href="/buyer">Buyer</Link>
          <Link href="/operations">Authority</Link>
        </nav>
        <span className={runLive ? styles.live : styles.ready}>
          {runLive ? "● SURVEY LIVE" : "PHASE 4"}
        </span>
      </header>
      <section
        className={`${styles.workspace} ${runLive ? styles.runningWorkspace : ""}`}
      >
        <div className={styles.mapPanel}>
          <div
            ref={mapContainer}
            className={styles.map}
            aria-label="Prepared safe route and bounty zones"
          />
          {selected && (
            <div className={styles.itineraryBadge}>
              <span>★ {plannedRoute.length} stops</span>
              <b>{itinerary.estimatedDistanceKm} km itinerary</b>
            </div>
          )}
          {!runLive && selected && (
            <div className={styles.runDock}>
              <div className={styles.bountyStrip}>
                <span>
                  {itinerary.estimatedDistanceKm} km ·{" "}
                  {itinerary.estimatedDurationMinutes} min
                </span>
                <b>£{(selected.rewardMinor / 100).toFixed(2)}</b>
              </div>
              <div className={styles.routeBrief}>
                <div>
                  <small>Your circuit</small>
                  <strong>{selected.name}</strong>
                  <p>
                    Follow the pink loop back to the start. Capture entrances,
                    crossing conditions, footfall and any access obstruction.
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Target pace</dt>
                    <dd>
                      {(
                        itinerary.estimatedDurationMinutes /
                        itinerary.estimatedDistanceKm
                      ).toFixed(1)}{" "}
                      min/km
                    </dd>
                  </div>
                  <div>
                    <dt>Est. finish</dt>
                    <dd>{itinerary.estimatedDurationMinutes} min</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>Video · GPS · audio</dd>
                  </div>
                </dl>
                <div className={styles.referenceClips}>
                  <span>Field-video examples</span>
                  <a
                    href="https://www.pexels.com/video/people-walking-in-the-street-of-london-3545482/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    London street walk ↗
                  </a>
                  <a
                    href="https://mixkit.co/free-stock-video/pedestrian/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pedestrian reference ↗
                  </a>
                </div>
              </div>
              <button
                className={styles.startDock}
                type="button"
                onClick={startRun}
              >
                Start running &amp; filming <span>→</span>
              </button>
            </div>
          )}
          {runLive && (
            <div className={styles.liveStats}>
              <span>
                <b>{coveredKm.toFixed(2)} km</b>
                <small>covered</small>
              </span>
              <span>
                <b>
                  {coveredKm && elapsed
                    ? `${(coveredKm / (elapsed / 3600)).toFixed(1)} km/h`
                    : "—"}
                </b>
                <small>pace</small>
              </span>
              <span>
                <b>
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </b>
                <small>elapsed</small>
              </span>
            </div>
          )}
        </div>
        <section className={styles.capture} aria-live="polite">
          <div className={styles.preview}>
            <video ref={video} muted playsInline />
            <button
              className={styles.micToggle}
              type="button"
              onClick={toggleMic}
              aria-label={
                micMuted ? "Turn microphone on" : "Turn microphone off"
              }
            >
              {micMuted ? "⌁" : "●"}
            </button>
            <span className={styles.recordingState}>
              {runPaused ? "FILMING PAUSED" : "● FILMING"}
            </span>
            {runPaused && <div className={styles.pauseVeil}>Paused</div>}
            <small>{frameCount} frames sampled privately</small>
          </div>
          <div className={styles.videoActions}>
            <button
              type="button"
              onClick={() =>
                saveVoice(`Manual observation at ${selected.name}`)
              }
            >
              ＋ Note
            </button>
            <button type="button" onClick={togglePause}>
              {runPaused ? "Resume" : "Pause"}
            </button>
            <button
              className={styles.finishDock}
              type="button"
              onClick={finishRun}
            >
              Finish &amp; submit
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
