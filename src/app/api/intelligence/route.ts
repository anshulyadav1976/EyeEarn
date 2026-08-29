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
    const question =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).question
        : null;
    if (!isQuestion(question))
      return json({ error: "Choose a supported intelligence question" }, 400);
    return json({ result: answerIntelligence(question, await listRuns()) });
  } catch {
    return json({ error: "JSON body required" }, 400);
  }
}
