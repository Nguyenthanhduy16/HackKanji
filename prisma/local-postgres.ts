import EmbeddedPostgres from "embedded-postgres";
import { mkdir, access, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:net";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Public, local-development credentials only. This listener is loopback-only.
export const localDatabaseUrl = (database = "nhaikanji") => `postgresql://nhaikanji:nhaikanji_dev_only@127.0.0.1:5434/${database}`;

export async function startLocalPostgres() {
  if (process.getuid?.() === 0) throw new Error("Run as an unprivileged user. This script never creates system users.");
  const local = resolve(projectRoot, ".local");
  const databaseDir = resolve(local, "postgres");
  const tempDir = resolve(local, "tmp");
  const socketDir = resolve(local, "postgres-socket");
  await mkdir(tempDir, { recursive: true, mode: 0o700 });
  await mkdir(socketDir, { recursive: true, mode: 0o700 });
  await writeFile(resolve(local, ".gitignore"), "*\n", { flag: "wx" }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
  process.env.TMPDIR = tempDir;
  await new Promise<void>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", () => reject(new Error("Port 5434 is already in use; no existing process was modified.")));
    server.listen(5434, "127.0.0.1", () => server.close(() => resolvePort()));
  });
  const pg = new EmbeddedPostgres({
    databaseDir, user: "nhaikanji", password: "nhaikanji_dev_only", port: 5434,
    authMethod: "scram-sha-256", persistent: true, createPostgresUser: false,
    autoRehydrateSymlinks: true, initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-h", "127.0.0.1", "-k", socketDir, "-c", "max_connections=30", "-c", "shared_buffers=32MB"],
    onLog: () => {}, onError: () => {},
  });
  try {
    await access(resolve(databaseDir, "PG_VERSION"));
  } catch { await pg.initialise(); }
  try {
    await pg.start();
    const client = pg.getPgClient("postgres", "127.0.0.1");
    await client.connect();
    try {
      const result = await client.query("SHOW listen_addresses");
      if (result.rows[0].listen_addresses !== "127.0.0.1") throw new Error("Unexpected database listen address");
      for (const database of ["nhaikanji", "nhaikanji_test"]) {
        const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
        if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${database}"`);
      }
      const version = await client.query("SHOW server_version");
      console.log(JSON.stringify({ postgres: "ready", version: version.rows[0].server_version, host: "127.0.0.1", port: 5434, data: ".local/postgres" }));
    } finally { await client.end(); }
    return pg;
  } catch (error) { await pg.stop(); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startLocalPostgres().catch((error) => {
    console.error(error instanceof Error ? error.message : "Local PostgreSQL failed to start");
    process.exitCode = 1;
  });
}
