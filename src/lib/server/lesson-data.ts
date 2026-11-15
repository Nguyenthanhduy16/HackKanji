import { categories, lessons } from "@/lib/lessons";
import type { Prisma } from "@prisma/client";
import {clipRange} from "@/lib/youtube";
import { seedId } from "./demo";

const categoryNames: Record<string, string> = {
  daily: "Hội thoại hằng ngày", travel: "Du lịch", stories: "Câu chuyện nhỏ", work: "Tiếng Nhật công việc", jlpt: "Luyện thi JLPT",
};

export const seedCategories = categories.map((category, order) => ({
  id: seedId(`category_${category.id}`), slug: category.id, nameJa: category.titleJa,
  nameVi: categoryNames[category.id], order, audience: category.id === "work" ? "EXPERIENCED" as const : "BEGINNER" as const,
}));

export const seedLessons = lessons.map((lesson) => {
  const id = seedId(`lesson_${lesson.id}`);
  let offsetMs = 0;
  const sentences = lesson.sentences.map((sentence, index) => {
    const clip=lesson.source==='YOUTUBE'?clipRange(sentence):null;
    if(lesson.source==='YOUTUBE'&&(!clip||!lesson.youtubeId||!/^[\w-]{11}$/.test(lesson.youtubeId)))throw new Error('YouTube lessons require a valid video ID and explicit sentence clips');
    const startMs = clip?Math.round(clip.start*1000):offsetMs;
    const endMs=clip?Math.round(clip.end*1000):offsetMs+Math.round(sentence.duration*1000);
    offsetMs=endMs;
    return {
      id: seedId(`sentence_${sentence.id}`), index, textJa: sentence.text, furigana: sentence.reading,
      translationVi: sentence.translation, startMs, endMs, audioUrl: sentence.audio,
      words: sentence.words.map((word, wordIndex) => ({
        id: seedId(`word_${sentence.id}_${wordIndex}`), index: wordIndex, surface: word.text,
        reading: word.reading, meaningVi: word.translation, kanaLen: Array.from(word.reading).length,
      })),
    };
  });
  return {
    id, slug: lesson.id, title: lesson.title, titleJa: lesson.titleJa, jlptLevel: lesson.level,
    source: lesson.source, mediaUrl: null, youtubeId: lesson.youtubeId??null, startSec: lesson.source==='YOUTUBE'?Math.min(...sentences.map(s=>s.startMs))/1000:0, endSec: lesson.source==='YOUTUBE'?Math.max(...sentences.map(s=>s.endMs))/1000:lesson.duration,
    durationSec: Math.ceil(lesson.duration), thumbnailUrl: lesson.image, playCount: lesson.plays,
    categoryId: seedId(`category_${lesson.category}`), copyright: "Original NhaiKanji learning scripts.", published: true, sentences,
  };
});

export const lessonInclude = {
  category: true,
  sentences: { orderBy: { index: "asc" }, include: { words: { orderBy: { index: "asc" } } } },
} satisfies Prisma.LessonInclude;

export function demoLessons() {
  return seedLessons.map((lesson) => ({ ...lesson, category: seedCategories.find((category) => category.id === lesson.categoryId) }));
}
