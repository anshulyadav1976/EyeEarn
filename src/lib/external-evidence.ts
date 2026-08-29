export type ExternalEvidence = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  category: "traffic-flow";
  capturedAt: string;
  summary: string;
};

/** Demo fixture shaped like a permitted TfL JamCam-derived aggregate; no image or personal data. */
export const externalEvidence: ExternalEvidence[] = [
  {
    id: "EXT-TFL-A12-BOW",
    name: "A12 Bow interchange",
    longitude: -0.0194,
    latitude: 51.5275,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:40:00.000Z",
    summary: "Moderate eastbound flow; no persistent queue detected.",
  },
  {
    id: "EXT-TFL-A40-WOOD",
    name: "A40 Wood Lane",
    longitude: -0.2246,
    latitude: 51.5109,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:42:00.000Z",
    summary: "Slow approach traffic with intermittent clearing.",
  },
  {
    id: "EXT-TFL-A2-KENT",
    name: "A2 Old Kent Road",
    longitude: -0.0739,
    latitude: 51.4874,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:44:00.000Z",
    summary: "Normal moving traffic for the demo observation window.",
  },
];
