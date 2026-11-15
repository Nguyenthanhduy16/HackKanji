import { claimMission } from "@/lib/server/gamification";
import { api, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const userId = await requireUser(request);
    return json(await claimMission(userId, (await context.params).id));
  });
}
