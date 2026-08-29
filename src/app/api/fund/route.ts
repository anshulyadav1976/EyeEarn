import {
  fundedDemoZones,
  fundDemoLocation,
  hydrateFunding,
} from "@/lib/demo-funding";

export async function GET() {
  await hydrateFunding();
  return Response.json({ zones: fundedDemoZones(), mode: "demo" });
}

export async function POST(request: Request) {
  try {
    await hydrateFunding();
    const body = (await request.json()) as {
      locationId?: string;
      amountMinor?: number;
      currency?: string;
      name?: string;
      coordinates?: [number, number];
      requirement?: string;
      safeForDemo?: boolean;
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
    const zone = await fundDemoLocation(body.locationId, body.amountMinor, {
      name: body.name,
      coordinates: body.coordinates,
      requirement: body.requirement,
      safeForDemo: body.safeForDemo,
    });
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
