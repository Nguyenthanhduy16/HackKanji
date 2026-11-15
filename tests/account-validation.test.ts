import assert from 'node:assert/strict';
import test from 'node:test';

test('account snapshots validate all three data slices and reject methods and extra keys', async () => {
  const {parseProgressData, emptyProgressData} = await import('../src/lib/account-data');
  const data = emptyProgressData();
  assert.deepEqual(parseProgressData(data), data);
  const populated = structuredClone(data);
  populated.learning.decks.push({id: 'deck', name: '日本語', description: 'Study', createdAt: 1});
  populated.learning.cards.push({id: 'card', deckId: 'deck', word: '猫', reading: 'ねこ', meaning: 'cat', schedule: {ease: 2.5, interval: 6, repetitions: 2, lapses: 0, dueAt: 12345, lastReviewedAt: 1}});
  populated.social.notes.push({id: 'note', title: 'Practice', body: '私の猫', tag: 'N5', updatedAt: '2026-01-01T00:00:00.000Z'});
  populated.study.studyDays['2026-01-01'] = {minutes: 0.25, xp: 8, checkedIn: true};
  assert.deepEqual(parseProgressData(populated), populated);
  assert.throws(() => parseProgressData({...data, access_token: 'secret'}));
  assert.throws(() => parseProgressData({...data, study: {...data.study, earnXP: () => {}}}));
  assert.throws(() => parseProgressData({...data, study: {...data.study, xp: -1}}));
  assert.throws(() => parseProgressData({...data, learning: {...data.learning, grammarNotes: JSON.parse('{"__proto__":"bad"}')}}));
  assert.throws(() => parseProgressData({...data, social: {...data.social, profile: {...data.social.profile, constructor: 'bad'}}}));
  assert.throws(() => parseProgressData({...data, study: {...data.study, xp: Infinity}}));
  assert.throws(() => parseProgressData({...data, social: {...data.social, notes: [{id: 'x', title: 'x', body: 'x'.repeat(1_048_577), tag: '', updatedAt: ''}]}}));
});
