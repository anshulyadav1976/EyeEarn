import type { BountyZone } from "./eyeearn-data";

export function buildItinerary(zones: BountyZone[], primaryId: string, durationMinutes: number, distanceKm: number, earningsTargetMinor = 0) {
  const safe = zones.filter((zone) => zone.safeForDemo);
  const primary = safe.find((zone) => zone.id === primaryId) ?? safe[0];
  if (!primary) throw new Error("No safe bounty zones are available");

  const capacity = Math.max(1, Math.min(safe.length, Math.floor(Math.min(durationMinutes / 10, distanceKm / 0.7))));
  const ranked = [primary, ...safe.filter((zone) => zone.id !== primary.id).sort((a, b) => b.rewardMinor - a.rewardMinor)];
  let selected = ranked.slice(0, capacity);
  if (earningsTargetMinor > selected.reduce((sum, zone) => sum + zone.rewardMinor, 0)) selected = ranked;

  return {
    zoneIds: selected.map((zone) => zone.id),
    estimatedRewardMinor: selected.reduce((sum, zone) => sum + zone.rewardMinor, 0),
    estimatedDistanceKm: Number(Math.min(distanceKm, Math.max(.8, selected.length * .74)).toFixed(1)),
    estimatedDurationMinutes: Math.min(durationMinutes, Math.round(selected.length * 8 + 4)),
  };
}
