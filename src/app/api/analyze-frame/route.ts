import OpenAI from "openai";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    description: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    actionable: { type: "boolean" },
    visibleObjects: { type: "array", items: { type: "string" }, maxItems: 12 },
    sceneConditions: { type: "array", items: { type: "string" }, maxItems: 8 },
    privacyRisk: { type: "boolean" },
    facesDetected: { type: "boolean" },
    platesDetected: { type: "boolean" },
  },
  required: [
    "category",
    "description",
    "severity",
    "confidence",
    "actionable",
    "visibleObjects",
    "sceneConditions",
    "privacyRisk",
    "facesDetected",
    "platesDetected",
  ],
};

type Analysis = {
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  actionable: boolean;
  visibleObjects: string[];
  sceneConditions: string[];
  privacyRisk: boolean;
  facesDetected: boolean;
  platesDetected: boolean;
};

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Analysis>;
  return (
    typeof item.category === "string" &&
    typeof item.description === "string" &&
    ["low", "medium", "high"].includes(String(item.severity)) &&
    typeof item.confidence === "number" &&
    item.confidence >= 0 &&
    item.confidence <= 1 &&
    typeof item.actionable === "boolean" &&
    Array.isArray(item.visibleObjects) &&
    Array.isArray(item.sceneConditions) &&
    typeof item.privacyRisk === "boolean" &&
    typeof item.facesDetected === "boolean" &&
    typeof item.platesDetected === "boolean"
  );
}

function safeMetadata(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.length > 12_000) return {};
  try {
    const parsed = JSON.parse(raw);
    const position = parsed?.position;
    if (
      position &&
      (!Number.isFinite(position.latitude) ||
        position.latitude < -90 ||
        position.latitude > 90 ||
        !Number.isFinite(position.longitude) ||
        position.longitude < -180 ||
        position.longitude > 180)
    )
      throw new Error("Invalid position");
    return {
      position: position
        ? {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            heading: position.heading,
            speed: position.speed,
            recordedAt: position.recordedAt,
          }
        : null,
      audioDb: typeof parsed.audioDb === "number" ? parsed.audioDb : null,
      brightness:
        typeof parsed.brightness === "number" ? parsed.brightness : null,
      facesRedacted: parsed.facesRedacted === true,
      capturedAt: parsed.capturedAt,
    };
  } catch {
    throw new Error("Invalid frame metadata");
  }
}

function fallback(metadata: ReturnType<typeof safeMetadata>): Analysis {
  return {
    category: "scene sample",
    description:
      "A usable route frame was captured; live model analysis can be retried.",
    severity: "low",
    confidence: 0.35,
    actionable: false,
    visibleObjects: ["route environment"],
    sceneConditions:
      metadata.brightness && metadata.brightness < 40
        ? ["low light"]
        : ["daylight or lit scene"],
    privacyRisk: !metadata.facesRedacted,
    facesDetected: false,
    platesDetected: false,
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    // The browser may still send `frame`; new clients can send up to 3 `frames`
    // captured over a short burst so Luna can reason about temporal change.
    const submitted = form
      .getAll("frames")
      .filter((item): item is File => item instanceof File);
    const legacy = form.get("frame");
    const frames = submitted.length
      ? submitted
      : legacy instanceof File
        ? [legacy]
        : [];
    if (!frames.length || frames.some((frame) => frame.type !== "image/jpeg"))
      return Response.json(
        { error: "One to three JPEG frames are required" },
        { status: 415 },
      );
    if (
      frames.length > 3 ||
      frames.some((frame) => frame.size < 200 || frame.size > 1_500_000)
    )
      return Response.json(
        { error: "Send up to 3 JPEG frames, each between 200 B and 1.5 MB" },
        { status: 413 },
      );
    const metadataValues = form.getAll("metadata");
    const metadata = safeMetadata(metadataValues[0] ?? null);
    let analysis: Analysis;
    let provider = "local-fallback";
    if (process.env.OPENAI_API_KEY) {
      try {
        const images = await Promise.all(
          frames.map(async (frame) =>
            Buffer.from(await frame.arrayBuffer()).toString("base64"),
          ),
        );
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await client.responses.create({
          model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
          reasoning: { effort: "medium" },
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "Analyse this short chronological burst of sampled route-survey frames as one temporal report. Describe meaningful changes or persistent conditions across frames. Focus on infrastructure, access, signage, congestion, waste, equipment and operational conditions. Do not identify or profile people. Use a short factual description. Flag any visible face or number plate as privacy risk.",
                },
                ...images.map((data) => ({
                  type: "input_image" as const,
                  detail: "low" as const,
                  image_url: `data:image/jpeg;base64,${data}`,
                })),
              ],
            },
          ],
          text: {
            verbosity: "low",
            format: {
              type: "json_schema",
              name: "eyeearn_observation",
              strict: true,
              schema,
            },
          },
        });
        const parsed = JSON.parse(response.output_text);
        if (!isAnalysis(parsed)) throw new Error("Invalid model output");
        analysis = parsed;
        provider = `${process.env.OPENAI_MODEL || "gpt-5.6-luna"} · medium`;
      } catch (error) {
        console.error(
          "Luna analysis failed:",
          error instanceof Error ? error.message : "unknown provider error",
        );
        analysis = fallback(metadata);
        provider = "local-fallback · model retry available";
      }
    } else analysis = fallback(metadata);
    const privacyState =
      analysis.privacyRisk || analysis.facesDetected || analysis.platesDetected
        ? metadata.facesRedacted && !analysis.platesDetected
          ? "redacted"
          : "blocked"
        : "safe";
    return Response.json({
      id: `OBS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...analysis,
      description: analysis.description.slice(0, 220),
      visibleObjects: analysis.visibleObjects.slice(0, 12),
      sceneConditions: analysis.sceneConditions.slice(0, 8),
      privacyState,
      provider,
      metadata,
      framesAnalyzed: frames.length,
      reportType: frames.length > 1 ? "temporal-burst" : "single-frame",
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Frame analysis failed",
      },
      { status: 400 },
    );
  }
}
