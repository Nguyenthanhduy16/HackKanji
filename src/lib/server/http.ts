import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function api(work: () => Promise<Response>) {
  try { return await work(); }
  catch (error) {
    if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      return json({ error: { code: "conflict", message: "The operation conflicted with another request. Retry safely with the same requestId." } }, 409);
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return json({ error: { code: "database_unavailable", message: "The database is unavailable." } }, 503);
    }
    // Do not serialize database URLs, statements, auth tokens, or stack traces.
    console.error("Backend request failed:", error instanceof Error ? error.name : "UnknownError");
    return json({ error: { code: "internal_error", message: "The request could not be completed." } }, 500);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.AUTH_URL || request.url).origin;
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "invalid_origin", "A same-origin request is required.");
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "invalid_content_type", "Use application/json.");
  }
  const limit = 32_768;
  if (Number(request.headers.get("content-length")) > limit) throw new ApiError(413, "body_too_large", "Request body is too large.");
  const reader = request.body?.getReader();
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          throw new ApiError(413, "body_too_large", "Request body is too large.");
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
  }
  let data: unknown;
  try { data = JSON.parse(text); }
  catch { throw new ApiError(400, "invalid_json", "Invalid JSON body."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ApiError(400, "invalid_body", "JSON body must be an object.");
  return data as Record<string, unknown>;
}

export function requireString(data: Record<string, unknown>, field: string, max = 100) {
  const value = data[field];
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new ApiError(400, "invalid_input", `${field} must be a non-empty string of at most ${max} characters.`);
  }
  return value;
}

export function allowFields(data: Record<string, unknown>, fields: string[]) {
  if (Object.keys(data).some((field) => !fields.includes(field))) {
    throw new ApiError(400, "invalid_input", "The request contains unsupported fields.");
  }
}

export function requestId(data: Record<string, unknown>) {
  const value = requireString(data, "requestId", 100);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(value)) throw new ApiError(400, "invalid_request_id", "requestId must contain 8–100 letters, digits, underscores or hyphens.");
  return value;
}
