import { getDb } from "@/lib/server/db";
import { demoExams } from "@/lib/server/demo";
import { api, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return api(async () => {
    const exams = process.env.DATABASE_URL
      ? await getDb().exam.findMany({ select: { id: true, title: true, jlptLevel: true, durationSec: true, passPercent: true, _count: { select: { questions: true } } }, orderBy: { jlptLevel: "asc" } })
      : demoExams.map(({ questions, ...exam }) => ({ ...exam, _count: { questions: questions.length } }));
    return json({ mode: process.env.DATABASE_URL ? "database" : "demo", exams });
  });
}
