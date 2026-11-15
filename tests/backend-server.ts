// Private verification server: no OAuth callback or email send is exercised.
import next from "next";
import { createServer } from "node:http";
import { projectRoot } from "../prisma/local-postgres";

async function main() {
  if (process.env.NHAI_BACKEND_TEST_SERVER !== "1") throw new Error("Only the backend integration runner may launch this server");
  const port = Number(process.env.NHAI_BACKEND_TEST_PORT || 3107);
  const app = next({
    dev: true, dir: projectRoot, hostname: "127.0.0.1", port,
    conf: { distDir: ".local/backend-next", experimental: { cpus: 2 }, devIndicators: false },
  });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = createServer((request, response) => { void handler(request, response); });
  server.listen(port, "127.0.0.1", () => console.log(`Backend verification server listening on 127.0.0.1:${port}`));
  const stop = async () => {
    server.close();
    await app.close();
    process.exit(0);
  };
  process.once("SIGTERM", () => { void stop(); });
  process.once("SIGINT", () => { void stop(); });
}

main().catch((error: unknown) => {
  console.error("Backend verification server failed:", error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
});
