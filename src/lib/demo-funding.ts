import { zones, type BountyZone } from "./eyeearn-data";

const funded = new Map<string, number>();
const keyToZone: Record<string, string> = {
  south: "zone-south-access",
  river: "zone-river-gate",
  north: "zone-north-loop",
};

export function fundDemoLocation(
  locationId: string,
  amountMinor: number,
): BountyZone | null {
  const zoneId = keyToZone[locationId] ?? locationId;
  const zone = zones.find((item) => item.id === zoneId);
  if (
    !zone ||
    !zone.safeForDemo ||
    !Number.isFinite(amountMinor) ||
    amountMinor < 1
  )
    return null;
  funded.set(zoneId, (funded.get(zoneId) ?? zone.rewardMinor) + amountMinor);
  return {
    ...zone,
    rewardMinor: funded.get(zoneId)!,
    reason: "buyer-requested",
    evidence: `${zone.evidence} · buyer-funded refresh`,
  };
}

export function fundedDemoZones() {
  return zones.map((zone) =>
    funded.has(zone.id)
      ? {
          ...zone,
          rewardMinor: funded.get(zone.id)!,
          reason: "buyer-requested" as const,
          evidence: `${zone.evidence} · buyer-funded refresh`,
        }
      : zone,
  );
}
