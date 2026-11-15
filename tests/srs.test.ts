import assert from 'node:assert/strict';
import test from 'node:test';
import { newSchedule, scheduleReview, isDue } from '../src/lib/srs';
import { useLearningStore, scoreExam } from '../src/lib/study-store';
import { PRACTICE_EXAMS } from '../src/lib/study-data';
import { matchesReading, orderedSentenceIsCorrect, gamePoints } from '../src/features/study/game-logic';

const now = Date.UTC(2026, 10, 15, 3);
const day = 86_400_000;

test('a new card is immediately due and a good first review is due tomorrow', () => {
  const fresh = newSchedule(now);
  assert.equal(isDue(fresh, now), true);
  const reviewed = scheduleReview(fresh, 'good', now);
  assert.equal(reviewed.repetitions, 1);
  assert.equal(reviewed.interval, 1);
  assert.equal(reviewed.dueAt, now + day);
  assert.equal(isDue(reviewed, now), false);
  assert.equal(isDue(reviewed, now + day), true);
  assert.equal(fresh.repetitions, 0, 'the scheduler must not mutate a stored card');
});

test('SM-2 grows successful intervals and a lapse resets the repetition streak', () => {
  let card = newSchedule(now);
  card = scheduleReview(card, 'good', now);
  card = scheduleReview(card, 'good', now + day);
  assert.equal(card.interval, 6);
  card = scheduleReview(card, 'good', now + 7 * day);
  assert.equal(card.interval, 15);
  const hard = scheduleReview(card, 'hard', now + 22 * day);
  const easy = scheduleReview(card, 'easy', now + 22 * day);
  assert.ok(hard.interval < easy.interval);
  assert.ok(hard.ease < card.ease);
  assert.ok(easy.ease > card.ease);
  const lapse = scheduleReview(card, 'again', now + 22 * day);
  assert.equal(lapse.repetitions, 0);
  assert.equal(lapse.lapses, 1);
  assert.equal(lapse.dueAt, now + 22 * day + 60_000);
  for (let i = 0; i < 20; i++) card = scheduleReview(card, 'hard', now);
  assert.ok(card.ease >= 1.3);
});

test('personal decks start empty, import once, and persist real review schedules', () => {
  const store = useLearningStore.getState();
  assert.equal(store.decks.length, 0);
  const id = store.importDeck('daily');
  assert.ok(id);
  assert.equal(useLearningStore.getState().importDeck('daily'), id);
  assert.equal(useLearningStore.getState().decks.length, 1);
  const cards = useLearningStore.getState().cards;
  assert.equal(cards.length, 8);
  useLearningStore.getState().reviewCard(cards[0].id, 'good', now);
  const saved = useLearningStore.getState();
  assert.equal(saved.cards[0].schedule.dueAt, now + day);
  assert.equal(saved.reviewLog.length, 1);
  const deck = saved.createDeck('  My words  ', 'Personal');
  assert.equal(useLearningStore.getState().decks.find(d => d.id === deck)?.name, 'My words');
  const card = saved.addCard(deck, { word: '花', reading: 'はな', meaning: 'hoa' });
  assert.ok(card);
  saved.deleteCard(card);
  assert.equal(useLearningStore.getState().cards.some(c => c.id === card), false);
});

test('exam scores count unanswered questions and give a real section breakdown', () => {
  const exam = PRACTICE_EXAMS[0];
  const answers = Object.fromEntries(exam.questions.slice(0, 3).map(q => [q.id, q.correct]));
  const result = scoreExam(exam, answers);
  assert.equal(result.correct, 3);
  assert.equal(result.total, 5);
  assert.equal(result.percent, 60);
  assert.equal(result.sections.vocabulary.correct, 2);
  assert.equal(result.sections.reading.correct, 0);
});

test('game answers accept romaji, kana and fullwidth text but reject wrong readings', () => {
  assert.equal(matchesReading('GAKKOU', 'がっこう', 'gakkou'), true);
  assert.equal(matchesReading('ガッコウ', 'がっこう', 'gakkou'), true);
  assert.equal(matchesReading('ｇａｋｋｏｕ', 'がっこう', 'gakkou'), true);
  assert.equal(matchesReading('gako', 'がっこう', 'gakkou'), false);
  assert.equal(matchesReading('', 'がっこう', 'gakkou'), false);
  assert.equal(orderedSentenceIsCorrect(['私', 'は', '猫'], ['私', 'は', '猫']), true);
  assert.equal(orderedSentenceIsCorrect(['猫', 'は', '私'], ['私', 'は', '猫']), false);
  assert.equal(gamePoints(false, 5), 0);
  assert.ok(gamePoints(true, 3) > gamePoints(true, 0));
});
