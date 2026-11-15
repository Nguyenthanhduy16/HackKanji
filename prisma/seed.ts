import { Prisma, PrismaClient } from "@prisma/client";
import { seedManifest } from "./seed-data";
import { demoLearners, seedDate, seedId, seedPrefix } from "@/lib/server/demo";

const manifest = seedManifest();

function counts() {
  return {
    users: manifest.users.length, categories: manifest.categories.length, lessons: manifest.lessons.length,
    sentences: manifest.lessons.reduce((sum, lesson) => sum + lesson.sentences.length, 0),
    words: manifest.lessons.reduce((sum, lesson) => sum + lesson.sentences.reduce((count, sentence) => count + sentence.words.length, 0), 0),
    shopItems: manifest.shopItems.length, milestones: manifest.milestones.length, missions: manifest.missions.length,
    grammar: manifest.grammar.length, exams: manifest.exams.length, questions: manifest.exams.reduce((sum, exam) => sum + exam.questions.length, 0),
  };
}

async function seed() {
  const expected = counts();
  if (expected.users !== 21 || expected.categories !== 5 || expected.lessons !== 30 || expected.shopItems !== 10 || expected.milestones !== 10 || expected.missions !== 4) {
    throw new Error("Seed source counts do not match the specification");
  }
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify({ dryRun: true, prefix: seedPrefix, counts: expected }, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before running the database seed");
  const db = new PrismaClient({ log: [] });
  try {
    await db.$transaction(async (tx) => {
      // Never delete tables or match arbitrary real-user records. Reserved IDs and
      // example.invalid mailboxes keep the fixture namespace separate from auth.
      for (const user of manifest.users) {
        await tx.user.upsert({ where: { id: user.id }, create: user, update: {} });
      }
      for (const category of manifest.categories) {
        await tx.category.upsert({ where: { id: category.id }, create: category, update: category });
      }
      for (const lesson of manifest.lessons) {
        const { sentences, ...row } = lesson;
        await tx.lesson.upsert({ where: { id: row.id }, create: row, update: row });
        for (const sentence of sentences) {
          const { words, ...sentenceRow } = sentence;
          const data = { ...sentenceRow, lessonId: lesson.id };
          await tx.sentence.upsert({ where: { id: data.id }, create: data, update: data });
          for (const word of words) {
            const wordRow = { ...word, sentenceId: sentence.id };
            await tx.word.upsert({ where: { id: word.id }, create: wordRow, update: wordRow });
          }
        }
      }
      for (const item of manifest.shopItems) await tx.shopItem.upsert({ where: { id: item.id }, create: item, update: item });
      for (const milestone of manifest.milestones) await tx.milestone.upsert({ where: { id: milestone.id }, create: milestone, update: milestone });
      for (const mission of manifest.missions) await tx.mission.upsert({ where: { id: mission.id }, create: mission, update: mission });
      for (const grammar of manifest.grammar) await tx.grammarPoint.upsert({ where: { id: grammar.id }, create: grammar, update: grammar });
      for (const exam of manifest.exams) {
        const { questions, ...data } = exam;
        await tx.exam.upsert({ where: { id: data.id }, create: data, update: data });
        for (const question of questions) {
          const row = { ...question, examId: exam.id };
          await tx.question.upsert({ where: { id: row.id }, create: row, update: row });
        }
      }
      for (const learner of demoLearners) {
        const data = { userId: learner.id, date: seedDate, minutes: learner.minutes, seconds: learner.minutes * 60, xp: learner.xp, lessons: learner.lessons, checkedIn: true };
        await tx.studyDay.upsert({ where: { userId_date: { userId: learner.id, date: seedDate } }, create: data, update: {} });
      }
      await tx.studyDay.upsert({
        where: { userId_date: { userId: seedId("demo"), date: seedDate } },
        create: { userId: seedId("demo"), date: seedDate, checkedIn: true, xp: 50 }, update: {},
      });
      for (const mission of manifest.missions) {
        await tx.userMission.upsert({
          where: { userId_missionId_date: { userId: seedId("demo"), missionId: mission.id, date: seedDate } },
          create: { userId: seedId("demo"), missionId: mission.id, date: seedDate }, update: {},
        });
      }
    }, { maxWait: 10_000, timeout: 120_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Read back the exact seeded IDs; counts elsewhere in the database are irrelevant.
    const actual = {
      users: await db.user.count({ where: { id: { in: manifest.users.map((row) => row.id) } } }),
      categories: await db.category.count({ where: { id: { in: manifest.categories.map((row) => row.id) } } }),
      lessons: await db.lesson.count({ where: { id: { in: manifest.lessons.map((row) => row.id) } } }),
      sentences: await db.sentence.count({ where: { id: { in: manifest.lessons.flatMap((row) => row.sentences.map((sentence) => sentence.id)) } } }),
      words: await db.word.count({ where: { id: { in: manifest.lessons.flatMap((row) => row.sentences.flatMap((sentence) => sentence.words.map((word) => word.id))) } } }),
      shopItems: await db.shopItem.count({ where: { id: { in: manifest.shopItems.map((row) => row.id) } } }),
      milestones: await db.milestone.count({ where: { id: { in: manifest.milestones.map((row) => row.id) } } }),
      missions: await db.mission.count({ where: { id: { in: manifest.missions.map((row) => row.id) } } }),
      grammar: await db.grammarPoint.count({ where: { id: { in: manifest.grammar.map((row) => row.id) } } }),
      exams: await db.exam.count({ where: { id: { in: manifest.exams.map((row) => row.id) } } }),
      questions: await db.question.count({ where: { id: { in: manifest.exams.flatMap((row) => row.questions.map((question) => question.id)) } } }),
    };
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Seed read-back verification failed");
    console.log(JSON.stringify({ seeded: true, verified: true, prefix: seedPrefix, counts: actual }, null, 2));
  } finally { await db.$disconnect(); }
}

seed().catch((error) => {
  console.error("Seed failed:", error instanceof Prisma.PrismaClientKnownRequestError ? error.code : error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]") : "Unknown error");
  process.exitCode = 1;
});
