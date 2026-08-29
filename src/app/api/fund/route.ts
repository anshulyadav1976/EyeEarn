import { fundedDemoZones, fundDemoLocation } from "@/lib/demo-funding";

export async function GET() {
  return Response.json({ zones: fundedDemoZones(), mode: "demo" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      locationId?: string;
      amountMinor?: number;
      currency?: string;
    };
    if (
      body.currency !== "GBP" ||
      !body.locationId ||
      typeof body.amountMinor !== "number"
    )
      return Response.json(
        { error: "locationId, amountMinor and GBP currency are required" },
        { status: 400 },
      );
    const zone = fundDemoLocation(body.locationId, body.amountMinor);
    if (!zone)
      return Response.json(
        { error: "Location is unavailable for demo funding" },
        { status: 404 },
      );
    return Response.json(
      { mode: "demo", funded: true, zone, receiptId: `demo-${Date.now()}` },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Invalid funding request" }, { status: 400 });
  }
}
