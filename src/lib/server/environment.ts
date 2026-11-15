export type BackendEnvironment = Record<string, string | undefined>;

export function authAvailability(env: BackendEnvironment = process.env) {
  const databaseConfigured = Boolean(env.DATABASE_URL?.trim());
  const secret = env.AUTH_SECRET?.trim();
  const secretConfigured = Boolean(secret && secret.length >= 32 && !/generate-with|change-me|replace-me/i.test(secret));
  const providers: ("google" | "nodemailer")[] = [];
  if (databaseConfigured && secretConfigured) {
    if (env.AUTH_GOOGLE_ID?.trim() && env.AUTH_GOOGLE_SECRET?.trim()) providers.push("google");
    if (env.AUTH_EMAIL_SERVER?.trim() && env.AUTH_EMAIL_FROM?.trim()) providers.push("nodemailer");
  }
  return { configured: providers.length > 0, databaseConfigured, providers };
}
