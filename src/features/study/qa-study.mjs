import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { GAMES, VOCABULARY, PRACTICE_EXAMS, SENTENCE_ORDERS } from '../../lib/study-data.ts';
import { newSchedule, scheduleReview } from '../../lib/srs.ts';
import messages from '../../messages/study.vi.json';

const root = new URL('./qa/', import.meta.url);
const baseURL = process.env.STUDY_QA_BASE_URL || 'http://localhost:3000';
await fs.mkdir(root, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const report = { startedAt: new Date().toISOString(), baseURL, browser: browser.version(), checks: [], layouts: [], games: [], consoleErrors: [], pageErrors: [], failures: [], limitations: ['Headless speech synthesis sound quality is not verified; listening hint and answer evaluation are exercised.'] };
const saveReport = () => fs.writeFile(new URL('report.json', root), JSON.stringify(report, null, 2));
const label = (key, values = {}) => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), messages[key]);
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('nhaikanji-learning-v1') || '{"state":{}}').state);
async function run(name, test, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.pageErrors.push({ test: name, url: page.url(), message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ test: name, url: page.url(), message: message.text() }); });
  const main = page.locator('main');
  const go = async (route, locale = 'vi') => {
    await page.goto(`${baseURL}/${locale}/${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await main.locator('h1').first().waitFor({ timeout: 60000 });
    await expect(main).not.toContainText('study.');
  };
  const layout = async route => {
    const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, dark: document.documentElement.classList.contains('dark') }));
    report.layouts.push({ route, ...result });
    assert.ok(result.scrollWidth <= result.width, `${route}: ${result.scrollWidth}px document at ${result.width}px viewport`);
  };
  try {
    await test({ page, main, go, layout });
    report.checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    const screenshot = `${name.replace(/[^a-z0-9]+/gi, '-')}-failure.png`;
    await page.screenshot({ path: new URL(screenshot, root).pathname, fullPage: true }).catch(() => {});
    report.failures.push({ name, error: String(error), url: page.url(), screenshot });
    report.checks.push({ name, passed: false });
    console.error(`FAIL ${name}: ${error}`);
  } finally {
    await context.close();
    await saveReport();
  }
}

await run('hub layouts and locale messages', async ({ page, main, go, layout }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of ['vocabulary', 'grammar', 'review', 'exams', 'games']) {
      await go(route); await layout(route);
      await page.screenshot({ path: new URL(`${route}-${width}.png`, root).pathname, fullPage: true });
    }
  }
  for (const locale of ['en', 'ja']) {
    for (const route of ['vocabulary', 'grammar/desu', 'review', 'exams/n5-practice', 'games/word-shot']) {
      await go(route, locale); await layout(`${locale}/${route}`);
      assert.ok((await main.locator('h1').first().innerText()).length > 0);
    }
  }
});

await run('vocabulary CRUD and all four review grades', async ({ page, main, go, layout }) => {
  await go('vocabulary');
  await expect(main.getByText(messages.emptyDecks, { exact: true })).toBeVisible();
  await main.getByRole('button', { name: messages.createDeck, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: messages.createDeck, exact: true })).toBeDisabled();
  await page.getByLabel(messages.deckName, { exact: true }).fill('Bộ thẻ kiểm thử');
  await page.getByLabel(messages.deckDescription, { exact: true }).fill('Nội dung gốc để kiểm tra luồng học');
  await page.getByRole('dialog').getByRole('button', { name: messages.createDeck, exact: true }).click();
  await expect(main.locator('h1')).toHaveText('Bộ thẻ kiểm thử');
  for (const [word, reading, meaning] of [['花','はな','hoa'], ['空','そら','bầu trời'], ['海','うみ','biển'], ['星','ほし','ngôi sao']]) {
    await main.getByRole('button', { name: messages.addCard, exact: true }).first().click();
    await expect(page.getByRole('dialog').getByRole('button', { name: messages.addCard, exact: true })).toBeDisabled();
    await page.getByLabel(messages.word, { exact: true }).fill(word);
    await page.getByLabel(messages.reading, { exact: true }).fill(reading);
    await page.getByLabel(messages.meaning, { exact: true }).fill(meaning);
    await page.getByRole('dialog').getByRole('button', { name: messages.addCard, exact: true }).click();
  }
  await main.getByRole('button', { name: messages.editCard, exact: true }).first().click();
  await page.getByLabel(messages.meaning, { exact: true }).fill('bông hoa');
  await page.getByRole('dialog').getByRole('button', { name: messages.save, exact: true }).click();
  await main.getByRole('button', { name: messages.editDeck, exact: true }).click();
  await page.getByLabel(messages.deckName, { exact: true }).fill('Bộ thẻ đã sửa');
  await page.getByRole('dialog').getByRole('button', { name: messages.save, exact: true }).click();
  await expect(main.locator('h1')).toHaveText('Bộ thẻ đã sửa');
  await main.getByRole('button', { name: messages.reviewNow, exact: true }).click();
  for (const [index, rating] of ['again','hard','good','easy'].entries()) {
    await main.getByRole('button', { name: messages.flip, exact: true }).last().click();
    await page.keyboard.press(String(index + 1));
    const state = await stored(page);
    assert.equal(state.reviewLog.length, index + 1);
    const event = state.reviewLog[index];
    assert.equal(event.rating, rating);
    const card = state.cards.find(card => card.id === event.itemId);
    assert.deepEqual(card.schedule, scheduleReview(newSchedule(event.at), rating, event.at));
  }
  await expect(main.getByText(messages.sessionComplete, { exact: true })).toBeVisible();
  await main.getByRole('button', { name: messages.continueLearning, exact: true }).click();
  await expect(main.getByRole('button', { name: messages.reviewNow, exact: true })).toBeDisabled();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(main.getByText('bông hoa', { exact: true })).toBeVisible();
  assert.equal((await stored(page)).reviewLog.length, 4);
  await main.getByRole('button', { name: messages.deleteCard, exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: messages.cancel, exact: true }).click();
  assert.equal((await stored(page)).cards.length, 4);
  await main.getByRole('button', { name: messages.deleteCard, exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: messages.confirmDelete, exact: true }).click();
  assert.equal((await stored(page)).cards.length, 3);
  await page.setViewportSize({ width: 390, height: 844 }); await layout('personal-deck');
  await go('vocabulary/daily');
  await main.getByRole('button', { name: messages.addDeck, exact: true }).click();
  await expect(main.getByRole('button', { name: messages.addCard, exact: true })).toBeVisible();
  assert.equal((await stored(page)).cards.length, 11);
  await go('vocabulary/daily');
  await main.getByRole('button', { name: messages.addDeck, exact: true }).click();
  await expect(main.getByRole('button', { name: messages.addCard, exact: true })).toBeVisible();
  assert.equal((await stored(page)).cards.length, 11, 'import is idempotent');
});

await run('grammar add review notes and schedule', async ({ page, main, go, layout }) => {
  await go('grammar');
  for (const level of ['N5','N4','N3','N2','N1']) {
    await main.getByRole('tab', { name: `JLPT ${level}`, exact: true }).click();
    assert.equal(await main.locator('a[href*="/grammar/"]').count(), 4);
  }
  await main.getByRole('searchbox').fill('không có kết quả');
  await expect(main.getByText(messages.noResults, { exact: true })).toBeVisible();
  await main.getByRole('button', { name: messages.clearFilters, exact: true }).click();
  await go('grammar/desu');
  assert.ok(await main.locator('ruby rt').count());
  await main.getByRole('button', { name: messages.addReview, exact: true }).click();
  await main.getByRole('textbox', { name: messages.yourNotes, exact: true }).fill('私は学生です。');
  await main.getByRole('button', { name: messages.save, exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(main.getByRole('textbox', { name: messages.yourNotes, exact: true })).toHaveValue('私は学生です。');
  await go('review');
  await expect(main.getByText(label('reviewSummary', { count: 1 }), { exact: true })).toBeVisible();
  await main.getByRole('button', { name: messages.startReview, exact: true }).click();
  await main.getByRole('button', { name: messages.flip, exact: true }).last().click();
  await page.keyboard.press('4');
  await expect(main.getByText(messages.sessionComplete, { exact: true })).toBeVisible();
  const state = await stored(page);
  assert.equal(state.reviewLog[0].source, 'grammar');
  assert.equal(state.grammar[0].schedule.interval, 4);
  await go('review'); await expect(main.getByText(messages.emptyReview, { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await go('grammar/beku'); await layout('grammar/beku');
});

await run('exam scores resume history and timeout', async ({ page, main, go }) => {
  const expectedScores = [];
  for (const [examIndex, exam] of PRACTICE_EXAMS.entries()) {
    await go(`exams/${exam.id}`);
    await main.getByRole('button', { name: messages.startExam, exact: true }).click();
    const expected = examIndex === 0 ? exam.questions.length : 3;
    for (const [index, question] of exam.questions.entries()) {
      await main.getByRole('radio').nth(index < expected ? question.correct : (question.correct + 1) % question.options.length).click();
      if (index + 1 < exam.questions.length) await main.getByRole('button', { name: messages.next, exact: true }).click();
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(main.getByText(label('answeredCount', { count: 5, total: 5 }), { exact: true })).toBeVisible();
    await main.getByRole('button', { name: messages.submitExam, exact: true }).last().click();
    await page.getByRole('dialog').getByRole('button', { name: messages.cancel, exact: true }).click();
    assert.ok((await stored(page)).activeExam);
    await main.getByRole('button', { name: messages.submitExam, exact: true }).last().click();
    await page.getByRole('dialog').getByRole('button', { name: messages.confirmSubmit, exact: true }).click();
    await expect(main.getByText(label('correctCount', { correct: expected, total: 5 }), { exact: true })).toBeVisible();
    expectedScores.unshift(expected); assert.equal((await stored(page)).attempts.length, expectedScores.length);
  }
  await go('exams');
  assert.equal(await main.locator('#exam-history').getByRole('button', { name: messages.viewResults }).count(), 5);
  await main.locator('#exam-history').getByRole('button', { name: messages.viewResults }).last().click();
  await expect(main.getByText(label('correctCount', { correct: 5, total: 5 }), { exact: true })).toBeVisible();
  await go('exams/n4-practice');
  await page.clock.install();
  await main.getByRole('button', { name: messages.startExam, exact: true }).click();
  await page.clock.fastForward(301000);
  await expect(main.getByText(messages.timedOut, { exact: true })).toBeVisible();
  const state = await stored(page);
  assert.equal(state.attempts.length, 6); assert.equal(state.attempts[0].timedOut, true); assert.equal(state.activeExam, null);
  await page.clock.fastForward(10000);
  assert.equal((await stored(page)).attempts.length, 6, 'timeout records exactly one attempt');
});

for (const game of GAMES) {
  await run(`game ${game.id}`, async ({ page, main, go, layout }) => {
    await go(`games/${game.id}`);
    await page.getByRole('button', { name: 'Đổi giao diện', exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await main.getByRole('button', { name: messages.startGame, exact: true }).click();
    await expect(main.getByRole('timer')).toBeVisible();
    await layout(`games/${game.id}/active`);
    let wrong = 0;
    let total = game.mechanic === 'match' ? 4 : game.mechanic === 'guess' ? 1 : game.mechanic === 'order' ? SENTENCE_ORDERS.length : 8;
    if (game.mechanic === 'match') {
      const visibleWords = [];
      for (const word of VOCABULARY) if (await main.getByRole('button', { name: word.word, exact: true }).count()) visibleWords.push(word);
      await main.getByRole('button', { name: visibleWords[0].word, exact: true }).click();
      await main.getByRole('button', { name: messages[visibleWords[1].meaningKey], exact: true }).click();
      await expect(main.getByText(messages.matchWrong, { exact: true })).toBeVisible();
      for (const word of visibleWords) {
        await main.getByRole('button', { name: word.word, exact: true }).click();
        await main.getByRole('button', { name: messages[word.meaningKey], exact: true }).click();
      }
    } else {
      for (let index = 0; index < total; index++) {
        if (game.mechanic === 'order') {
          for (const token of SENTENCE_ORDERS[index].tokens) await main.getByRole('button', { name: token, exact: true }).click();
          await main.getByRole('button', { name: messages.check, exact: true }).click();
        } else if (game.mechanic === 'choice') {
          const prompt = await main.locator('p[lang="ja"]').last().innerText();
          const word = VOCABULARY.find(w => w.word === prompt);
          assert.ok(word);
          await main.getByRole('button').filter({ hasText: messages[word.meaningKey] }).click();
        } else {
          if (game.mechanic === 'listening') await main.getByRole('button', { name: messages.hint, exact: true }).click();
          const prompt = await (game.mechanic === 'meaning' ? main.locator('.text-center p').first() : main.locator('p[lang="ja"]').last()).innerText();
          const word = VOCABULARY.find(w => game.mechanic === 'meaning' ? messages[w.meaningKey] === prompt : w.word === prompt);
          assert.ok(word, `Word prompt available for ${game.id}`);
          if (index === 0 && game.mechanic === 'guess') {
            await main.getByRole('textbox', { name: messages.typeAnswer, exact: true }).fill('wrong'); await page.keyboard.press('Enter');
            await expect(main.getByText(messages.guessAgain, { exact: true })).toBeVisible();
          }
          const incorrect = index === 0 && game.mechanic === 'typing';
          await main.getByRole('textbox', { name: messages.typeAnswer, exact: true }).fill(incorrect ? 'wrong' : word.romaji);
          await page.keyboard.press('Enter');
          if (incorrect) { wrong++; await expect(main.getByText(label('incorrect', { answer: `${word.reading} · ${word.romaji}` }), { exact: true })).toBeVisible(); }
        }
        if (!(index === 0 && game.mechanic === 'typing')) await expect(main.getByText(messages.correct, { exact: true })).toBeVisible();
        await main.getByRole('button', { name: index + 1 === total ? messages.viewResults : messages.nextRound, exact: true }).click();
      }
    }
    await expect(main.getByText(messages.gameComplete, { exact: true })).toBeVisible();
    const state = await stored(page);
    assert.equal(state.gameResults.length, 1); assert.equal(state.gameResults[0].gameId, game.id);
    assert.equal(state.gameResults[0].correct, total - wrong); assert.equal(state.gameResults[0].total, total); assert.ok(state.gameResults[0].score > 0);
    await layout(`games/${game.id}/results`);
    await page.screenshot({ path: new URL(`${game.id}-dark-390.png`, root).pathname, fullPage: true });
    report.games.push(state.gameResults[0]);
    await main.getByRole('button', { name: messages.restart, exact: true }).click();
    await expect(main.getByRole('timer')).toBeVisible();
    await main.getByRole('button', { name: messages.quitGame, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: messages.cancel, exact: true }).click();
    await expect(main.getByRole('timer')).toBeVisible();
    await main.getByRole('button', { name: messages.quitGame, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: messages.leave, exact: true }).click();
    await expect(main.getByRole('button', { name: messages.startGame, exact: true })).toBeVisible();
    assert.equal((await stored(page)).gameResults.length, 1, 'abandoning does not fabricate a result');
    await go('games'); await expect(main.getByText(label('gameRecord', { score: state.gameResults[0].score }), { exact: true })).toBeVisible();
  }, { width: 390, height: 844 });
}

report.completedAt = new Date().toISOString();
report.summary = { passed: report.checks.filter(check => check.passed).length, failed: report.failures.length, gamesCompleted: new Set(report.games.map(game => game.gameId)).size, gamesExpected: GAMES.length, layouts: report.layouts.length, consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length };
await saveReport();
await browser.close();
console.log(JSON.stringify(report.summary, null, 2));
if (report.failures.length || report.consoleErrors.length || report.pageErrors.length || report.summary.gamesCompleted !== GAMES.length) process.exitCode = 1;
