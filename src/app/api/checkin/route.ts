import { checkIn } from "@/lib/server/gamification";
import { api, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => json(await checkIn(await requireUser(request))));
}
