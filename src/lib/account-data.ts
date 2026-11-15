// Shared, data-only schema. Snapshots are unverified private backups, never rewards.
import type {useStudyStore} from './store';
import type {useLearningStore} from './study-store';
import type {SocialState} from './social-store';
type DataOnly<T> = Pick<T, {[K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K}[keyof T]>;
export type ProgressData = {study: DataOnly<ReturnType<typeof useStudyStore.getState>>; learning: DataOnly<ReturnType<typeof useLearningStore.getState>>; social: DataOnly<SocialState>};
export const MAX_PROGRESS_BYTES = 1_048_576;
type Check = (value: unknown) => boolean;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const text = (max = 200): Check => v => typeof v === 'string' && v.length <= max;
const number = (max = 1_000_000_000, min = 0, integer = true): Check => v => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v));
const bool: Check = v => typeof v === 'boolean';
const optional = (check: Check): Check => v => v === undefined || check(v);
const nullable = (check: Check): Check => v => v === null || check(v);
const oneOf = (...values: unknown[]): Check => v => values.includes(v);
const array = (check: Check, max = 10_000): Check => v => Array.isArray(v) && v.length <= max && v.every(check);
const object = (fields: Record<string, Check>): Check => v => plain(v) && Object.keys(v).every(k => !forbidden.has(k) && Object.hasOwn(fields, k)) && Object.entries(fields).every(([k, check]) => check(v[k]));
const map = (check: Check, max = 10_000): Check => v => plain(v) && Object.keys(v).length <= max && Object.entries(v).every(([k, value]) => k.length > 0 && k.length <= 200 && !forbidden.has(k) && check(value));
const date: Check = v => typeof v === 'string' && (v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v));
const stamp: Check = v => typeof v === 'string' && v.length <= 40 && Number.isFinite(Date.parse(v));
const time = number(8_640_000_000_000_000);
const strings = array(text());
const schedule = object({ease: number(100, 1, false), interval: number(36_500), repetitions: number(), lapses: number(), dueAt: time, lastReviewedAt: nullable(time)});
const answers = map(number(20));
export const progressFields = {
  study: {name: text(48), xp: number(), level: number(1_000_000, 1), dango: number(), streak: number(), longestStreak: number(), freezeCards: number(), checkedIn: bool, lastCheckIn: date, studyDays: map(object({minutes: number(1_000_000, 0, false), xp: number(), checkedIn: bool, usedFreeze: optional(bool)})), completedLessons: strings, completedLessonDates: map(date), reviews: number(), ownedItems: strings, equippedFrame: nullable(text()), claimedMissions: array(number(3), 4), missionsProgress: (v: unknown) => Array.isArray(v) && v.length === 4 && v.every(number()), missionDate: date, claimedMilestones: strings},
  learning: {decks: array(object({id: text(), name: text(80), description: text(300), sourceId: optional(text()), createdAt: time})), cards: array(object({id: text(), deckId: text(), word: text(2000), reading: text(2000), meaning: text(5000), meaningKey: optional(text()), schedule})), grammar: array(object({grammarId: text(), schedule})), grammarNotes: map(text(5000)), reviewLog: array(object({id: text(), source: oneOf('vocabulary', 'grammar'), itemId: text(), rating: oneOf('again', 'hard', 'good', 'easy'), at: time})), attempts: array(object({id: text(), examId: text(), answers, startedAt: time, completedAt: time, durationSeconds: number(), timedOut: bool})), activeExam: nullable(object({examId: text(), answers, startedAt: time, deadline: time})), gameResults: array(object({id: text(), gameId: text(), score: number(), correct: number(), total: number(), completedAt: time, durationSeconds: number(1_000_000_000, 0, false)}), 100)},
  social: {notes: array(object({id: text(), title: text(120), body: text(6000), tag: text(30), updatedAt: stamp})), posts: array(object({id: text(), title: text(140), body: text(3000), topic: oneOf('learning', 'abroad', 'travel', 'translation', 'partner', 'tutor', 'jobs', 'other', 'sharing'), author: text(40), createdAt: stamp})), likedPosts: strings, comments: map(array(object({id: text(), body: text(1000), author: text(40), createdAt: stamp}))), profile: object({bio: text(180), isPublic: bool, wallpaper: nullable(text())}), preferences: object({dailyGoal: number(60, 5), sound: bool, furigana: bool, reminders: bool}), feedbacks: array(object({id: text(), category: oneOf('idea', 'bug', 'content', 'other'), body: text(3000), createdAt: stamp})), words: array(object({id: text(), word: text(80), reading: text(80), meaning: text(200), level: text(30)}))},
} satisfies Record<string, Record<string, Check>>;
const valid = object({study: object(progressFields.study), learning: object(progressFields.learning), social: object(progressFields.social)});
export function parseProgressData(input: unknown): ProgressData {
  if (!valid(input)) throw new Error('Invalid progress data');
  const serialized = JSON.stringify(input);
  if (new TextEncoder().encode(serialized).byteLength > MAX_PROGRESS_BYTES) throw new Error('Progress exceeds 1 MB');
  return JSON.parse(serialized) as ProgressData;
}
export function emptyProgressData(): ProgressData {
  return {study: {name: 'Bạn học', xp: 0, level: 1, dango: 0, streak: 0, longestStreak: 0, freezeCards: 0, checkedIn: false, lastCheckIn: '', studyDays: {}, completedLessons: [], completedLessonDates: {}, reviews: 0, ownedItems: [], equippedFrame: null, claimedMissions: [], missionsProgress: [0, 0, 0, 0], missionDate: '', claimedMilestones: []}, learning: {decks: [], cards: [], grammar: [], grammarNotes: {}, reviewLog: [], attempts: [], activeExam: null, gameResults: []}, social: {notes: [], posts: [], likedPosts: [], comments: {}, profile: {bio: '', isPublic: true, wallpaper: null}, preferences: {dailyGoal: 15, sound: true, furigana: true, reminders: false}, feedbacks: [], words: []}};
}
