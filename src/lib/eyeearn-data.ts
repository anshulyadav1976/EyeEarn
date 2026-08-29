export type BountyZone = {
  id: string; name: string; coordinates: [number, number]; rewardMinor: number;
  reason: "unexplored" | "stale" | "buyer-requested" | "missing-modality";
  evidence: string; band: "standard" | "priority" | "urgent"; safeForDemo: boolean; routeIndex: number;
};

export const zones: BountyZone[] = [
  { id: "zone-south-access", name: "South access route", coordinates: [-0.01795, 51.5389], rewardMinor: 920, reason: "buyer-requested", evidence: "Forward camera frames, route position, sound level and one accessibility note", band: "urgent", safeForDemo: true, routeIndex: 2 },
  { id: "zone-river-gate", name: "River gate approach", coordinates: [-0.01485, 51.5404], rewardMinor: 610, reason: "missing-modality", evidence: "Camera frames plus ambient volume level; no continuous audio", band: "priority", safeForDemo: true, routeIndex: 5 },
  { id: "zone-north-loop", name: "North loop signage", coordinates: [-0.0168, 51.5421], rewardMinor: 380, reason: "stale", evidence: "Signage and obstruction scan with GPS accuracy", band: "standard", safeForDemo: true, routeIndex: 7 },
  { id: "zone-service-yard", name: "Restricted service yard", coordinates: [-0.0201, 51.5414], rewardMinor: 1240, reason: "unexplored", evidence: "Not routable", band: "urgent", safeForDemo: false, routeIndex: 9 },
];

export const preparedRoute: [number, number][] = [
  [-0.0196, 51.5384], [-0.0188, 51.5385], [-0.01795, 51.5389], [-0.0168, 51.5395],
  [-0.0156, 51.54], [-0.01485, 51.5404], [-0.0152, 51.5413], [-0.0168, 51.5421],
  [-0.0184, 51.5418], [-0.0194, 51.5409], [-0.0198, 51.5397], [-0.0196, 51.5384],
];

export const seededObservations = [
  { id: "OBS-001", category: "route obstruction", modality: "fused", source: "demo_import", privacyState: "redacted" },
  { id: "OBS-002", category: "signage", modality: "vision", source: "demo_import", privacyState: "safe" },
  { id: "OBS-003", category: "congestion", modality: "voice", source: "demo_import", privacyState: "safe" },
  { id: "OBS-004", category: "waste", modality: "vision", source: "demo_import", privacyState: "redacted" },
  { id: "OBS-005", category: "accessibility", modality: "fused", source: "demo_import", privacyState: "safe" },
];
