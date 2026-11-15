import assert from "node:assert/strict";
import test from "node:test";
import { levelProgress, localDateKey, advanceStreak, claimEligibility, purchaseEligibility } from "../src/lib/gamification/logic";
import { authAvailability } from "../src/lib/server/environment";
import { assertSameOrigin, readJson, requireString } from "../src/lib/server/http";

test("level progress follows the shared cumulative XP curve at its boundaries", () => {
  assert.deepEqual(levelProgress(50), { level: 1, xp: 50, nextLevelXP: 138, remainingXP: 88 });
  assert.deepEqual(levelProgress(138), { level: 2, xp: 138, nextLevelXP: 226, remainingXP: 88 });
  assert.deepEqual(levelProgress(226), { level: 3, xp: 226, nextLevelXP: 314, remainingXP: 88 });
  assert.throws(() => levelProgress(-1), /XP/);
  assert.throws(() => levelProgress(Number.POSITIVE_INFINITY), /XP/);
});

test("calendar boundaries use the stored user timezone, including DST", () => {
  const instant = new Date("2026-11-14T17:00:00Z");
  assert.equal(localDateKey(instant, "Asia/Ho_Chi_Minh"), "2026-11-15");
  assert.equal(localDateKey(instant, "America/Los_Angeles"), "2026-11-14");
  assert.equal(localDateKey(new Date("2026-03-08T09:59:59Z"), "America/Los_Angeles"), "2026-03-08");
  assert.equal(localDateKey(new Date("2026-03-08T10:00:00Z"), "America/Los_Angeles"), "2026-03-08");
  assert.throws(() => localDateKey(instant, "not-a-timezone"), /timezone/);
});

test("streak increments once per date and freeze cards cover only missed dates", () => {
  const state = { currentStreak: 5, longestStreak: 7, freezeCards: 2, lastStudyDate: "2026-11-12" };
  assert.deepEqual(advanceStreak(state, "2026-11-15"), {
    currentStreak: 8, longestStreak: 8, freezeCards: 0, lastStudyDate: "2026-11-15",
    frozenDates: ["2026-11-13", "2026-11-14"], changed: true,
  });
  const same = advanceStreak(state, "2026-11-12");
  assert.equal(same.currentStreak, 5);
  assert.equal(same.changed, false);
  assert.deepEqual(same.frozenDates, []);
  const expired = advanceStreak({ ...state, freezeCards: 1 }, "2026-11-15");
  assert.equal(expired.currentStreak, 1);
  assert.equal(expired.longestStreak, 7);
  assert.equal(expired.freezeCards, 0);
  assert.deepEqual(expired.frozenDates, ["2026-11-13"]);
  assert.equal(advanceStreak({ ...state, lastStudyDate: null }, "2026-11-15").currentStreak, 1);
  assert.throws(() => advanceStreak(state, "2026-11-11"), /earlier/);
});

test("claim eligibility rejects duplicate, incomplete, and previous-day mission claims", () => {
  assert.equal(claimEligibility({ progress: 3, target: 3, claimedAt: null }), "ready");
  assert.equal(claimEligibility({ progress: 3, target: 3, claimedAt: new Date() }), "claimed");
  assert.equal(claimEligibility({ progress: 2, target: 3, claimedAt: null }), "locked");
  assert.equal(claimEligibility({ progress: 3, target: 3, claimedAt: null, date: "2026-11-14", today: "2026-11-15" }), "expired");
});

test("shop rules reject overspending, duplicate cosmetics, and freeze overflow", () => {
  const state = { balance: 50, price: 50, type: "FRAME" as const, owned: false, freezeCards: 0 };
  assert.equal(purchaseEligibility(state), "ready");
  assert.equal(purchaseEligibility({ ...state, balance: 49 }), "insufficient_funds");
  assert.equal(purchaseEligibility({ ...state, owned: true }), "owned");
  assert.equal(purchaseEligibility({ ...state, type: "FREEZE", freezeCards: 7 }), "freeze_limit");
  assert.equal(purchaseEligibility({ ...state, price: -1 }), "invalid_price");
});

test("auth stays unavailable without complete configuration and exposes only public provider names", () => {
  assert.deepEqual(authAvailability({}), { configured: false, databaseConfigured: false, providers: [] });
  const env = { DATABASE_URL: "postgresql://example.invalid/demo", AUTH_SECRET: "x".repeat(32), AUTH_GOOGLE_ID: "example", AUTH_GOOGLE_SECRET: "test-value" };
  assert.deepEqual(authAvailability(env), { configured: true, databaseConfigured: true, providers: ["google"] });
  assert.equal(authAvailability({ ...env, AUTH_SECRET: "generate-with-openssl-rand-base64-32" }).configured, false);
  assert.deepEqual(authAvailability({ ...env, AUTH_EMAIL_SERVER: "smtp://example.invalid", AUTH_EMAIL_FROM: "demo@example.invalid" }).providers, ["google", "nodemailer"]);
});

test("mutation guard rejects foreign origins and JSON parser rejects invalid bodies", async () => {
  const url = "https://demo.example/api/checkin";
  assert.doesNotThrow(() => assertSameOrigin(new Request(url, { method: "POST", headers: { origin: "https://demo.example" } })));
  assert.throws(() => assertSameOrigin(new Request(url, { method: "POST", headers: { origin: "https://evil.example" } })), /origin/i);
  assert.throws(() => assertSameOrigin(new Request(url, { method: "POST" })), /origin/i);
  await assert.rejects(readJson(new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: "[]" })), /object/);
  await assert.rejects(readJson(new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{broken" })), /JSON/);
  assert.throws(() => requireString({ itemId: 5 }, "itemId"), /itemId/);
  assert.equal(requireString({ itemId: "frame-sakura" }, "itemId"), "frame-sakura");
});

test("seed manifest contains the requested deterministic graph with no orphaned words", async () => {
  const { seedManifest } = await import("../prisma/seed-data");
  const data = seedManifest();
  assert.equal(data.users.length, 21);
  assert.equal(new Set(data.users.map((user) => user.id)).size, 21);
  assert.equal(data.categories.length, 5);
  assert.equal(data.lessons.length, 30);
  assert.equal(data.shopItems.length, 10);
  assert.equal(data.milestones.length, 10);
  assert.equal(data.missions.length, 4);
  assert.equal(new Set(data.lessons.map((lesson) => lesson.jlptLevel)).size, 5);
  for (const lesson of data.lessons) {
    assert.ok(data.categories.some((category) => category.id === lesson.categoryId));
    assert.ok(lesson.sentences.length >= 3);
    assert.ok(lesson.sentences.every((sentence) => sentence.words.length > 0 && sentence.endMs > sentence.startMs));
  }
  assert.ok(data.users.every((user) => user.id.startsWith("nhai_seed_") && user.email.endsWith("@example.invalid")));
});

test("public API returns explicit offline mode and filtered original lessons without configuration", async () => {
  const old = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const { GET: health } = await import("../src/app/api/health/route");
    const { GET: listLessons } = await import("../src/app/api/lessons/route");
    const status = await health();
    assert.equal(status.status, 200);
    assert.equal((await status.json()).mode, "demo");
    const response = await listLessons(new Request("http://localhost/api/lessons?level=N5&limit=2"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.mode, "demo");
    assert.equal(payload.lessons.length, 2);
    assert.ok(payload.lessons.every((lesson: { jlptLevel: string }) => lesson.jlptLevel === "N5"));
    const invalid = await listLessons(new Request("http://localhost/api/lessons?level=N9"));
    assert.equal(invalid.status, 400);
  } finally {
    if (old === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = old;
  }
});

test("server mutations cannot authenticate a caller by a supplied userId in demo mode", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const { POST } = await import("../src/app/api/shop/purchase/route");
    const response = await POST(new Request("http://localhost/api/shop/purchase", {
      method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ userId: "nhai_seed_demo", itemId: "nhai_seed_freeze", requestId: "attempt-123" }),
    }));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "auth_not_configured");
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
