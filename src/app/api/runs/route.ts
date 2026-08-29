import {
  addObservation,
  appendRoutePoints,
  completeZone,
  createRun,
  finishRun,
  handoffRun,
  type Observation,
  type RoutePoint,
} from "@/lib/phase2-backbone";
import { getRun, listRuns, saveRun } from "@/lib/phase2-store";
import { fundedDemoZones, hydrateFunding } from "@/lib/demo-funding";

const json = (data: unknown, status = 200) => Response.json(data, { status });
export async function GET() {
  await hydrateFunding();
  return json({ runs: await listRuns() });
}
export async function POST(request: Request) {
  try {
    await hydrateFunding();
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 500_000) return json({ error: "Request too large" }, 413);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return json({ error: "JSON body required" }, 400);
    const payload = body as Record<string, unknown>;
    const action = String(payload.action || "");
    const zones = fundedDemoZones();
    if (action === "start") {
      const runnerName = String(payload.runnerName || "");
      const zoneIds = Array.isArray(payload.zoneIds)
        ? payload.zoneIds.map(String)
        : [];
      if (
        zoneIds.some(
          (id: string) =>
            !zones.some((zone) => zone.id === id && zone.safeForDemo),
        )
      )
        return json({ error: "Only safe bounty zones can be run" }, 400);
      return json({ run: await saveRun(createRun(runnerName, zoneIds)) }, 201);
    }
    const run = await getRun(String(payload.runId || ""));
    if (!run) return json({ error: "Run not found" }, 404);
    if (action === "points") {
      const result = appendRoutePoints(
        run,
        Array.isArray(payload.points) ? (payload.points as RoutePoint[]) : [],
      );
      await saveRun(run);
      return json({ run, ...result });
    }
    if (action === "observation") {
      addObservation(run, payload.observation as Observation);
      await saveRun(run);
      return json({ run });
    }
    if (action === "complete") {
      const zone = zones.find(
        (item) => item.id === payload.zoneId && item.safeForDemo,
      );
      if (!zone) return json({ error: "Safe zone not found" }, 400);
      if (!run.observations.length)
        return json(
          { error: "Record usable evidence before accepting this target" },
          400,
        );
      const completion = completeZone(run, zone, payload.accepted === true);
      await saveRun(run);
      return json({ run, completion });
    }
    if (action === "finish") {
      finishRun(run);
      if (payload.handoff === true) handoffRun(run);
      await saveRun(run);
      return json({ run });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      400,
    );
  }
}
