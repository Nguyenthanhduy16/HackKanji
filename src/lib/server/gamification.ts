import { Prisma, type User } from "@prisma/client";
import { toHiragana } from "wanakana";
import { gamification } from "@/lib/gamification/config";
import { advanceStreak, claimEligibility, levelProgress, localDateKey, purchaseEligibility } from "@/lib/gamification/logic";
import { getDb, transaction } from "./db";
import { ApiError } from "./http";

export const profileSelect = {
  id: true, name: true, image: true, avatarUrl: true, locale: true, timezone: true,
  xp: true, level: true, dango: true, currentStreak: true, longestStreak: true,
  lastCheckInAt: true, lastStudyDate: true, freezeCards: true,
  equippedFrameId: true, equippedWallpaperId: true, isPublic: true, isPremium: true,
} satisfies Prisma.UserSelect;

type Tx = Prisma.TransactionClient;

async function userOrFail(tx: Tx, userId: string) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "unauthorized", "Your account no longer exists.");
  return user;
}

function publicProfile(user: User) {
  return Object.fromEntries(Object.keys(profileSelect).map((key) => [key, user[key as keyof User]]));
}

async function calendar(tx: Tx, user: User, now: Date) {
  const today = localDateKey(now, user.timezone);
  const next = advanceStreak(user, today);
  for (const date of next.frozenDates) {
    await tx.studyDay.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: { userId: user.id, date, usedFreeze: true },
      update: { usedFreeze: true },
    });
  }
  const { frozenDates: _frozen, changed: _changed, ...streak } = next;
  const updated = await tx.user.update({ where: { id: user.id }, data: streak });
  await tx.studyDay.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today }, update: {},
  });
  return { today, user: updated };
}

async function incrementMissions(tx: Tx, userId: string, date: string, changes: Record<string, number>) {
  const missions = await tx.mission.findMany({ where: { key: { in: Object.keys(changes) } } });
  for (const mission of missions) {
    const amount = changes[mission.key];
    if (amount <= 0) continue;
    const where = { userId_missionId_date: { userId, missionId: mission.id, date } };
    const existing = await tx.userMission.findUnique({ where });
    await tx.userMission.upsert({
      where,
      create: { userId, missionId: mission.id, date, progress: Math.min(amount, mission.target) },
      update: { progress: Math.min(mission.target, (existing?.progress ?? 0) + amount) },
    });
  }
}

export async function checkIn(userId: string, now = new Date()) {
  return transaction(async (tx) => {
    const user = await userOrFail(tx, userId);
    const today = localDateKey(now, user.timezone);
    const existing = await tx.studyDay.findUnique({ where: { userId_date: { userId, date: today } } });
    if (existing?.checkedIn) return { alreadyCheckedIn: true, rewardDango: 0, user: publicProfile(user) };
    await calendar(tx, user, now);
    await tx.studyDay.update({ where: { userId_date: { userId, date: today } }, data: { checkedIn: true } });
    const updated = await tx.user.update({
      where: { id: userId }, data: { lastCheckInAt: now, dango: { increment: gamification.checkInDango } }, select: profileSelect,
    });
    await incrementMissions(tx, userId, today, { checkin: 1 });
    return { alreadyCheckedIn: false, rewardDango: gamification.checkInDango, user: updated };
  });
}

export async function claimMission(userId: string, missionId: string, now = new Date()) {
  return transaction(async (tx) => {
    const user = await userOrFail(tx, userId);
    const date = localDateKey(now, user.timezone);
    const mission = await tx.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new ApiError(404, "not_found", "Mission not found.");
    const entry = await tx.userMission.findUnique({ where: { userId_missionId_date: { userId, missionId, date } } });
    const state = claimEligibility({ progress: entry?.progress ?? 0, target: mission.target, claimedAt: entry?.claimedAt ?? null, date, today: date });
    if (state !== "ready") throw new ApiError(409, `mission_${state}`, "This mission cannot be claimed.");
    const changed = await tx.userMission.updateMany({
      where: { userId, missionId, date, claimedAt: null, progress: { gte: mission.target } }, data: { claimedAt: now },
    });
    if (changed.count !== 1) throw new ApiError(409, "already_claimed", "This mission has already been claimed.");
    const xp = user.xp + mission.rewardXp;
    const updated = await tx.user.update({
      where: { id: userId }, data: { xp, level: levelProgress(xp).level, dango: { increment: mission.rewardDango } }, select: profileSelect,
    });
    await tx.studyDay.upsert({
      where: { userId_date: { userId, date } }, create: { userId, date, xp: mission.rewardXp }, update: { xp: { increment: mission.rewardXp } },
    });
    return { claimed: true, rewardXp: mission.rewardXp, rewardDango: mission.rewardDango, user: updated };
  });
}

export async function claimMilestone(userId: string, milestoneId: string) {
  return transaction(async (tx) => {
    const user = await userOrFail(tx, userId);
    const milestone = await tx.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) throw new ApiError(404, "not_found", "Milestone not found.");
    const existing = await tx.userMilestone.findUnique({ where: { userId_milestoneId: { userId, milestoneId } } });
    const progress = milestone.type === "STREAK" ? user.longestStreak : levelProgress(user.xp).level;
    const state = claimEligibility({ progress, target: milestone.threshold, claimedAt: existing?.claimedAt ?? null });
    if (state !== "ready") throw new ApiError(409, `milestone_${state}`, "This milestone cannot be claimed.");
    await tx.userMilestone.create({ data: { userId, milestoneId } });
    for (const itemId of milestone.rewardItemIds) {
      const item = await tx.shopItem.findUnique({ where: { id: itemId } });
      if (!item || item.type === "FREEZE") throw new ApiError(409, "invalid_reward", "The milestone reward is unavailable.");
      await tx.inventory.upsert({ where: { userId_itemId: { userId, itemId } }, create: { userId, itemId }, update: {} });
    }
    const rewardFreeze = Math.min(milestone.rewardFreeze, Math.max(0, gamification.maxFreeze - user.freezeCards));
    const updated = await tx.user.update({
      where: { id: userId }, data: { dango: { increment: milestone.rewardDango }, freezeCards: { increment: rewardFreeze } }, select: profileSelect,
    });
    return { claimed: true, rewardDango: milestone.rewardDango, rewardFreeze, user: updated };
  });
}

export async function purchase(userId: string, itemId: string, requestId: string) {
  return transaction(async (tx) => {
    const user = await userOrFail(tx, userId);
    const prior = await tx.purchase.findUnique({ where: { userId_requestId: { userId, requestId } } });
    if (prior) {
      if (prior.itemId !== itemId) throw new ApiError(409, "request_id_reused", "requestId already belongs to another purchase.");
      return { replayed: true, purchase: prior, user: publicProfile(user) };
    }
    const item = await tx.shopItem.findUnique({ where: { id: itemId } });
    if (!item?.active) throw new ApiError(404, "not_found", "Shop item not found.");
    const owned = await tx.inventory.findUnique({ where: { userId_itemId: { userId, itemId } } });
    const state = purchaseEligibility({ balance: user.dango, price: item.price, type: item.type, owned: Boolean(owned?.quantity), freezeCards: user.freezeCards });
    if (state !== "ready") throw new ApiError(409, state, "This item cannot be purchased.");
    // Conditional debit is a second safeguard against negative balances.
    const debited = await tx.user.updateMany({
      where: { id: userId, dango: { gte: item.price }, ...(item.type === "FREEZE" ? { freezeCards: { lt: gamification.maxFreeze } } : {}) },
      data: { dango: { decrement: item.price }, ...(item.type === "FREEZE" ? { freezeCards: { increment: 1 } } : {}) },
    });
    if (debited.count !== 1) throw new ApiError(409, "balance_changed", "Your balance or inventory changed. Try again.");
    if (item.type !== "FREEZE") await tx.inventory.create({ data: { userId, itemId } });
    const receipt = await tx.purchase.create({ data: { userId, itemId, requestId, price: item.price } });
    const updated = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: profileSelect });
    return { replayed: false, purchase: receipt, user: updated };
  });
}

export async function equip(userId: string, itemId: string) {
  return transaction(async (tx) => {
    const owned = await tx.inventory.findUnique({ where: { userId_itemId: { userId, itemId } }, include: { item: true } });
    if (!owned || owned.quantity < 1) throw new ApiError(403, "not_owned", "You do not own this item.");
    if (owned.item.type === "FREEZE") throw new ApiError(400, "not_equippable", "Freeze cards are used automatically.");
    return tx.user.update({
      where: { id: userId }, data: owned.item.type === "FRAME" ? { equippedFrameId: itemId } : { equippedWallpaperId: itemId }, select: profileSelect,
    });
  });
}

export function normalizeAnswer(value: string) {
  return toHiragana(value.normalize("NFKC").toLowerCase()).replace(/[\p{P}\p{Z}\p{S}\s]/gu, "");
}

export async function completeSentence(userId: string, input: { lessonId: string; sentenceIndex: number; answer: string; durationSec: number }, now = new Date()) {
  return transaction(async (tx) => {
    const user = await userOrFail(tx, userId);
    const lesson = await tx.lesson.findUnique({ where: { id: input.lessonId }, include: { sentences: { orderBy: { index: "asc" } } } });
    if (!lesson?.published) throw new ApiError(404, "not_found", "Lesson not found.");
    const sentence = lesson.sentences.find((entry) => entry.index === input.sentenceIndex);
    if (!sentence) throw new ApiError(404, "not_found", "Sentence not found.");
    const answer = normalizeAnswer(input.answer);
    if (!answer || ![normalizeAnswer(sentence.textJa), normalizeAnswer(sentence.furigana)].includes(answer)) {
      return { correct: false, rewardXp: 0 };
    }
    const key = `DICTATION:${lesson.id}:sentence:${sentence.index}`;
    if (await tx.studyEvent.findUnique({ where: { userId_key: { userId, key } } })) return { correct: true, replayed: true, rewardXp: 0 };
    const { today } = await calendar(tx, user, now);
    await tx.studyEvent.create({ data: { userId, lessonId: lesson.id, key, xp: gamification.sentenceXP } });
    const completedSentences = await tx.studyEvent.count({ where: { userId, lessonId: lesson.id, key: { startsWith: `DICTATION:${lesson.id}:sentence:` } } });
    const lessonCompleted = completedSentences >= lesson.sentences.length;
    let rewardXp = gamification.sentenceXP;
    if (lessonCompleted) {
      await tx.studyEvent.create({ data: { userId, lessonId: lesson.id, key: `DICTATION:${lesson.id}:complete`, xp: gamification.lessonXP } });
      rewardXp += gamification.lessonXP;
      await tx.attempt.create({ data: { userId, lessonId: lesson.id, requestId: `DICTATION:${lesson.id}:complete`, mode: "DICTATION", accuracy: 100, durationSec: input.durationSec } });
    }
    await tx.progress.upsert({
      where: { userId_lessonId_mode: { userId, lessonId: lesson.id, mode: "DICTATION" } },
      create: { userId, lessonId: lesson.id, mode: "DICTATION", status: lessonCompleted ? "COMPLETED" : "LEARNING", lastSentenceIndex: sentence.index },
      update: { status: lessonCompleted ? "COMPLETED" : "LEARNING", lastSentenceIndex: sentence.index },
    });
    const day = await tx.studyDay.findUniqueOrThrow({ where: { userId_date: { userId, date: today } } });
    const seconds = day.seconds + Math.min(input.durationSec, Math.max(1, Math.ceil((sentence.endMs - sentence.startMs) / 1000)) * 3);
    const minutes = Math.floor(seconds / 60);
    await tx.studyDay.update({ where: { id: day.id }, data: { seconds, minutes, xp: { increment: rewardXp }, lessons: { increment: lessonCompleted ? 1 : 0 } } });
    const xp = user.xp + rewardXp;
    const updated = await tx.user.update({ where: { id: userId }, data: { xp, level: levelProgress(xp).level }, select: profileSelect });
    await incrementMissions(tx, userId, today, { dictation_sentences: 1, study_minutes: minutes - day.minutes, lessons: lessonCompleted ? 1 : 0 });
    return { correct: true, replayed: false, lessonCompleted, rewardXp, user: updated };
  });
}

export async function dashboard(userId: string, now = new Date()) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId }, select: profileSelect });
  if (!user) throw new ApiError(401, "unauthorized", "Your account no longer exists.");
  const today = localDateKey(now, user.timezone);
  const [studyDays, missions, milestones, inventory, progress] = await Promise.all([
    db.studyDay.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 90 }),
    db.mission.findMany({ include: { users: { where: { userId, date: today } } }, orderBy: { key: "asc" } }),
    db.milestone.findMany({ include: { users: { where: { userId } } }, orderBy: [{ type: "asc" }, { threshold: "asc" }] }),
    db.inventory.findMany({ where: { userId }, include: { item: true } }),
    db.progress.findMany({ where: { userId }, include: { lesson: { select: { id: true, title: true, titleJa: true } } } }),
  ]);
  return {
    user, levelProgress: levelProgress(user.xp), today, studyDays, inventory, progress,
    missions: missions.map(({ users, ...mission }) => ({ ...mission, date: today, progress: users[0]?.progress ?? 0, claimedAt: users[0]?.claimedAt ?? null })),
    milestones: milestones.map(({ users, ...milestone }) => ({ ...milestone, claimedAt: users[0]?.claimedAt ?? null })),
  };
}
