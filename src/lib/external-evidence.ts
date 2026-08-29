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
  {
    id: "EXT-TFL-A11-STRAT",
    name: "A11 Stratford High Street",
    longitude: -0.0057,
    latitude: 51.5379,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:46:00.000Z",
    summary: "Steady westbound flow with a short signal-cycle queue.",
  },
  {
    id: "EXT-TFL-A23-BRIX",
    name: "A23 Brixton Road",
    longitude: -0.1164,
    latitude: 51.4656,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:48:00.000Z",
    summary: "Moderate two-way traffic; bus-lane movement remains clear.",
  },
  {
    id: "EXT-TFL-A10-HACK",
    name: "A10 Hackney",
    longitude: -0.0611,
    latitude: 51.5487,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:50:00.000Z",
    summary: "Slow southbound approach with intermittent release.",
  },
  {
    id: "EXT-TFL-A406-WEMB",
    name: "A406 Wembley",
    longitude: -0.2762,
    latitude: 51.5526,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:52:00.000Z",
    summary: "Event-area approach running normally before the demo window.",
  },
  {
    id: "EXT-TFL-A205-LEWI",
    name: "A205 Lewisham",
    longitude: -0.0146,
    latitude: 51.4615,
    category: "traffic-flow",
    capturedAt: "2026-08-29T13:54:00.000Z",
    summary: "Light traffic with no persistent junction blockage detected.",
  },
];
