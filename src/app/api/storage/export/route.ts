import { exportSnapshot, storageStatus } from "@/lib/phase2-store";

/** Download the current local dataset so it can be committed as the Vercel demo snapshot. */
export async function GET() {
  return Response.json({ exportedAt: new Date().toISOString(), storage: storageStatus(), data: await exportSnapshot() });
}
