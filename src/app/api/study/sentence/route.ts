import { completeSentence } from "@/lib/server/gamification";
import { allowFields, api, ApiError, json, readJson, requireString } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => {
    const userId = await requireUser(request);
    const body = await readJson(request);
    allowFields(body, ["lessonId", "sentenceIndex", "answer", "durationSec"]);
    const { sentenceIndex, durationSec } = body;
    if (typeof sentenceIndex !== "number" || !Number.isSafeInteger(sentenceIndex) || sentenceIndex < 0 ||
        typeof durationSec !== "number" || !Number.isSafeInteger(durationSec) || durationSec < 1 || durationSec > 900) {
      throw new ApiError(400, "invalid_input", "Use a non-negative sentenceIndex and durationSec from 1 to 900.");
    }
    return json(await completeSentence(userId, {
      lessonId: requireString(body, "lessonId"), answer: requireString(body, "answer", 5000), sentenceIndex, durationSec,
    }));
  });
}
