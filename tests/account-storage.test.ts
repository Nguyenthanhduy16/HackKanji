import assert from 'node:assert/strict';
import test from 'node:test';

test('account scopes isolate the three stores and require explicit browser import', async () => {
  const {createAccountStorage} = await import('../src/lib/account-storage');
  const {emptyProgressData} = await import('../src/lib/account-data');
  const values = new Map<string, string>();
  const storage = {getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => {values.set(k, v);}, removeItem: (k: string) => {values.delete(k);}};
  const base = emptyProgressData(); base.study.xp = 50;
  let live = structuredClone(base);
  const scope = createAccountStorage(storage, {read: () => live, write: d => {live = d;}}, base);
  scope.switchTo('alice'); assert.equal(live.study.xp, 0);
  live.study.xp = 99; scope.flush();
  scope.switchTo('bob'); assert.equal(live.study.xp, 0);
  scope.switchTo(null); assert.equal(live.study.xp, 50);
  scope.switchTo('alice'); assert.equal(live.study.xp, 99);
  assert.equal(scope.version, 0); scope.markVersion(4);
  scope.switchTo('bob'); assert.equal(scope.version, 0);
  scope.switchTo('alice'); assert.equal(scope.version, 4);
  scope.importBrowser(); assert.equal(live.study.xp, 50);
  assert.throws(() => scope.switchTo('__proto__'));
});
