import { authAvailability } from "@/lib/server/environment";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const availability = authAvailability();
  return json({ ...availability, mode: availability.databaseConfigured ? "database" : "demo", demoPersistence: "browser-only" });
}
