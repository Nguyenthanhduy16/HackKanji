import { equip } from "@/lib/server/gamification";
import { allowFields, api, json, readJson, requireString } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    allowFields(body, ["itemId"]);
    return json({ user: await equip(userId, requireString(body, "itemId")) });
  });
}
