"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildItinerary } from "@/lib/itinerary";
import type { BountyZone } from "@/lib/eyeearn-data";
import styles from "./explore.module.css";
import overlay from "./map-overlay.module.css";

type SensorState = "idle" | "requesting" | "granted" | "unavailable" | "denied";
type PositionSnapshot = { latitude: number; longitude: number; accuracy: number; altitude: number | null; altitudeAccuracy: number | null; heading: number | null; speed: number | null; recordedAt: string };
type Analysis = { id: string; category: string; description: string; severity: "low" | "medium" | "high"; confidence: number; actionable: boolean; visibleObjects: string[]; sceneConditions: string[]; privacyRisk: boolean; facesDetected: boolean; platesDetected: boolean; privacyState: string; provider: string };
type DeviceProfile = Record<string, string | number | boolean | null>;

const reasonCopy: Record<BountyZone["reason"], string> = {
  unexplored: "No useful evidence exists yet",
  stale: "Existing evidence is outside the freshness window",
  "buyer-requested": "A buyer has funded fresh coverage",
  "missing-modality": "This area is missing a sound or visual sample",
};

function readDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } };
  const ua = nav.userAgent;
  return {
    deviceSessionId: localStorage.getItem("eyeearn:device-id") ?? crypto.randomUUID(),
    deviceType: /Mobi|Android/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop",
    platform: nav.platform || "unknown", userAgent: ua, language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, viewport: `${innerWidth}×${innerHeight}`,
    pixelRatio: devicePixelRatio, touchPoints: nav.maxTouchPoints, screenOrientation: screen.orientation?.type ?? "unknown", logicalProcessors: nav.hardwareConcurrency ?? null,
    deviceMemoryGb: nav.deviceMemory ?? null, networkType: nav.connection?.type ?? null,
    effectiveNetworkType: nav.connection?.effectiveType ?? null, downlinkMbps: nav.connection?.downlink ?? null,
    networkRttMs: nav.connection?.rtt ?? null, saveData: nav.connection?.saveData ?? false,
  };
}

export default function ExploreClient({ zones, route }: { zones: BountyZone[]; route: [number, number][] }) {
  const [selectedId, setSelectedId] = useState(zones.find(z => z.safeForDemo)?.id ?? "");
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState(2.5);
  const [earningsTarget, setEarningsTarget] = useState(0);
  const [runnerName, setRunnerName] = useState("Runner 01");
  const [runLive, setRunLive] = useState(false);
  const [status, setStatus] = useState("Choose a safe bounty zone");
  const [sensors, setSensors] = useState<Record<string, SensorState>>({ location: "idle", camera: "idle", microphone: "idle", motion: "idle" });
  const [position, setPosition] = useState<PositionSnapshot | null>(null);
  const [audioDb, setAudioDb] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [motion, setMotion] = useState("waiting");
  const [restored, setRestored] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const mediaStreams = useRef<MediaStream[]>([]);
  const watchId = useRef<number | null>(null);
  const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisInFlight = useRef(false);
  const lastBrightness = useRef<number | null>(null);
  const latestPosition = useRef<PositionSnapshot | null>(null);
  const latestAudioDb = useRef<number | null>(null);
  const deviceRef = useRef<DeviceProfile | null>(null);
  const motionCleanup = useRef<(() => void) | null>(null);

  const selected = zones.find(zone => zone.id === selectedId) ?? zones[0];
  const itinerary = useMemo(() => buildItinerary(zones, selectedId, duration, distance, earningsTarget * 100), [zones, selectedId, duration, distance, earningsTarget]);

  useEffect(() => {
    const saved = localStorage.getItem("eyeearn:itinerary:v1");
    if (saved) try {
      const data = JSON.parse(saved);
      queueMicrotask(() => {
        if (zones.some(zone => zone.id === data.selectedId && zone.safeForDemo)) setSelectedId(data.selectedId);
        setDuration(Number(data.duration) || 30); setDistance(Number(data.distance) || 2.5); setEarningsTarget(Number(data.earningsTarget) || 0); setRunnerName(data.runnerName || "Runner 01");
        setRestored(true);
      });
    } catch { localStorage.removeItem("eyeearn:itinerary:v1"); queueMicrotask(() => setRestored(true)); }
    else queueMicrotask(() => setRestored(true));
  }, [zones]);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem("eyeearn:itinerary:v1", JSON.stringify({ selectedId, duration, distance, earningsTarget, runnerName, itinerary }));
  }, [restored, selectedId, duration, distance, earningsTarget, runnerName, itinerary]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const instance = new maplibregl.Map({ container: mapContainer.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [-0.0171, 51.5403], zoom: 14.8, attributionControl: false });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    instance.addControl(new maplibregl.AttributionControl({ compact: true }));
    instance.on("load", () => {
      instance.addSource("safe-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } } });
      instance.addLayer({ id: "route-casing", type: "line", source: "safe-route", paint: { "line-color": "#0d0f10", "line-width": 10, "line-opacity": .78 } });
      instance.addLayer({ id: "safe-route", type: "line", source: "safe-route", paint: { "line-color": "#ff4d2e", "line-width": 5 } });
    });
    map.current = instance;
    return () => { instance.remove(); map.current = null; };
  }, [route, zones]);

  useEffect(() => { if (selected && map.current) map.current.easeTo({ center: selected.coordinates, zoom: 15.3, duration: 700 }); }, [selected]);

  const cleanup = useCallback(() => {
    mediaStreams.current.forEach(stream => stream.getTracks().forEach(track => track.stop())); mediaStreams.current = [];
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (frameTimer.current) clearInterval(frameTimer.current);
    motionCleanup.current?.(); motionCleanup.current = null;
  }, []);
  useEffect(() => cleanup, [cleanup]);

  const captureFrame = useCallback(async () => {
    if (!video.current || video.current.readyState < 2 || analysisInFlight.current) return;
    const source = video.current; const canvas = document.createElement("canvas"); const scale = Math.min(1, 768 / source.videoWidth);
    canvas.width = Math.max(1, Math.round(source.videoWidth * scale)); canvas.height = Math.max(1, Math.round(source.videoHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) return;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, Math.min(canvas.width, 96), Math.min(canvas.height, 54)).data;
    let luminance = 0; for (let index = 0; index < pixels.length; index += 16) luminance += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
    const brightness = luminance / Math.max(1, pixels.length / 16);
    if (brightness < 12 || (lastBrightness.current !== null && Math.abs(brightness - lastBrightness.current) < 1.2)) return;
    lastBrightness.current = brightness; analysisInFlight.current = true;
    try {
      let facesRedacted = false;
      const FaceDetectorCtor = (globalThis as unknown as { FaceDetector?: new () => { detect(input: HTMLCanvasElement): Promise<{ boundingBox: DOMRectReadOnly }[]> } }).FaceDetector;
      if (FaceDetectorCtor) {
        const faces = await new FaceDetectorCtor().detect(canvas);
        for (const face of faces) { const b = face.boundingBox; context.save(); context.filter = "blur(18px)"; context.drawImage(canvas, b.x, b.y, b.width, b.height, b.x, b.y, b.width, b.height); context.restore(); facesRedacted = true; }
      }
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .7)); if (!blob) return;
      const form = new FormData(); form.append("frame", blob, `frame-${Date.now()}.jpg`); form.append("metadata", JSON.stringify({ position: latestPosition.current, audioDb: latestAudioDb.current, brightness: Number(brightness.toFixed(1)), facesRedacted, capturedAt: new Date().toISOString(), device: deviceRef.current }));
      const response = await fetch("/api/analyze-frame", { method: "POST", body: form }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Frame analysis failed");
      setAnalyses(current => [result, ...current].slice(0, 4)); setFrameCount(count => count + 1); setStatus(`Observed: ${result.category}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Frame analysis can be retried"); }
    finally { analysisInFlight.current = false; }
  }, []);

  const startRun = async () => {
    cleanup(); setStatus("Requesting camera, microphone and location…"); setSensors({ location: "requesting", camera: "requesting", microphone: "requesting", motion: "requesting" });
    const profile = readDeviceProfile(); localStorage.setItem("eyeearn:device-id", String(profile.deviceSessionId)); deviceRef.current = profile; setDevice(profile);
    let cameraStream: MediaStream | null = null; let audioStream: MediaStream | null = null;
    try {
      const combined = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: true }); mediaStreams.current.push(combined); cameraStream = new MediaStream(combined.getVideoTracks()); audioStream = new MediaStream(combined.getAudioTracks());
      setSensors(current => ({ ...current, camera: combined.getVideoTracks().length ? "granted" : "unavailable", microphone: combined.getAudioTracks().length ? "granted" : "unavailable" }));
    } catch {
      try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } }); mediaStreams.current.push(cameraStream); setSensors(current => ({ ...current, camera: "granted" })); } catch { setSensors(current => ({ ...current, camera: "denied" })); }
      try { audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaStreams.current.push(audioStream); setSensors(current => ({ ...current, microphone: "granted" })); } catch { setSensors(current => ({ ...current, microphone: "denied" })); }
    }
    if (cameraStream && video.current) { video.current.srcObject = cameraStream; await video.current.play(); }
    if (audioStream?.getAudioTracks().length) {
      const audioContext = new AudioContext(); const analyser = audioContext.createAnalyser(); analyser.fftSize = 512; audioContext.createMediaStreamSource(audioStream).connect(analyser); const samples = new Float32Array(analyser.fftSize);
      const meter = setInterval(() => { analyser.getFloatTimeDomainData(samples); const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length); const db = Math.max(-96, 20 * Math.log10(Math.max(rms, .000016))); latestAudioDb.current = Number(db.toFixed(1)); setAudioDb(latestAudioDb.current); }, 300);
      audioStream.getTracks()[0].addEventListener("ended", () => { clearInterval(meter); audioContext.close(); });
    }
    if ("geolocation" in navigator) watchId.current = navigator.geolocation.watchPosition(event => {
      const c = event.coords; const next = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy, altitude: c.altitude, altitudeAccuracy: c.altitudeAccuracy, heading: c.heading, speed: c.speed, recordedAt: new Date(event.timestamp).toISOString() }; latestPosition.current = next; setPosition(next); setSensors(current => ({ ...current, location: "granted" }));
    }, () => setSensors(current => ({ ...current, location: "denied" })), { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }); else setSensors(current => ({ ...current, location: "unavailable" }));
    const motionSupported = "DeviceMotionEvent" in window || "DeviceOrientationEvent" in window;
    if (motionSupported) {
      const Motion = window.DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<PermissionState> };
      const Orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<PermissionState> };
      try { if (Motion.requestPermission) await Motion.requestPermission(); if (Orientation.requestPermission) await Orientation.requestPermission(); } catch { /* sensor permission remains optional */ }
      const onMotion = (event: DeviceMotionEvent) => { const a = event.acceleration; const r = event.rotationRate; setMotion(`acc ${a?.x?.toFixed(1) ?? "—"}/${a?.y?.toFixed(1) ?? "—"}/${a?.z?.toFixed(1) ?? "—"} · rot ${r?.alpha?.toFixed(0) ?? "—"}/${r?.beta?.toFixed(0) ?? "—"}/${r?.gamma?.toFixed(0) ?? "—"}`); };
      const onOrientation = (event: DeviceOrientationEvent) => { if (!event.absolute && event.alpha === null) return; setMotion(current => `${current} · heading ${event.alpha?.toFixed(0) ?? "—"}°`); };
      window.addEventListener("devicemotion", onMotion); window.addEventListener("deviceorientation", onOrientation);
      motionCleanup.current = () => { window.removeEventListener("devicemotion", onMotion); window.removeEventListener("deviceorientation", onOrientation); };
      setSensors(current => ({ ...current, motion: "granted" }));
    } else setSensors(current => ({ ...current, motion: "unavailable" }));
    setRunLive(true); setStatus("Survey live — collecting only while this page remains open");
    localStorage.setItem("eyeearn:run:v1", JSON.stringify({ runId: crypto.randomUUID(), runnerName, startedAt: new Date().toISOString(), itinerary, device: profile, privacy: "frames sampled; no continuous video/audio" }));
    if (cameraStream) frameTimer.current = setInterval(captureFrame, 3000);
  };

  const finishRun = () => { cleanup(); setRunLive(false); setStatus("Run paused locally — itinerary and structured results retained"); };

  return <main className={styles.page}>
    <header className={styles.header}><Link className="wordmark" href="/">EYE<span>EARN</span></Link><nav><b>Explore & Earn</b><Link href="/buyer">Buyer</Link><Link href="/operations">Authority</Link></nav><span className={runLive ? styles.live : styles.ready}>{runLive ? "● SURVEY LIVE" : "PHASE 1"}</span></header>
    <section className={styles.workspace}>
      <div className={styles.mapPanel}><div ref={mapContainer} className={styles.map} aria-label="Prepared safe route and bounty zones" /><div className={overlay.mapOverlay} aria-label="Route overlay fallback"><span className={overlay.stadiumLabel}>London Stadium</span><span className={overlay.riverLabel}>River Lea</span><svg viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><path className={overlay.routeCase} d="M135 560 C250 660 680 650 820 490 C920 375 835 145 625 120 C390 92 180 230 150 410 C140 470 145 520 135 560"/><path className={overlay.route} d="M135 560 C250 660 680 650 820 490 C920 375 835 145 625 120 C390 92 180 230 150 410 C140 470 145 520 135 560"/></svg>{zones.map((zone,index) => <button key={zone.id} title={zone.name} aria-label={`${zone.name} ${zone.safeForDemo ? `£${(zone.rewardMinor/100).toFixed(2)}` : "restricted"}`} disabled={!zone.safeForDemo} onClick={() => setSelectedId(zone.id)} className={`${styles.marker} ${overlay.marker} ${styles[zone.band]} ${!zone.safeForDemo ? styles.restricted : ""} ${zone.id === selectedId ? overlay.active : ""}`} style={{left:`${[25,74,60,18][index]}%`,top:`${[72,55,18,35][index]}%`}}>{zone.safeForDemo ? `£${(zone.rewardMinor/100).toFixed(0)}` : "×"}</button>)}</div><div className={styles.mapLegend}><b>Bounty value</b><span><i className={styles.standard}/>£3–5</span><span><i className={styles.priority}/>£6–8</span><span><i className={styles.urgent}/>£9+</span><span><i className={styles.restricted}/>Restricted</span></div><div className={styles.routeTag}>Prepared safe route · 2.5 km</div></div>
      <aside className={styles.planner}>
        <p className={styles.kicker}>Earn Map · safe demo route</p><h1>Choose value,<br/>then move.</h1>
        <div className={styles.zoneList}>{zones.map(zone => <button key={zone.id} disabled={!zone.safeForDemo} className={zone.id === selectedId ? styles.selectedZone : ""} onClick={() => setSelectedId(zone.id)}><span><b>{zone.name}</b><small>{zone.safeForDemo ? reasonCopy[zone.reason] : "Private/restricted · excluded"}</small></span><strong>{zone.safeForDemo ? `£${(zone.rewardMinor / 100).toFixed(2)}` : "LOCKED"}</strong></button>)}</div>
        <div className={styles.controls}><label>Runner / device owner label<input value={runnerName} onChange={e => setRunnerName(e.target.value.slice(0, 40))}/></label><label>Available time <select value={duration} onChange={e => setDuration(Number(e.target.value))}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option></select></label><label>Distance <select value={distance} onChange={e => setDistance(Number(e.target.value))}><option value="1.5">1.5 km</option><option value="2.5">2.5 km</option><option value="4">4 km</option></select></label><label>Earnings target (optional)<input type="number" min="0" max="50" value={earningsTarget || ""} placeholder="£" onChange={e => setEarningsTarget(Number(e.target.value))}/></label></div>
        <div className={styles.itinerary}><div><small>Route</small><strong>{itinerary.estimatedDistanceKm} km</strong></div><div><small>Time</small><strong>{itinerary.estimatedDurationMinutes} min</strong></div><div><small>Est. earn</small><strong>£{(itinerary.estimatedRewardMinor / 100).toFixed(2)}</strong></div></div>
        <p className={styles.requirement}><b>{selected.name}</b><br/>{selected.evidence}</p>
        {!runLive ? <button className={styles.start} onClick={startRun}>Start earning run <span>→</span></button> : <button className={styles.finish} onClick={finishRun}>Finish / handoff</button>}
      </aside>
    </section>
    <section className={styles.capture} aria-live="polite">
      <div className={styles.preview}><video ref={video} muted playsInline /><span>{runLive ? "SAMPLED FRAME PREVIEW" : "CAMERA STARTS WITH RUN"}</span></div>
      <div className={styles.telemetry}><p className={styles.kicker}>Collection ledger</p><h2>{status}</h2><div className={styles.sensorGrid}>{Object.entries(sensors).map(([name, state]) => <div key={name}><small>{name}</small><b data-state={state}>{state}</b></div>)}<div><small>sound level</small><b>{audioDb === null ? "—" : `${audioDb} dBFS`}</b></div><div><small>frames analysed</small><b>{frameCount}</b></div></div>{position && <p className={styles.position}>GPS {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)} · ±{Math.round(position.accuracy)} m · {position.speed === null ? "speed unavailable" : `${position.speed.toFixed(1)} m/s`}</p>}{device && <p className={styles.position}>{String(device.deviceType)} · {String(device.platform)} · {String(device.viewport)} · {String(device.effectiveNetworkType ?? "network unknown")} · anonymous device session</p>}<p className={styles.position}>Motion: {motion} · screen {String(device?.screenOrientation ?? "unknown")}</p></div>
      <div className={styles.results}><p className={styles.kicker}>Luna multimodal results</p>{analyses.length ? analyses.map(item => <article key={item.id}><div><b>{item.category}</b><span>{Math.round(item.confidence * 100)}%</span></div><p>{item.description}</p><small>{item.provider} · {item.privacyState} · {item.visibleObjects.join(", ") || "scene"}</small></article>) : <p className={styles.empty}>Start a run to sample one compressed frame every 3 seconds. Near-identical and dark frames are skipped. Raw continuous video is never uploaded.</p>}</div>
    </section>
  </main>;
}
