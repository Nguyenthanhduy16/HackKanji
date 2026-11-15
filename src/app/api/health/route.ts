import { getDb } from "@/lib/server/db";
import { authAvailability } from "@/lib/server/environment";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { databaseConfigured, configured } = authAvailability();
  if (!databaseConfigured) return json({ status: "ok", mode: "demo", database: "not_configured", authConfigured: false });
  try {
    await getDb().$queryRaw`SELECT 1`;
    return json({ status: "ok", mode: "database", database: "ready", authConfigured: configured });
  } catch {
    return json({ status: "degraded", mode: "database", database: "unavailable", authConfigured: configured }, 503);
  }
}
