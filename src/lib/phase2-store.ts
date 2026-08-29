import { promises as fs } from "node:fs";
import path from "node:path";
import type { Run } from "./phase2-backbone";

type Database = { runs: Run[] };
const file = path.join(process.cwd(), ".data", "phase2.json");
const runtime = globalThis as typeof globalThis & {
  __eyeearnPhase2?: Database;
};
const memory = () => (runtime.__eyeearnPhase2 ??= { runs: [] });

async function read(): Promise<Database> {
  if (process.env.VERCEL) return memory();
  try {
    const database = JSON.parse(await fs.readFile(file, "utf8")) as Database;
    runtime.__eyeearnPhase2 = database;
    return database;
  } catch {
    return memory();
  }
}
async function write(database: Database) {
  runtime.__eyeearnPhase2 = database;
  if (process.env.VERCEL) return;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(database, null, 2));
}
export async function listRuns() {
  return (await read()).runs;
}
export async function saveRun(run: Run) {
  const database = await read();
  const index = database.runs.findIndex((item) => item.id === run.id);
  if (index < 0) database.runs.unshift(run);
  else database.runs[index] = run;
  await write(database);
  return run;
}
export async function getRun(id: string) {
  return (await read()).runs.find((run) => run.id === id);
}
