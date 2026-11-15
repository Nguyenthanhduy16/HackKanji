'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GRAMMAR_POINTS, STARTER_DECKS, VOCABULARY, type PracticeExam, type ExamSection } from './study-data';
import { newSchedule, scheduleReview, type ReviewRating, type Schedule } from './srs';

export interface PersonalDeck { id: string; name: string; description: string; sourceId?: string; createdAt: number; }
export interface StudyCard { id: string; deckId: string; word: string; reading: string; meaning: string; meaningKey?: string; schedule: Schedule; }
export interface SavedGrammar { grammarId: string; schedule: Schedule; }
export interface ReviewEvent { id: string; source: 'vocabulary' | 'grammar'; itemId: string; rating: ReviewRating; at: number; }
export interface ExamAttempt { id: string; examId: string; answers: Record<string, number>; startedAt: number; completedAt: number; durationSeconds: number; timedOut: boolean; }
export interface ActiveExam { examId: string; answers: Record<string, number>; startedAt: number; deadline: number; }
export interface GameResult { id: string; gameId: string; score: number; correct: number; total: number; completedAt: number; durationSeconds: number; }
export interface ScoreResult { correct: number; total: number; percent: number; sections: Record<ExamSection, { correct: number; total: number }>; }
export function scoreExam(exam: PracticeExam, answers: Record<string, number>): ScoreResult {
  const sections: ScoreResult['sections'] = { vocabulary: { correct: 0, total: 0 }, grammar: { correct: 0, total: 0 }, reading: { correct: 0, total: 0 } };
  let correct = 0;
  exam.questions.forEach(question => {
    sections[question.section].total++;
    if (answers[question.id] === question.correct) { correct++; sections[question.section].correct++; }
  });
  return { correct, total: exam.questions.length, percent: exam.questions.length ? Math.round(correct / exam.questions.length * 100) : 0, sections };
}
const uid = () => globalThis.crypto.randomUUID();
interface LearningState {
  decks: PersonalDeck[];
  cards: StudyCard[];
  grammar: SavedGrammar[];
  grammarNotes: Record<string, string>;
  reviewLog: ReviewEvent[];
  attempts: ExamAttempt[];
  activeExam: ActiveExam | null;
  gameResults: GameResult[];
  createDeck: (name: string, description: string) => string;
  updateDeck: (id: string, name: string, description: string) => void;
  importDeck: (sourceId: string) => string;
  addCard: (deckId: string, card: Pick<StudyCard, 'word' | 'reading' | 'meaning'>) => string;
  updateCard: (id: string, card: Pick<StudyCard, 'word' | 'reading' | 'meaning'>) => void;
  deleteCard: (id: string) => void;
  reviewCard: (id: string, rating: ReviewRating, now?: number) => void;
  saveGrammar: (id: string) => void;
  removeGrammar: (id: string) => void;
  reviewGrammar: (id: string, rating: ReviewRating, now?: number) => void;
  setGrammarNote: (id: string, note: string) => void;
  startExam: (exam: PracticeExam) => void;
  answerQuestion: (id: string, choice: number) => void;
  finishExam: (timedOut?: boolean) => ExamAttempt | null;
  saveGame: (result: Omit<GameResult, 'id' | 'completedAt'>) => void;
}
export const useLearningStore = create<LearningState>()(persist((set, get) => ({
  decks: [], cards: [], grammar: [], grammarNotes: {}, reviewLog: [], attempts: [], activeExam: null, gameResults: [],
  createDeck: (name, description) => {
    if (!name.trim()) return '';
    const id = uid();
    set(s => ({ decks: [...s.decks, { id, name: name.trim().slice(0, 80), description: description.trim().slice(0, 300), createdAt: Date.now() }] }));
    return id;
  },
  updateDeck: (id, name, description) => { if (name.trim()) set(s => ({ decks: s.decks.map(d => d.id === id ? { ...d, name: name.trim().slice(0, 80), description: description.trim().slice(0, 300) } : d) })); },
  importDeck: sourceId => {
    const existing = get().decks.find(d => d.sourceId === sourceId);
    if (existing) return existing.id;
    const source = STARTER_DECKS.find(d => d.id === sourceId);
    if (!source) return '';
    const id = uid(); const now = Date.now();
    const cards: StudyCard[] = source.wordIds.flatMap(wordId => {
      const word = VOCABULARY.find(w => w.id === wordId);
      return word ? [{ id: uid(), deckId: id, word: word.word, reading: word.reading, meaning: '', meaningKey: word.meaningKey, schedule: newSchedule(now) }] : [];
    });
    set(s => ({ decks: [...s.decks, { id, sourceId, name: '', description: '', createdAt: now }], cards: [...s.cards, ...cards] }));
    return id;
  },
  addCard: (deckId, input) => {
    if (!get().decks.some(d => d.id === deckId) || !input.word.trim() || !input.reading.trim() || !input.meaning.trim()) return '';
    const id = uid();
    set(s => ({ cards: [...s.cards, { id, deckId, word: input.word.trim(), reading: input.reading.trim(), meaning: input.meaning.trim(), schedule: newSchedule() }] }));
    return id;
  },
  updateCard: (id, input) => {
    if (!input.word.trim() || !input.reading.trim() || !input.meaning.trim()) return;
    set(s => ({ cards: s.cards.map(c => c.id === id ? { ...c, ...input, meaningKey: undefined } : c) }));
  },
  deleteCard: id => set(s => ({ cards: s.cards.filter(c => c.id !== id) })),
  reviewCard: (id, rating, now = Date.now()) => {
    if (!get().cards.some(c => c.id === id)) return;
    set(s => ({ cards: s.cards.map(c => c.id === id ? { ...c, schedule: scheduleReview(c.schedule, rating, now) } : c), reviewLog: [...s.reviewLog, { id: uid(), source: 'vocabulary', itemId: id, rating, at: now }] }));
  },
  saveGrammar: id => { if (GRAMMAR_POINTS.some(g => g.id === id) && !get().grammar.some(g => g.grammarId === id)) set(s => ({ grammar: [...s.grammar, { grammarId: id, schedule: newSchedule() }] })); },
  removeGrammar: id => set(s => ({ grammar: s.grammar.filter(g => g.grammarId !== id) })),
  reviewGrammar: (id, rating, now = Date.now()) => {
    if (!get().grammar.some(g => g.grammarId === id)) return;
    set(s => ({ grammar: s.grammar.map(g => g.grammarId === id ? { ...g, schedule: scheduleReview(g.schedule, rating, now) } : g), reviewLog: [...s.reviewLog, { id: uid(), source: 'grammar', itemId: id, rating, at: now }] }));
  },
  setGrammarNote: (id, note) => set(s => ({ grammarNotes: { ...s.grammarNotes, [id]: note.slice(0, 5000) } })),
  startExam: exam => { const now = Date.now(); set({ activeExam: { examId: exam.id, answers: {}, startedAt: now, deadline: now + exam.durationSeconds * 1000 } }); },
  answerQuestion: (id, choice) => set(s => s.activeExam ? { activeExam: { ...s.activeExam, answers: { ...s.activeExam.answers, [id]: choice } } } : {}),
  finishExam: (timedOut = false) => {
    const active = get().activeExam;
    if (!active) return null;
    const completedAt = Math.min(Date.now(), active.deadline);
    const result: ExamAttempt = { id: uid(), examId: active.examId, answers: { ...active.answers }, startedAt: active.startedAt, completedAt, durationSeconds: Math.max(0, Math.round((completedAt - active.startedAt) / 1000)), timedOut: timedOut || Date.now() >= active.deadline };
    set(s => ({ activeExam: null, attempts: [result, ...s.attempts] }));
    return result;
  },
  saveGame: result => set(s => ({ gameResults: [{ ...result, id: uid(), completedAt: Date.now() }, ...s.gameResults].slice(0, 100) })),
}), {
  name: 'nhaikanji-learning-v1', version: 1,
  storage: createJSONStorage(() => typeof window === 'undefined' ? { getItem: () => null, setItem: () => {}, removeItem: () => {} } : window.localStorage),
}));
