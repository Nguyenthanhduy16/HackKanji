import { handlers } from "@/auth";
import { authAvailability } from "@/lib/server/environment";
import { json } from "@/lib/server/http";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unavailable() {
  return json({ error: { code: "auth_not_configured", message: "Sign-in is unavailable until a database and an authentication provider are configured." } }, 503);
}

export async function GET(request: NextRequest) {
  return authAvailability().configured ? handlers.GET(request) : unavailable();
}

export async function POST(request: NextRequest) {
  return authAvailability().configured ? handlers.POST(request) : unavailable();
}
