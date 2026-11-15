import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
const pages = ['shop', 'leaderboard', 'community', 'profile', 'missions', 'my-notes', 'my-vocabulary', 'feedbacks', 'settings'];
try {
  for (const route of pages) {
    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto(`http://localhost:3000/vi/${route}`, {waitUntil: 'networkidle'});
    await page.locator('h1').waitFor();
    const desktop = await page.evaluate(() => ({heading: document.querySelector('h1')?.textContent, overflow: document.documentElement.scrollWidth > innerWidth, brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src), untranslated: /social\.[a-zA-Z]/.test(document.querySelector('main')?.textContent ?? '')}));
    await page.setViewportSize({width: 390, height: 844});
    const mobile = await page.evaluate(() => ({overflow: document.documentElement.scrollWidth > innerWidth, width: document.documentElement.scrollWidth}));
    results.push({route, desktop, mobile});
    console.log(JSON.stringify(results.at(-1)));
  }
  await fs.mkdir('src/features/social/qa', {recursive: true});
  await fs.writeFile('src/features/social/qa/smoke.json', JSON.stringify({results, errors}, null, 2));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.ok(results.every(result => !result.desktop.overflow && !result.desktop.brokenImages.length && !result.desktop.untranslated && !result.mobile.overflow));
} finally {await browser.close();}
