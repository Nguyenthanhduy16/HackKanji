import { getDb } from "@/lib/server/db";
import { profileSelect } from "@/lib/server/gamification";
import { api, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return api(async () => {
    const userId = await requireUser();
    return json({ user: await getDb().user.findUniqueOrThrow({ where: { id: userId }, select: profileSelect }) });
  });
}
