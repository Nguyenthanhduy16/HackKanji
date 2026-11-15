import assert from 'node:assert/strict';
import test from 'node:test';
import type { PastType, RawExam } from '../src/lib/past-papers';

// Tiny synthetic exam (no real exam content in the repository).
const exam: RawExam = {
  tag: '2030-07', label: '7/2030',
  mondai: [
    { no: 1, sec: 'goi', type: 'yomi', instr: 'x', groups: [], qs: [
      { n: 1, q: '<u>漢字</u>テスト', o: ['a', 'b', 'c', 'd'], a: 2, g: -1 },
      { n: 2, q: 'ものならテスト', o: ['a', 'b', 'c', 'd'], a: 1, g: -1 },
    ] },
    { no: 10, sec: 'dok', type: 'tanbun', instr: 'y', groups: ['<p>本文 ものなら</p>'], qs: [
      { n: 3, q: '問い1', o: ['a', 'b', 'c', 'd'], a: 3, g: 0 },
      { n: 4, q: '問い2', o: ['a', 'b', 'c', 'd'], a: 4, g: 0 },
    ] },
  ],
  listen: {
    q: 'listen/2030-07-q.jpg', qW: 100, qH: 300, crops: { '1-1': [[0, 100]] }, sc: 'listen/2030-07-script.jpg', scW: 1, scH: 1,
    mondai: [{ no: 1, ans: [['1', 2]] }, { no: 4, ans: [['1', 3]] }, { no: 5, ans: [['1', 1], ['2-1', 4], ['2-2', 2]] }],
    chunks: [{ u: 'audio/2030-07.mp3', d: 1200 }, { u: '/_blob/abc', d: 300 }], dur: 1500,
  },
};

test('bank flattens sections, listening and resolves file paths', async () => {
  const pp = await import('../src/lib/past-papers');
  const bank = pp.buildBank('N2', [pp.resolveExam(exam, '/jlpt/n2')]);
  assert.equal(bank.list.length, 4 + 5);
  const l = bank.byId['n2-2030-07-L5-2-1'];
  assert.equal(l.sec, 'cho'); assert.equal(l.type, 'ltougou'); assert.equal(l.q, '2番 · 質問1'); assert.equal(l.a, 4);
  assert.deepEqual(bank.byId['n2-2030-07-L4-1'].o, ['1', '2', '3']);
  assert.equal(bank.exams['2030-07'].listen!.chunks[0].u, '/jlpt/n2/audio/2030-07.mp3');
  assert.equal(bank.exams['2030-07'].listen!.chunks[1].u, '/_blob/abc');   // absolute urls untouched
  assert.equal(bank.byId['n2-2030-07-3'].unit, bank.byId['n2-2030-07-4'].unit); // same passage
});

test('custom filter, unit grouping and scoring', async () => {
  const pp = await import('../src/lib/past-papers');
  const bank = pp.buildBank('N2', [exam]);
  const f = { ...pp.DEFAULT_FILTER, types: ['yomi', 'tanbun'] as PastType[], kw: 'ものなら' };
  const pool = pp.filterPool(bank, f, {});
  assert.deepEqual(pool.map(q => q.n).sort(), ['2', '3', '4']);   // keyword also matches the passage
  // asking for 1 question still returns the whole passage unit
  const ids = pp.buildSessionIds(bank, pool.filter(q => q.n === '3'), 1, 'year');
  assert.deepEqual(ids, ['n2-2030-07-3', 'n2-2030-07-4']);
  const prog = { 'n2-2030-07-1': pp.nextProgress(undefined, false, 1) };
  assert.deepEqual(pp.filterPool(bank, { ...f, kw: '', status: 'wrong' }, prog).map(q => q.n), ['1']);
  assert.deepEqual(pp.filterPool(bank, { ...f, kw: '', status: 'new' }, prog).map(q => q.n), ['2', '3', '4']);
  const all = pp.examIds(bank, '2030-07', 'all');
  const s = pp.scoreSession(bank, all, { 'n2-2030-07-1': 2, 'n2-2030-07-3': 1, 'n2-2030-07-L1-1': 2 });
  assert.equal(s.correct, 2); assert.equal(s.total, 9); assert.equal(s.byType[0].type, 'yomi');
});

test('tabs, markup and audio timeline', async () => {
  const pp = await import('../src/lib/past-papers');
  const bank = pp.buildBank('N2', [exam]);
  const tabs = pp.tabsFor(bank, pp.examIds(bank, '2030-07', 'all'));
  assert.deepEqual(tabs.map(t => t.label), ['問題1', '問題10', '問題1', '問題4', '問題5']);
  assert.equal(pp.examHtml('[_] [★] [48]'), '<span class="pp-slot"></span> <span class="pp-slot pp-star">★</span> <span class="pp-box">48</span>');
  assert.deepEqual(pp.chunkAt([{ d: 1200 }, { d: 300 }], 1250), { index: 1, offset: 50 });
  assert.deepEqual(pp.chunkAt([{ d: 1200 }, { d: 300 }], 10), { index: 0, offset: 10 });
});
