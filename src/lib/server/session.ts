import { auth } from "@/auth";
import { authAvailability } from "./environment";
import { ApiError, assertSameOrigin } from "./http";

export async function requireUser(request?: Request) {
  if (request && request.method !== "GET") assertSameOrigin(request);
  if (!authAvailability().configured) {
    throw new ApiError(503, "auth_not_configured", "Server sign-in is not configured. Demo changes are saved only in this browser.");
  }
  const session = await auth();
  if (!session?.user?.id) throw new ApiError(401, "unauthorized", "Sign in to use your saved account.");
  // Ownership always comes from the verified database session, never the body.
  return session.user.id;
}
