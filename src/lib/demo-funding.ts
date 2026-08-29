import { zones, type BountyZone } from "./eyeearn-data";
import { listBounties, saveBounty } from "./phase2-store";

const funded = new Map<string, number>();
const customZones = new Map<string, BountyZone>();
const keyToZone: Record<string, string> = {
  south: "zone-south-access",
  river: "zone-river-gate",
  north: "zone-north-loop",
};

let hydrated = false;
export async function hydrateFunding() {
  if (hydrated) return;
  for (const item of await listBounties()) {
    funded.set(item.id, item.rewardMinor);
    if (item.zone) customZones.set(item.id, item.zone);
  }
  hydrated = true;
}

type NewLocation = {
  name?: string;
  coordinates?: [number, number];
  requirement?: string;
  safeForDemo?: boolean;
};

export async function fundDemoLocation(
  locationId: string,
  amountMinor: number,
  request: NewLocation = {},
): Promise<BountyZone | null> {
  const zoneId = keyToZone[locationId] ?? locationId;
  let zone =
    zones.find((item) => item.id === zoneId) ?? customZones.get(zoneId);
  let created = false;
  if (!zone && request.coordinates && request.safeForDemo) {
    const [lng, lat] = request.coordinates;
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -0.52 ||
      lng > 0.32 ||
      lat < 51.3 ||
      lat > 51.7
    )
      return null;
    const evidence = (request.requirement || "Fresh visual coverage request")
      .trim()
      .slice(0, 180);
    zone = {
      id: zoneId,
      name: (request.name || "Buyer-requested London location")
        .trim()
        .slice(0, 80),
      coordinates: [lng, lat],
      rewardMinor: amountMinor,
      reason: "buyer-requested",
      evidence,
      band:
        amountMinor >= 900
          ? "urgent"
          : amountMinor >= 600
            ? "priority"
            : "standard",
      safeForDemo: true,
      routeIndex: 100 + customZones.size,
    };
    customZones.set(zoneId, zone);
    created = true;
  }
  if (
    !zone ||
    !zone.safeForDemo ||
    !Number.isFinite(amountMinor) ||
    amountMinor < 1
  )
    return null;
  funded.set(
    zoneId,
    created
      ? amountMinor
      : (funded.get(zoneId) ?? zone.rewardMinor) + amountMinor,
  );
  const updated = {
    ...zone,
    rewardMinor: funded.get(zoneId)!,
    reason: "buyer-requested",
    evidence: `${zone.evidence} · buyer-funded refresh`,
  } satisfies BountyZone;
  if (customZones.has(zoneId)) customZones.set(zoneId, updated);
  await saveBounty(
    zoneId,
    updated.rewardMinor,
    customZones.has(zoneId) ? updated : undefined,
  );
  return updated;
}

export function fundedDemoZones() {
  return [...zones, ...customZones.values()].map((zone) =>
    funded.has(zone.id)
      ? {
          ...zone,
          rewardMinor: funded.get(zone.id)!,
          reason: "buyer-requested" as const,
          evidence: zone.evidence.includes("buyer-funded refresh")
            ? zone.evidence
            : `${zone.evidence} · buyer-funded refresh`,
        }
      : zone,
  );
}
