export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey)
    return Response.json({
      configured: false,
      mode: "browser-fallback",
      message: "Browser speech capture is ready for the demo.",
    });
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      { headers: { "xi-api-key": apiKey }, cache: "no-store" },
    );
    if (!response.ok)
      return Response.json({
        configured: false,
        mode: "browser-fallback",
        message: "Scribe unavailable; browser fallback enabled.",
      });
    const payload = await response.json();
    return Response.json({
      configured: true,
      mode: "scribe",
      token: payload.token ?? payload,
    });
  } catch {
    return Response.json({
      configured: false,
      mode: "browser-fallback",
      message: "Scribe unavailable; browser fallback enabled.",
    });
  }
}
