import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync} from 'node:fs';

test('notes validate content and persist edits and removal', async () => {
  assert.equal(existsSync('src/lib/social-store.ts'), true, 'The personal-data store must exist');
  const {createSocialStore} = await import('../../lib/social-store');
  const entries = new Map<string, string>();
  const storage = {getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => {entries.set(key, value);}, removeItem: (key: string) => {entries.delete(key);}};
  const store = createSocialStore(storage);
  assert.equal(store.getState().saveNote({title: ' ', body: 'body', tag: 'N5'}), false);
  const id = store.getState().saveNote({title: '  My first note  ', body: '日本語', tag: 'N5'});
  assert.equal(typeof id, 'string');
  assert.equal(store.getState().notes[0].title, 'My first note');
  store.getState().saveNote({id: String(id), title: 'Updated', body: '毎日', tag: 'N4'});
  assert.equal(store.getState().notes.length, 1);
  const restored = createSocialStore(storage);
  assert.equal(restored.getState().notes[0].body, '毎日');
  restored.getState().deleteNote(String(id));
  assert.equal(restored.getState().notes.length, 0);
});

test('community posts reject empty input and keep likes and comments local', async () => {
  const {createSocialStore} = await import('../../lib/social-store');
  const store = createSocialStore({getItem: () => null, setItem: () => {}, removeItem: () => {}});
  assert.equal(typeof store.getState().addPost, 'function', 'Community actions must exist');
  assert.equal(store.getState().addPost({title: '', body: 'hello', topic: 'learning', author: 'Me'}), false);
  const postId = store.getState().addPost({title: 'A small win', body: 'I learned ten words', topic: 'learning', author: 'Me'});
  assert.ok(postId);
  store.getState().toggleLike(String(postId));
  assert.equal(store.getState().likedPosts.includes(String(postId)), true);
  store.getState().toggleLike(String(postId));
  assert.equal(store.getState().likedPosts.includes(String(postId)), false);
  assert.equal(store.getState().addComment(String(postId), ' ', 'Me'), false);
  assert.equal(store.getState().addComment(String(postId), 'Keep going!', 'Me'), true);
  assert.equal(store.getState().comments[String(postId)][0].body, 'Keep going!');
  assert.equal(store.getState().addComment('missing', 'No phantom comments', 'Me'), false);
  store.getState().deletePost(String(postId));
  assert.equal(store.getState().posts.length, 0);
  assert.equal(store.getState().comments[String(postId)], undefined);
});

test('profile, preferences, feedback and vocabulary survive reload without duplicates', async () => {
  const {createSocialStore} = await import('../../lib/social-store');
  const entries = new Map<string, string>();
  const storage = {getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => {entries.set(key, value);}, removeItem: (key: string) => {entries.delete(key);}};
  const store = createSocialStore(storage);
  assert.equal(typeof store.getState().updateProfile, 'function', 'Profile actions must exist');
  store.getState().updateProfile({bio: 'Small steps every day', isPublic: false});
  store.getState().setPreference('dailyGoal', 30);
  assert.equal(store.getState().saveFeedback('idea', '  '), false);
  assert.equal(store.getState().saveFeedback('idea', 'Add more stories'), true);
  assert.equal(store.getState().saveWord({word: ' 猫 ', reading: 'ねこ', meaning: 'cat', level: 'N5'}), true);
  assert.equal(store.getState().saveWord({word: '猫', reading: 'ねこ', meaning: 'cat', level: 'N5'}), false);
  const restored = createSocialStore(storage);
  assert.equal(restored.getState().profile.isPublic, false);
  assert.equal(restored.getState().preferences.dailyGoal, 30);
  assert.equal(restored.getState().feedbacks[0].body, 'Add more stories');
  restored.getState().removeWord(restored.getState().words[0].id);
  assert.equal(restored.getState().words.length, 0);
});
