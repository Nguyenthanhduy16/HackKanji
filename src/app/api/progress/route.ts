import {api, json} from '@/lib/server/http';
import {requireUser} from '@/lib/server/session';
import {readProgress, readProgressBody, saveProgress} from '@/lib/server/progress';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return api(async () => {const userId = await requireUser(request); return json({userId, snapshot: await readProgress(userId)});});
}
export async function PUT(request: Request) {
  return api(async () => {
    const userId = await requireUser(request);
    // Bind this action to the account displayed when the user confirmed it.
    if (request.headers.get('x-progress-owner') !== userId) return json({error: {code: 'account_changed', message: 'Account changed. Reload before saving.'}}, 409);
    const body = await readProgressBody(request);
    return json({userId, snapshot: await saveProgress(userId, body.version, body.data)});
  });
}
