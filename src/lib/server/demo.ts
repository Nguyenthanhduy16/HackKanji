import { gamification } from "@/lib/gamification/config";
import { levelProgress } from "@/lib/gamification/logic";
import { seedLearners, shopItems } from "@/lib/social-data";
import { GRAMMAR_POINTS, PRACTICE_EXAMS } from "@/lib/study-data";
import messages from "@/messages/study.vi.json";

export const seedPrefix = "nhai_seed_";
export const seedId = (value: string) => `${seedPrefix}${value}`;
export const seedDate = "2026-11-15";
const translate = (key: string) => (messages as Record<string, string>)[key] ?? key;

// The ten seeded shop entries include a freeze card and nine original cosmetics.
export const demoShopItems = [
  { id: seedId("freeze"), name: "Thẻ bảo vệ chuỗi", type: "FREEZE" as const, rarity: "COMMON" as const, price: gamification.freezePrice, imageUrl: null, active: true },
  ...shopItems.slice(0, 9).map((item) => ({
    id: seedId(item.id), name: item.key, type: item.type.toUpperCase() as "FRAME" | "WALLPAPER",
    rarity: item.rarity.toUpperCase() as "COMMON" | "RARE" | "EPIC", price: item.price, imageUrl: item.art, active: true,
  })),
];

export const demoMilestones = gamification.milestones.map((threshold, index) => ({
  id: seedId(`streak_${threshold}`), type: "STREAK" as const, threshold,
  rewardDango: gamification.milestoneRewards[index], rewardFreeze: threshold >= 365 ? 3 : threshold >= 120 ? 2 : threshold >= 30 ? 1 : 0,
  rewardItemIds: [] as string[],
}));

const missionDefinitions = [
  ["checkin", "Điểm danh hôm nay"],
  ["dictation_sentences", "Hoàn thành 3 câu chính tả"],
  ["study_minutes", "Học tập 5 phút"],
  ["lessons", "Hoàn thành một bài học"],
] as const;
export const demoMissions = missionDefinitions.map(([key, title], index) => ({
  id: seedId(`mission_${key}`), key, title, target: gamification.missionTargets[index], rewardXp: gamification.missionXP[index], rewardDango: gamification.missionDango[index],
}));

export const demoLearners = seedLearners.map((learner) => ({
  id: seedId(learner.id), name: learner.name, level: levelProgress(learner.xp).level,
  currentStreak: learner.streak, xp: learner.xp, minutes: learner.minutes, lessons: learner.lessons,
}));

export const demoGrammar = GRAMMAR_POINTS.map((point) => ({
  id: seedId(`grammar_${point.id}`), jlptLevel: point.level, pattern: point.pattern, reading: point.reading,
  explanationVi: translate(point.explanationKey), tags: [translate(point.tagKey)],
  examples: point.examples.map((example) => ({ textJa: example.text, reading: example.reading, translationVi: translate(example.translationKey) })),
}));

export const demoExams = PRACTICE_EXAMS.map((exam) => ({
  id: seedId(`exam_${exam.id}`), title: `NhaiKanji ${exam.level} — ${exam.id}`, jlptLevel: exam.level,
  durationSec: exam.durationSeconds, passPercent: 60,
  questions: exam.questions.map((question, index) => ({
    id: seedId(`question_${exam.id}_${question.id}`), index, section: question.section, prompt: question.prompt,
    options: question.options, correctIndex: question.correct, explanationVi: translate(question.explanationKey),
  })),
}));
