import OpenAI from "openai";
import { answerIntelligence, isQuestion } from "@/lib/intelligence";
import { listRuns } from "@/lib/phase2-store";

const json = (data: unknown, status = 200) => Response.json(data, { status });

export async function GET(request: Request) {
  const question =
    new URL(request.url).searchParams.get("question") || "access";
  if (!isQuestion(question))
    return json({ error: "Choose a supported intelligence question" }, 400);
  return json({ result: answerIntelligence(question, await listRuns()) });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const question = payload.question;
    const message =
      typeof payload.message === "string" ? payload.message.trim() : "";
    const runs = await listRuns();

    if (isQuestion(question)) {
      const result = answerIntelligence(question, runs);
      return json({
        answer: result.answer,
        provider: "EyeEarn verified demo brief",
        result,
      });
    }
    if (message.length < 2 || message.length > 500)
      return json(
        { error: "Ask a question between 2 and 500 characters" },
        400,
      );

    const citations = answerIntelligence("access", runs).citations;
    const ledger = runs
      .flatMap((run) =>
        run.observations.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          modality: item.modality,
          capturedAt: item.capturedAt,
          longitude: item.longitude,
          latitude: item.latitude,
          privacyState: item.privacyState,
        })),
      )
      .filter((item) => item.privacyState !== "blocked")
      .slice(0, 20);
    const evidence = ledger.length
      ? ledger
      : citations.map((item) => ({
          id: item.id,
          category: item.label,
          modality: item.modality,
          capturedAt: item.time,
          longitude: item.position[0],
          latitude: item.position[1],
          privacyState: "demo-seed",
        }));

    if (!process.env.OPENAI_API_KEY)
      return json({
        answer:
          "The live Luna channel is unavailable. Use one of the verified briefs above; they remain fully demoable without model access.",
        provider: "safe local fallback",
        citations,
      });

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const response = await new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }).responses.create({
      model,
      reasoning: { effort: "medium" },
      store: false,
      max_output_tokens: 320,
      text: { verbosity: "low" },
      instructions:
        "You are EyeEarn Field Intelligence. Answer like a precise intelligence analyst in 2-4 short paragraphs. Use only the supplied privacy-safe evidence ledger. Cite supporting IDs in square brackets. Never invent a street condition, person, count or event. If the evidence cannot answer the question, say exactly what is missing and recommend one short, specific London coverage mission.",
      input: `QUESTION:\n${message}\n\nPRIVACY-SAFE EVIDENCE LEDGER:\n${JSON.stringify(evidence)}`,
    });
    return json({
      answer:
        response.output_text ||
        "No usable answer was returned. Try a verified brief instead.",
      provider: `${model} · medium reasoning`,
      citations,
    });
  } catch {
    return json(
      { error: "The secure intelligence channel could not answer" },
      400,
    );
  }
}
