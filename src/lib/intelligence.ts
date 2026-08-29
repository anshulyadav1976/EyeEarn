import type { Run } from "./phase2-backbone";

export const intelligenceQuestions = [
  {
    id: "access",
    label: "Is South Bank access usable now?",
    eyebrow: "Accessibility · last 7 days",
  },
  {
    id: "compare",
    label: "How does the morning compare with last week?",
    eyebrow: "Footfall · weekday comparison",
  },
  {
    id: "gap",
    label: "Is there enough evidence around Greenwich?",
    eyebrow: "Coverage gap · fresh mission",
  },
] as const;

export type IntelligenceQuestion = (typeof intelligenceQuestions)[number]["id"];
export type IntelligenceResponse = {
  questionId: IntelligenceQuestion;
  question: string;
  state: "supported" | "gap";
  headline: string;
  answer: string;
  confidence: number;
  coverage: number;
  methodology: string;
  citations: Array<{
    id: string;
    label: string;
    modality: string;
    time: string;
    position: [number, number];
  }>;
  comparison: Array<{ label: string; value: number; note: string }>;
  mission?: {
    title: string;
    reward: string;
    rationale: string;
    location: string;
  };
};

const fallbackCitations = [
  { id: "OBS-001", label: "route obstruction", modality: "fused" },
  { id: "OBS-002", label: "signage", modality: "vision" },
  { id: "OBS-003", label: "congestion", modality: "voice" },
].map((item, index) => ({
  ...item,
  time: ["12 min ago", "31 min ago", "Today, 08:42"][index],
  position: [-0.108 + index * 0.004, 51.505 + index * 0.002] as [
    number,
    number,
  ],
}));

const liveCitations = (runs: Run[]) =>
  runs
    .flatMap((run) =>
      run.observations.map((item, index) => ({
        id: item.id || `${run.id}-${index + 1}`,
        label: item.category,
        modality: item.modality,
        time: "Newest run",
        position: [
          item.longitude ?? -0.106 + index * 0.003,
          item.latitude ?? 51.505 + index * 0.002,
        ] as [number, number],
      })),
    )
    .filter((item) => item.id && item.label)
    .slice(0, 3);

/** Controlled demo answers only: question ids map to vetted summaries, never database query text. */
export function answerIntelligence(
  questionId: string,
  runs: Run[] = [],
): IntelligenceResponse {
  const citations = [...liveCitations(runs), ...fallbackCitations].slice(0, 3);
  if (questionId === "gap")
    return {
      questionId: "gap",
      question: intelligenceQuestions[2].label,
      state: "gap",
      headline: "Not enough current evidence to make that call.",
      answer:
        "Greenwich has route coverage, but no recent usable accessibility observation. EyeEarn will not infer a condition from stale or unrelated evidence.",
      confidence: 28,
      coverage: 27,
      methodology:
        "Checked privacy-safe observations within the Greenwich request area, then applied the 72-hour freshness threshold.",
      citations: citations.slice(0, 2),
      comparison: [
        { label: "Fresh evidence", value: 1, note: "needed: 3" },
        { label: "Accessibility signal", value: 0, note: "missing" },
      ],
      mission: {
        title: "Greenwich accessibility refresh",
        reward: "£8.20",
        rationale:
          "Collect step-free access, signage and temporary obstruction evidence.",
        location: "Greenwich footway · 1.1 km route",
      },
    };
  if (questionId === "compare")
    return {
      questionId: "compare",
      question: intelligenceQuestions[1].label,
      state: "supported",
      headline: "Morning footfall is higher, with clearer crossings.",
      answer:
        "This week’s 08:00–10:00 observations indicate a busier approach than last week, while crossing continuity improved after the temporary barrier was cleared.",
      confidence: 81,
      coverage: 76,
      methodology:
        "Compared privacy-safe vision and voice observations from matched weekday morning windows. Counts are directional, not a pedestrian census.",
      citations,
      comparison: [
        { label: "This week", value: 74, note: "higher activity" },
        { label: "Last week", value: 58, note: "baseline" },
      ],
    };
  return {
    questionId: "access",
    question: intelligenceQuestions[0].label,
    state: "supported",
    headline: "South Bank access is usable, with one watchpoint.",
    answer:
      "The current step-free route is clear. Recent evidence flags intermittent crowding near the river gate, so allow a little extra passing space at peak periods.",
    confidence: 88,
    coverage: 92,
    methodology:
      "Synthesised privacy-processed camera, voice and route-position observations within 250 m of the access route. Direct identifiers and raw media are excluded.",
    citations,
    comparison: [
      { label: "Step-free continuity", value: 92, note: "clear" },
      { label: "Peak crowding", value: 46, note: "watchpoint" },
    ],
  };
}

export const isQuestion = (value: unknown): value is IntelligenceQuestion =>
  typeof value === "string" &&
  intelligenceQuestions.some((item) => item.id === value);
