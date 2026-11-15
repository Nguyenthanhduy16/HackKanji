import { demoExams, demoGrammar, demoLearners, demoMilestones, demoMissions, demoShopItems, seedDate, seedId } from "@/lib/server/demo";
import { seedCategories, seedLessons } from "@/lib/server/lesson-data";

export function seedManifest() {
  const users = [
    { id: seedId("demo"), email: "demo@example.invalid", name: "Bạn học NhaiKanji", xp: 50, level: 1, dango: 50, currentStreak: 1, longestStreak: 1, lastStudyDate: seedDate, timezone: "Asia/Ho_Chi_Minh", locale: "vi", isPublic: true },
    ...demoLearners.map((learner, index) => ({
      id: learner.id, email: `learner-${index + 1}@example.invalid`, name: learner.name,
      xp: learner.xp, level: learner.level, dango: 50, currentStreak: learner.currentStreak,
      longestStreak: learner.currentStreak, lastStudyDate: seedDate, timezone: "Asia/Ho_Chi_Minh", locale: "vi", isPublic: true,
    })),
  ];
  return {
    users, categories: seedCategories, lessons: seedLessons, shopItems: demoShopItems,
    milestones: demoMilestones, missions: demoMissions, grammar: demoGrammar, exams: demoExams,
  };
}
