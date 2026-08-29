import type { BountyZone } from "./eyeearn-data";

export type RunStatus = "live" | "finished" | "handed-off";
export type RoutePoint = { latitude: number; longitude: number; accuracy?: number | null; recordedAt: string };
export type Run = {
  id: string; runnerName: string; zoneIds: string[]; status: RunStatus;
  startedAt: string; finishedAt?: string; handedOffAt?: string;
  routePoints: RoutePoint[]; observations: Observation[]; completions: Completion[];
  earnedMinor: number;
};
export type Observation = { id: string; category: string; description: string; modality: "vision" | "voice" | "fused"; capturedAt: string; latitude?: number; longitude?: number; privacyState?: "safe" | "redacted" | "blocked" };
export type Completion = { zoneId: string; accepted: boolean; completedAt: string; rewardMinor: number };

const validCoordinate = (p: RoutePoint) => Number.isFinite(p.latitude) && p.latitude >= -90 && p.latitude <= 90 && Number.isFinite(p.longitude) && p.longitude >= -180 && p.longitude <= 180 && !Number.isNaN(Date.parse(p.recordedAt));
const distanceMetres = (a: RoutePoint, b: RoutePoint) => {
  const rad = Math.PI / 180, dLat = (b.latitude - a.latitude) * rad, dLon = (b.longitude - a.longitude) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export function createRun(runnerName: string, zoneIds: string[], now = new Date().toISOString()): Run {
  if (!runnerName.trim() || runnerName.length > 80) throw new Error("Runner name is required");
  if (!zoneIds.length || zoneIds.length > 20) throw new Error("Choose at least one bounty zone");
  return { id: `RUN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, runnerName: runnerName.trim(), zoneIds: [...new Set(zoneIds)], status: "live", startedAt: now, routePoints: [], observations: [], completions: [], earnedMinor: 0 };
}

export function appendRoutePoints(run: Run, points: RoutePoint[]): { accepted: RoutePoint[]; rejected: number } {
  if (run.status !== "live") throw new Error("Run is no longer live");
  const accepted: RoutePoint[] = [];
  for (const point of points.slice(0, 100)) {
    if (!validCoordinate(point)) continue;
    const previous = accepted.at(-1) ?? run.routePoints.at(-1);
    // ponytail: simple 300m/second jump gate; upgrade to map matching when real telemetry matters.
    if (previous) { const seconds = Math.max(1, (Date.parse(point.recordedAt) - Date.parse(previous.recordedAt)) / 1000); if (distanceMetres(previous, point) > 300 * seconds) continue; }
    accepted.push({ ...point, accuracy: point.accuracy == null ? null : Math.max(0, Math.min(500, point.accuracy)) });
  }
  run.routePoints.push(...accepted); return { accepted, rejected: points.length - accepted.length };
}

export function addObservation(run: Run, observation: Observation) {
  if (run.status !== "live") throw new Error("Run is no longer live");
  if (!observation.id || !observation.category || observation.description.length > 500) throw new Error("Invalid observation");
  if (observation.privacyState === "blocked") throw new Error("Blocked evidence cannot be retained");
  run.observations.push({ ...observation, description: observation.description.slice(0, 500) }); return observation;
}

export function completeZone(run: Run, zone: BountyZone, accepted: boolean, now = new Date().toISOString()) {
  if (run.status !== "live" || !run.zoneIds.includes(zone.id)) throw new Error("Zone is not part of this live run");
  if (run.completions.some(c => c.zoneId === zone.id)) throw new Error("Zone already completed");
  const completion = { zoneId: zone.id, accepted, completedAt: now, rewardMinor: accepted ? zone.rewardMinor : 0 };
  run.completions.push(completion); run.earnedMinor += completion.rewardMinor; return completion;
}

export function finishRun(run: Run, now = new Date().toISOString()) {
  if (run.status !== "live") throw new Error("Run is no longer live");
  run.status = "finished"; run.finishedAt = now; return run;
}

export function handoffRun(run: Run, now = new Date().toISOString()) {
  if (run.status !== "finished") throw new Error("Finish the run before handoff");
  run.status = "handed-off"; run.handedOffAt = now; return run;
}
