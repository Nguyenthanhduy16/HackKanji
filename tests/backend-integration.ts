// Real PostgreSQL + HTTP checks. Run: npx tsx tests/backend-integration.ts
// Uses only the project-local test database; creates and removes its own users.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:net";
import { localDatabaseUrl, projectRoot } from "../prisma/local-postgres";
import { getDb } from "../src/lib/server/db";
import { checkIn, claimMission, claimMilestone, purchase, equip, completeSentence } from "../src/lib/server/gamification";
import { ApiError } from "../src/lib/server/http";
import { gamification } from "../src/lib/gamification/config";
import { localDateKey } from "../src/lib/gamification/logic";
import { seedManifest } from "../prisma/seed-data";

const databaseUrl = localDatabaseUrl("nhaikanji_test");
const parsed = new URL(databaseUrl);
assert.equal(parsed.hostname, "127.0.0.1");
assert.equal(parsed.port, "5434");
assert.equal(parsed.pathname, "/nhaikanji_test");
process.env.DATABASE_URL = databaseUrl;
const db = getDb();
const manifest = seedManifest();
const userIds: string[] = [];
const results: { name: string; passed: true }[] = [];
let server: ChildProcess | undefined;
const outputDir = resolve(projectRoot, ".local");
const reportPath = resolve(outputDir, "backend-verification.json");
const port = 3107;
const origin = `http://127.0.0.1:${port}`;

async function check(name: string, run: () => Promise<void>) {
  await run();
  results.push({ name, passed: true });
  console.log(`PASS ${name}`);
}

function runNode(args: string[]) {
  const child = spawnSync(process.execPath, args, { cwd: projectRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: "utf8" });
  if (child.status !== 0) throw new Error(`Local setup failed (${args.join(" ")}): ${(child.stderr || child.stdout).replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]")}`);
}

async function counts() {
  const [users, categories, lessons, sentences, words, shopItems, milestones, missions, grammar, exams, questions] = await Promise.all([
    db.user.count(), db.category.count(), db.lesson.count(), db.sentence.count(), db.word.count(), db.shopItem.count(),
    db.milestone.count(), db.mission.count(), db.grammarPoint.count(), db.exam.count(), db.question.count(),
  ]);
  return { users, categories, lessons, sentences, words, shopItems, milestones, missions, grammar, exams, questions };
}

async function createUser(data: { dango?: number; xp?: number; longestStreak?: number; freezeCards?: number } = {}) {
  const id = `backend_test_${randomUUID()}`;
  userIds.push(id);
  return db.user.create({ data: { id, name: "Backend integration fixture", email: `${id}@example.invalid`, isPublic: false, ...data } });
}

function assertSingleWinner(outcomes: PromiseSettledResult<unknown>[]) {
  assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
  const rejected = outcomes.find((result) => result.status === "rejected") as PromiseRejectedResult;
  assert.ok(rejected.reason instanceof ApiError);
  assert.equal(rejected.reason.status, 409);
}

async function startApiServer() {
  await new Promise<void>((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is already occupied; no existing server was modified`)));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolvePort()));
  });
  // Do not inherit real provider credentials. Values below are nonfunctional test
  // configuration, used solely to exercise Auth.js database-session lookup.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(AUTH_|NEXTAUTH_|DATABASE_URL$)/.test(key)));
  const log = createWriteStream(resolve(outputDir, "backend-api.log"), { flags: "w", mode: 0o600 });
  const child = spawn(process.execPath, ["--import", "tsx", "tests/backend-server.ts"], {
    cwd: projectRoot,
    env: { ...env, NODE_ENV: "development", DATABASE_URL: databaseUrl, AUTH_SECRET: randomBytes(48).toString("base64url"), AUTH_GOOGLE_ID: "backend-test-only.invalid", AUTH_GOOGLE_SECRET: "backend-test-only-never-a-real-provider", AUTH_EMAIL_SERVER: "", AUTH_EMAIL_FROM: "", NEXTAUTH_SECRET: "", NEXTAUTH_URL: "", AUTH_TRUST_HOST: "true", AUTH_URL: origin, NHAIKANJI_BUILD_DIR: ".local/backend-next", NHAI_BACKEND_TEST_SERVER: "1", NHAI_BACKEND_TEST_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server = child;
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on("error", () => {});
  child.once("close", () => log.end());
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Verification server exited; see .local/backend-api.log");
    try {
      const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        assert.equal(data.mode, "database");
        assert.equal(data.database, "ready");
        return;
      }
    } catch { /* readiness only */ }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error("Verification server did not become healthy; see .local/backend-api.log");
}

async function api(path: string, options: { method?: string; body?: unknown; token?: string; origin?: string; rawBody?: string } = {}) {
  const method = options.method || "GET";
  const response = await fetch(`${origin}${path}`, {
    method, headers: {
      ...(options.token ? { Cookie: `authjs.session-token=${options.token}` } : {}),
      ...(method !== "GET" ? { Origin: options.origin || origin, "Content-Type": "application/json" } : {}),
    },
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, JSON.stringify({ passed: false, status: "running", database: "127.0.0.1:5434/nhaikanji_test" }, null, 2));
  await db.$queryRaw`SELECT 1`;
  // A killed verification run may leave only its generated fixture users.
  // Restrict cleanup to this dedicated local test DB and the exact fixture identity.
  const leftovers = await db.user.findMany({where:{id:{startsWith:'backend_test_'},name:'Backend integration fixture',email:{endsWith:'@example.invalid'}},select:{id:true}});
  if(leftovers.length) {
    await db.user.deleteMany({where:{id:{in:leftovers.map(user=>user.id)}}});
    assert.equal(await db.user.count({where:{id:{in:leftovers.map(user=>user.id)}}}),0);
    console.log(`Cleaned ${leftovers.length} interrupted test fixtures in nhaikanji_test`);
  }
  runNode(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  runNode(["--import", "tsx", "prisma/seed.ts"]);
  const expected = { users: 21, categories: 5, lessons: 30, sentences: 90, words: 704, shopItems: 10, milestones: 10, missions: 4, grammar: 20, exams: 5, questions: 25 };
  await check("seed exact totals and one demo plus twenty ranking users", async () => {
    assert.deepEqual(await counts(), expected);
    assert.equal(await db.user.count({ where: { id: manifest.users[0].id } }), 1);
    assert.equal(await db.user.count({ where: { id: { in: manifest.users.slice(1).map((user) => user.id) } } }), 20);
  });
  await check("second seed preserves counts, identities, and existing user state", async () => {
    const beforeIds = await db.user.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    const demo = await db.user.findUniqueOrThrow({ where: { id: manifest.users[0].id } });
    const sentinel = await createUser({ dango: 137 });
    await db.user.update({ where: { id: demo.id }, data: { dango: demo.dango + 1 } });
    try {
      runNode(["--import", "tsx", "prisma/seed.ts"]);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: demo.id } })).dango, demo.dango + 1);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: sentinel.id } })).dango, 137);
      assert.deepEqual(await db.user.findMany({ where: { id: { not: sentinel.id } }, select: { id: true }, orderBy: { id: "asc" } }), beforeIds);
    } finally {
      await db.user.update({ where: { id: demo.id }, data: { dango: demo.dango } });
      await db.user.delete({ where: { id: sentinel.id } });
    }
    assert.deepEqual(await counts(), expected);
  });
  const freeze = manifest.shopItems.find((item) => item.type === "FREEZE")!;
  const cosmetic = manifest.shopItems.find((item) => item.type === "FRAME")!;
  const mission = manifest.missions.find((entry) => entry.key === "checkin")!;
  const milestone = manifest.milestones[0];
  await check("concurrent identical purchases debit once and return one receipt", async () => {
    const user = await createUser({ dango: 500 });
    const request = randomUUID();
    const outcomes = await Promise.all([purchase(user.id, freeze.id, request), purchase(user.id, freeze.id, request)]);
    assert.equal(outcomes.filter((entry) => !entry.replayed).length, 1);
    assert.equal(new Set(outcomes.map((entry) => entry.purchase.id)).size, 1);
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(after.dango, 500 - freeze.price);
    assert.equal(after.freezeCards, 1);
    assert.equal(await db.purchase.count({ where: { userId: user.id } }), 1);
    await assert.rejects(purchase(user.id, cosmetic.id, request), (error: unknown) => error instanceof ApiError && error.code === "request_id_reused");
  });
  await check("concurrent purchases cannot overdraw a one-item balance", async () => {
    const user = await createUser({ dango: freeze.price });
    assertSingleWinner(await Promise.allSettled([purchase(user.id, freeze.id, randomUUID()), purchase(user.id, freeze.id, randomUUID())]));
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(after.dango, 0);
    assert.equal(after.freezeCards, 1);
    assert.equal(await db.purchase.count({ where: { userId: user.id } }), 1);
  });
  await check("concurrent cosmetics retain one inventory item and one debit", async () => {
    const user = await createUser({ dango: 10_000 });
    assertSingleWinner(await Promise.allSettled([purchase(user.id, cosmetic.id, randomUUID()), purchase(user.id, cosmetic.id, randomUUID())]));
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).dango, 10_000 - cosmetic.price);
    assert.equal(await db.inventory.count({ where: { userId: user.id, itemId: cosmetic.id } }), 1);
    await equip(user.id, cosmetic.id);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).equippedFrameId, cosmetic.id);
  });
  await check("freeze cap rejects purchases without changing balance", async () => {
    const user = await createUser({ dango: 500, freezeCards: gamification.maxFreeze });
    await assert.rejects(purchase(user.id, freeze.id, randomUUID()), (error: unknown) => error instanceof ApiError && error.status === 409);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).dango, 500);
    assert.equal(await db.purchase.count({ where: { userId: user.id } }), 0);
  });
  await check("concurrent check-in and mission claims award exactly once", async () => {
    const user = await createUser({ dango: 0 });
    const now = new Date();
    const checked = await Promise.all([checkIn(user.id, now), checkIn(user.id, now)]);
    assert.equal(checked.filter((entry) => !entry.alreadyCheckedIn).length, 1);
    assertSingleWinner(await Promise.allSettled([claimMission(user.id, mission.id, now), claimMission(user.id, mission.id, now)]));
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(after.dango, gamification.checkInDango + mission.rewardDango);
    assert.equal(after.xp, mission.rewardXp);
    assert.equal(after.currentStreak, 1);
    const receipt = await db.userMission.findUniqueOrThrow({ where: { userId_missionId_date: { userId: user.id, missionId: mission.id, date: localDateKey(now, user.timezone) } } });
    assert.ok(receipt.claimedAt);
    assert.equal(await db.studyDay.count({ where: { userId: user.id } }), 1);
  });
  await check("concurrent milestone claims award once and retain one receipt", async () => {
    const user = await createUser({ dango: 0, longestStreak: milestone.threshold });
    assertSingleWinner(await Promise.allSettled([claimMilestone(user.id, milestone.id), claimMilestone(user.id, milestone.id)]));
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).dango, milestone.rewardDango);
    assert.equal(await db.userMilestone.count({ where: { userId: user.id, milestoneId: milestone.id } }), 1);
  });
  await check("incorrect answers award nothing; repeated sentences and completed lesson award once", async () => {
    const user = await createUser({ xp: 0 });
    const lesson = manifest.lessons[0];
    const first = lesson.sentences[0];
    const input = { lessonId: lesson.id, sentenceIndex: first.index, answer: first.textJa, durationSec: 30 };
    assert.equal((await completeSentence(user.id, { ...input, answer: "definitely wrong" })).correct, false);
    assert.equal(await db.studyEvent.count({ where: { userId: user.id } }), 0);
    const concurrent = await Promise.all([completeSentence(user.id, input), completeSentence(user.id, input)]);
    assert.equal(concurrent.reduce((sum, entry) => sum + entry.rewardXp, 0), gamification.sentenceXP);
    for (const sentence of lesson.sentences.slice(1)) await completeSentence(user.id, { ...input, sentenceIndex: sentence.index, answer: sentence.textJa });
    assert.equal((await completeSentence(user.id, input)).rewardXp, 0);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).xp, lesson.sentences.length * gamification.sentenceXP + gamification.lessonXP);
    assert.equal(await db.attempt.count({ where: { userId: user.id, lessonId: lesson.id } }), 1);
    assert.equal(await db.studyEvent.count({ where: { userId: user.id } }), lesson.sentences.length + 1);
    assert.equal((await db.progress.findFirstOrThrow({ where: { userId: user.id } })).status, "COMPLETED");
  });
  if (!process.argv.includes("--skip-api")) {
    console.log("Starting isolated HTTP verification server...");
    await startApiServer();
    await check("public APIs read actual database rows", async () => {
      const lessons = await api("/api/lessons");
      assert.equal(lessons.status, 200);
      assert.equal(lessons.body.mode, "database");
      assert.equal(lessons.body.total, 30);
      assert.equal(lessons.body.lessons.length, 30);
      const shop = await api("/api/shop");
      assert.equal(shop.status, 200);
      assert.equal(shop.body.items.length, 10);
      const ranking = await api("/api/leaderboard?period=allTime&metric=xp");
      assert.equal(ranking.status, 200);
      assert.equal(ranking.body.entries.length, 20);
      assert.ok(ranking.body.entries.every((entry: { id: string }) => entry.id.startsWith("nhai_seed_")));
    });
    const user = await createUser({ dango: 500 });
    const other = await createUser({ dango: 123 });
    const token = randomBytes(32).toString("hex");
    const expiredToken = randomBytes(32).toString("hex");
    await db.session.createMany({ data: [
      { sessionToken: token, userId: user.id, expires: new Date(Date.now() + 600_000) },
      { sessionToken: expiredToken, userId: user.id, expires: new Date(Date.now() - 1000) },
    ] });
    await check("database sessions enforce authentication, expiry, and private profile", async () => {
      assert.equal((await api("/api/me")).status, 401);
      assert.equal((await api("/api/me", { token: randomBytes(32).toString("hex") })).status, 401);
      assert.equal((await api("/api/me", { token: expiredToken })).status, 401);
      const me = await api("/api/me", { token });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.id, user.id);
      assert.equal("email" in me.body.user, false);
      assert.equal("accounts" in me.body.user, false);
      assert.equal("sessionToken" in me.body.user, false);
      const dashboard = await api("/api/dashboard", { token });
      assert.equal(dashboard.status, 200);
      assert.equal(dashboard.body.user.id, user.id);
    });
    await check("HTTP mutations reject cross-origin, malformed JSON and spoofed ownership", async () => {
      assert.equal((await api("/api/checkin", { token, method: "POST", origin: "http://attacker.invalid" })).status, 403);
      assert.equal((await api("/api/shop/purchase", { token, method: "POST", rawBody: "{" })).status, 400);
      assert.equal((await api("/api/shop/purchase", { token, method: "POST", body: { itemId: freeze.id, requestId: randomUUID(), userId: other.id } })).status, 400);
      assert.equal((await api("/api/shop/purchase", { token, method: "POST", body: { itemId: freeze.id, requestId: "short" } })).status, 400);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).dango, 500);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: other.id } })).dango, 123);
    });
    await check("concurrent authenticated HTTP purchases debit the session owner once", async () => {
      const body = { itemId: freeze.id, requestId: randomUUID() };
      const outcomes = await Promise.all([api("/api/shop/purchase", { token, method: "POST", body }), api("/api/shop/purchase", { token, method: "POST", body })]);
      assert.deepEqual(outcomes.map((entry) => entry.status), [200, 200]);
      assert.equal(outcomes.filter((entry) => !entry.body.replayed).length, 1);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).dango, 500 - freeze.price);
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: other.id } })).dango, 123);
      assert.equal(await db.purchase.count({ where: { userId: user.id } }), 1);
    });
    await check("authenticated check-in and concurrent mission HTTP claims persist one reward", async () => {
      assert.equal((await api("/api/checkin", { token, method: "POST" })).status, 200);
      const claims = await Promise.all([api(`/api/missions/${mission.id}/claim`, { token, method: "POST" }), api(`/api/missions/${mission.id}/claim`, { token, method: "POST" })]);
      assert.deepEqual(claims.map((entry) => entry.status).sort(), [200, 409]);
      const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      assert.equal(after.xp, mission.rewardXp);
      assert.equal(after.dango, 500 - freeze.price + gamification.checkInDango + mission.rewardDango);
    });
    await check("deleted database session loses access immediately", async () => {
      await db.session.deleteMany({ where: { userId: user.id } });
      assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
      assert.equal((await api("/api/me", { token })).status, 401);
    });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  assert.equal(await db.user.count({ where: { id: { in: userIds } } }), 0);
  assert.deepEqual(await counts(), expected);
  const report = { passed: true, checks: results.length, database: "127.0.0.1:5434/nhaikanji_test", seedCounts: await counts(), results, cleanupVerified: true, apiTested: !process.argv.includes("--skip-api"), oauthTested: false, externalEmailSent: false, completedAt: new Date().toISOString() };
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]") : "Unknown error";
  await writeFile(reportPath, JSON.stringify({ passed: false, checks: results, error: message }, null, 2));
  console.error(message);
  process.exitCode = 1;
}).finally(async () => {
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    const timer = setTimeout(() => server?.kill("SIGKILL"), 5000);
    await stopped;
    clearTimeout(timer);
  }
  try { await db.user.deleteMany({ where: { id: { in: userIds } } }); }
  finally { await db.$disconnect(); }
});
