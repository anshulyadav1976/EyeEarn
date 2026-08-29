import { promises as fs } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Run } from "./phase2-backbone";
import type { BountyZone } from "./eyeearn-data";

/** Local-first persistence: Node 22 SQLite when available, portable JSON snapshot otherwise. */
export type StoredBounty = {
  id: string;
  rewardMinor: number;
  zone?: BountyZone;
};
type Database = { runs: Run[]; bounties: StoredBounty[] };
type SqliteStatement = {
  all: (...values: unknown[]) => unknown[];
  run: (...values: unknown[]) => unknown;
};
type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
};
const dataDir = path.join(process.cwd(), ".data");
const snapshotFile = path.join(dataDir, "phase2.json");
const sqliteFile = path.join(dataDir, "phase2.sqlite");
const runtime = globalThis as typeof globalThis & {
  __eyeearnPhase2?: Database;
  __eyeearnSqlite?: { db: SqliteDatabase | null; error?: string };
};
const memory = () => (runtime.__eyeearnPhase2 ??= { runs: [], bounties: [] });

function openSqlite() {
  if (process.env.VERCEL || runtime.__eyeearnSqlite)
    return runtime.__eyeearnSqlite?.db;
  try {
    const db = new DatabaseSync(sqliteFile) as unknown as SqliteDatabase;
    db.exec(
      "CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS bounties (id TEXT PRIMARY KEY, rewardMinor INTEGER NOT NULL, data TEXT);",
    );
    try {
      db.exec("ALTER TABLE bounties ADD COLUMN data TEXT");
    } catch {
      // Existing databases already have the column.
    }
    runtime.__eyeearnSqlite = { db };
    return db;
  } catch (error) {
    runtime.__eyeearnSqlite = {
      db: null,
      error: error instanceof Error ? error.message : "SQLite unavailable",
    };
    return null;
  }
}
async function read(): Promise<Database> {
  if (runtime.__eyeearnPhase2) {
    runtime.__eyeearnPhase2.runs ??= [];
    runtime.__eyeearnPhase2.bounties ??= [];
    return runtime.__eyeearnPhase2;
  }
  const db = openSqlite();
  if (db) {
    const runs = (
      db.prepare("SELECT data FROM runs ORDER BY rowid DESC").all() as {
        data: string;
      }[]
    ).map((r) => JSON.parse(r.data) as Run);
    const bounties = (
      db.prepare("SELECT id, rewardMinor, data FROM bounties").all() as Array<{
        id: string;
        rewardMinor: number;
        data?: string | null;
      }>
    ).map(({ id, rewardMinor, data }) => ({
      id,
      rewardMinor,
      zone: data ? (JSON.parse(data) as BountyZone) : undefined,
    }));
    if (runs.length || bounties.length)
      return (runtime.__eyeearnPhase2 = { runs, bounties });
  }
  try {
    const parsed = JSON.parse(
      await fs.readFile(snapshotFile, "utf8"),
    ) as Partial<Database>;
    return (runtime.__eyeearnPhase2 = {
      runs: parsed.runs ?? [],
      bounties: parsed.bounties ?? [],
    });
  } catch {
    return memory();
  }
}
async function write(database: Database) {
  runtime.__eyeearnPhase2 = database;
  const db = openSqlite();
  if (db) {
    const tx = db.prepare(
      "INSERT INTO runs (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    );
    for (const run of database.runs) tx.run(run.id, JSON.stringify(run));
    const bounty = db.prepare(
      "INSERT INTO bounties (id, rewardMinor, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET rewardMinor=excluded.rewardMinor, data=excluded.data",
    );
    for (const item of database.bounties)
      bounty.run(
        item.id,
        item.rewardMinor,
        item.zone ? JSON.stringify(item.zone) : null,
      );
  }
  if (process.env.VERCEL) return;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(snapshotFile, JSON.stringify(database, null, 2) + "\n");
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
export async function saveBounty(
  id: string,
  rewardMinor: number,
  zone?: BountyZone,
) {
  const database = await read();
  const item = database.bounties.find((bounty) => bounty.id === id);
  if (item) {
    item.rewardMinor = rewardMinor;
    if (zone) item.zone = zone;
  } else database.bounties.push({ id, rewardMinor, zone });
  await write(database);
  return rewardMinor;
}
export async function listBounties() {
  return (await read()).bounties;
}
export async function exportSnapshot() {
  return await read();
}
export function storageStatus() {
  const sqlite = runtime.__eyeearnSqlite;
  return {
    backend: sqlite?.db ? "sqlite+json-snapshot" : "json-snapshot",
    sqliteAvailable: Boolean(sqlite?.db),
    sqliteError: sqlite?.error ?? null,
    writable: !process.env.VERCEL,
    snapshotFile: process.env.VERCEL
      ? "committed .data/phase2.json"
      : snapshotFile,
  };
}
