import { getDb } from "@/lib/server/db";
import { demoShopItems } from "@/lib/server/demo";
import { api, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return api(async () => json({
    mode: process.env.DATABASE_URL ? "database" : "demo",
    items: process.env.DATABASE_URL ? await getDb().shopItem.findMany({ where: { active: true }, orderBy: [{ price: "asc" }, { id: "asc" }] }) : demoShopItems,
  }));
}
