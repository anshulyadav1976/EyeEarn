import { externalEvidence } from "@/lib/external-evidence";
import { listRuns } from "@/lib/phase2-store";

const allowedSources = new Set(["all", "eyeearn", "external"]);

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source") || "all";
  if (!allowedSources.has(source))
    return Response.json(
      { error: "source must be all, eyeearn or external" },
      { status: 400 },
    );

  const runs = await listRuns();
  const collected = runs.flatMap((run) =>
    (run.observations || []).flatMap((item) => {
      if (
        item.privacyState === "blocked" ||
        !Number.isFinite(item.longitude) ||
        !Number.isFinite(item.latitude)
      )
        return [];
      return [
        {
          type: "Feature" as const,
          id: item.id,
          geometry: {
            type: "Point" as const,
            coordinates: [item.longitude!, item.latitude!],
          },
          properties: {
            id: item.id,
            source: "eyeearn",
            category: item.category || "observation",
            modality: item.modality || "unknown",
            capturedAt: item.capturedAt,
            privacyState: item.privacyState || "safe",
            runId: run.id,
          },
        },
      ];
    }),
  );
  const external = externalEvidence.map((item) => ({
    type: "Feature" as const,
    id: item.id,
    geometry: {
      type: "Point" as const,
      coordinates: [item.longitude, item.latitude],
    },
    properties: {
      id: item.id,
      source: "external",
      provider: "TfL JamCam-shaped demo fixture",
      category: item.category,
      modality: "derived aggregate",
      capturedAt: item.capturedAt,
      privacyState: "derived-only",
      summary: item.summary,
      locationName: item.name,
    },
  }));
  const features = [
    ...(source === "external" ? [] : collected),
    ...(source === "eyeearn" ? [] : external),
  ];
  return Response.json({
    type: "FeatureCollection",
    features,
    meta: {
      generatedAt: new Date().toISOString(),
      count: features.length,
      rawMediaIncluded: false,
      note: "Only privacy-safe derived fields are exposed.",
    },
  });
}
