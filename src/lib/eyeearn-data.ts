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
  { id: "zone-camden-high", name: "Camden access corridor", coordinates: [-0.1426, 51.5416], rewardMinor: 780, reason: "buyer-requested", evidence: "Step-free route and signage scan", band: "priority", safeForDemo: true, routeIndex: 11 },
  { id: "zone-kings-cross", name: "King's Cross crossings", coordinates: [-0.1233, 51.5308], rewardMinor: 540, reason: "stale", evidence: "Crossing condition and obstruction scan", band: "standard", safeForDemo: true, routeIndex: 12 },
  { id: "zone-westminster", name: "Westminster footway", coordinates: [-0.1276, 51.501], rewardMinor: 920, reason: "missing-modality", evidence: "Access, crowding and surface report", band: "urgent", safeForDemo: true, routeIndex: 13 },
  { id: "zone-southbank", name: "South Bank riverside", coordinates: [-0.1167, 51.5055], rewardMinor: 680, reason: "unexplored", evidence: "Riverside route and ambient conditions", band: "priority", safeForDemo: true, routeIndex: 14 },
  { id: "zone-shoreditch", name: "Shoreditch high street", coordinates: [-0.0799, 51.5257], rewardMinor: 460, reason: "stale", evidence: "Street works and pedestrian flow", band: "standard", safeForDemo: true, routeIndex: 15 },
  { id: "zone-greenwich", name: "Greenwich approach", coordinates: [0.0016, 51.4826], rewardMinor: 720, reason: "buyer-requested", evidence: "Hill approach and step-free alternatives", band: "priority", safeForDemo: true, routeIndex: 16 },
  { id: "zone-hammersmith", name: "Hammersmith interchange", coordinates: [-0.2248, 51.492], rewardMinor: 840, reason: "missing-modality", evidence: "Interchange access and signage", band: "urgent", safeForDemo: true, routeIndex: 17 },
  { id: "zone-richmond", name: "Richmond riverside", coordinates: [-0.3037, 51.4613], rewardMinor: 590, reason: "unexplored", evidence: "Riverside surface and obstruction scan", band: "standard", safeForDemo: true, routeIndex: 18 },
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
