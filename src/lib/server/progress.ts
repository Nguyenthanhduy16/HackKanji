import {Prisma} from '@prisma/client';
import {parseProgressData, MAX_PROGRESS_BYTES} from '../account-data';
import {getDb} from './db';
import {ApiError} from './http';

export async function readProgress(userId: string) {
  return getDb().progressSnapshot.findUnique({where: {userId}, select: {version: true, data: true, updatedAt: true}});
}
export async function saveProgress(userId: string, version: number, input: unknown) {
  if (!Number.isSafeInteger(version) || version < 0 || version >= 2_147_483_647) throw new ApiError(400, 'invalid_version', 'Invalid snapshot version.');
  let data;
  try {data = parseProgressData(input);} catch {throw new ApiError(400, 'invalid_progress', 'Invalid study backup.');}
  const conflict = () => new ApiError(409, 'version_conflict', 'Your account backup changed. Retrieve it or explicitly keep your local copy.');
  try {
    return await getDb().$transaction(async tx => {
      if (version === 0) return tx.progressSnapshot.create({data: {userId, version: 1, data: data as unknown as Prisma.InputJsonValue}, select: {version: true, data: true, updatedAt: true}});
      const result = await tx.progressSnapshot.updateMany({where: {userId, version}, data: {data: data as unknown as Prisma.InputJsonValue, version: {increment: 1}}});
      if (result.count !== 1) throw conflict();
      return tx.progressSnapshot.findUniqueOrThrow({where: {userId}, select: {version: true, data: true, updatedAt: true}});
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) throw conflict();
    throw error;
  }
}
export async function readProgressBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'invalid_content_type', 'Use application/json.');
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (Number(request.headers.get('content-length')) > MAX_PROGRESS_BYTES) throw new ApiError(413, 'body_too_large', 'Backup exceeds 1 MB.');
  try {
    if (reader) while (true) {
      const {value, done} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_PROGRESS_BYTES) {await reader.cancel(); throw new ApiError(413, 'body_too_large', 'Backup exceeds 1 MB.');}
      chunks.push(value);
    }
  } finally {reader?.releaseLock();}
  let body;
  try {const bytes = new Uint8Array(size); let at = 0; for (const chunk of chunks) {bytes.set(chunk, at); at += chunk.length;} body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));} catch {throw new ApiError(400, 'invalid_json', 'Invalid JSON.');}
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 2 || !Object.hasOwn(body, 'version') || !Object.hasOwn(body, 'data')) throw new ApiError(400, 'invalid_body', 'Only version and data are accepted.');
  return body as {version: number; data: unknown};
}
