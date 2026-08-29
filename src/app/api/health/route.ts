import { storageStatus } from "@/lib/phase2-store";

export function GET() {
  return Response.json({
    ok: true,
    product: "EyeEarn",
    phase: 4,
    checkedAt: new Date().toISOString(),
    storage: storageStatus(),
  });
}
