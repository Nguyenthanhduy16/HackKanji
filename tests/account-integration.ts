// Real Auth.js database sessions + actual route handlers, without a Next build.
import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import {randomBytes, randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {setupAccountDb} from './account-database';
import {emptyProgressData} from '../src/lib/account-data';

async function main() {
  await setupAccountDb();
  // These values never leave this loopback test harness; no OAuth or mail call.
  for (const key of Object.keys(process.env)) if (/^(AUTH_|NEXTAUTH_)/.test(key)) delete process.env[key];
  Object.assign(process.env, {AUTH_SECRET: randomBytes(48).toString('base64url'), AUTH_GOOGLE_ID: 'account-test.invalid', AUTH_GOOGLE_SECRET: 'account-test-only', AUTH_TRUST_HOST: 'true', NODE_ENV: 'production'});
  Object.assign(globalThis, {AsyncLocalStorage});
  const nativeRequire = createRequire(import.meta.url);
  const {workUnitAsyncStorage} = nativeRequire('next/dist/server/app-render/work-unit-async-storage.external.js') as typeof import('next/dist/server/app-render/work-unit-async-storage.external');
  const {createRequestStoreForAPI} = nativeRequire('next/dist/server/async-storage/request-store.js') as typeof import('next/dist/server/async-storage/request-store');
  const {workAsyncStorage} = nativeRequire('next/dist/server/app-render/work-async-storage.external.js') as typeof import('next/dist/server/app-render/work-async-storage.external');
  const {createWorkStore} = nativeRequire('next/dist/server/async-storage/work-store.js') as typeof import('next/dist/server/async-storage/work-store');
  const {NextRequest} = await import('next/server');
  const route = await import('../src/app/api/progress/route');
  const {handlers} = await import('../src/auth');
  const {getDb} = await import('../src/lib/server/db');
  const db = getDb();
  const ids = [randomUUID(), randomUUID()];
  const tokens = ids.map(() => randomBytes(32).toString('hex'));
  const checks: string[] = [];
  const check = async (name: string, fn: () => Promise<void>) => {await fn(); checks.push(name); console.log(`PASS ${name}`);};
  await mkdir('qa', {recursive: true});
  await writeFile('qa/account-sync.json', JSON.stringify({passed: false, status: 'running'}, null, 2));
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  await mkdir('.local/account-test', {recursive: true});
  await build({entryPoints: ['tests/account-browser-entry.ts'], bundle: true, platform: 'browser', jsx: 'automatic', outfile: '.local/account-test/client.js', define: {'process.env.NODE_ENV': '"production"'}});
  const server = createServer(async (req, res) => {
    try {
      if (!req.url?.startsWith('/api/')) {
        res.setHeader('Content-Type', req.url === '/client.js' ? 'application/javascript' : 'text/html');
        res.end(req.url === '/client.js' ? await readFile('.local/account-test/client.js') : '<div id="root"></div><script src="/client.js"></script>'); return;
      }
      const chunks: Buffer[] = []; for await (const part of req) chunks.push(Buffer.from(part));
      const request = new NextRequest(`${process.env.AUTH_URL}${req.url}`, {method: req.method, headers: req.headers as Record<string, string>, body: chunks.length ? Buffer.concat(chunks) : undefined});
      const context = createRequestStoreForAPI(request, new URL(request.url), {tags: [], expirationsByCacheKind: new Map()}, undefined, undefined);
      const work = createWorkStore({page: '/api/progress', renderOpts: {waitUntil: undefined, onClose: () => {}, onAfterTaskError: undefined, supportsDynamicResponse: true, experimental: {isRoutePPREnabled: false, cacheComponents: false, authInterrupts: false}}, buildId: 'account-harness', previouslyRevalidatedTags: []});
      const response = await workAsyncStorage.run(work, () => workUnitAsyncStorage.run(context, () => req.url?.startsWith('/api/auth/') ? handlers[req.method === 'POST' ? 'POST' : 'GET'](request) : route[req.method === 'PUT' ? 'PUT' : 'GET'](request)));
      res.statusCode = response.status; response.headers.forEach((value, key) => {if (key !== 'set-cookie') res.setHeader(key, value);});
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader('Set-Cookie', cookies);
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {console.error(error instanceof Error ? error.stack : 'Harness error'); res.statusCode = 500; res.end('{}');}
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as {port: number}).port}`; process.env.AUTH_URL = origin;
  const api = async (method = 'GET', body?: unknown, token?: string, extra: Record<string, string> = {}) => {
    const response = await fetch(`${origin}/api/progress`, {method, headers: {'Content-Type': 'application/json', Origin: origin, ...(token ? {Cookie: `authjs.session-token=${token}`} : {}), ...extra}, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)});
    return {status: response.status, body: await response.json(), cache: response.headers.get('cache-control')};
  };
  try {
    for (let i = 0; i < ids.length; i++) {await db.user.create({data: {id: ids[i], isPublic: false}}); await db.session.create({data: {sessionToken: tokens[i], userId: ids[i], expires: new Date(Date.now() + 300_000)}});}
    await check('unauthenticated read/write rejected and response not cached', async () => {assert.equal((await api()).status, 401); assert.equal((await api('PUT', {})).status, 401); assert.equal((await api()).cache, 'no-store');});
    const payload = {version: 0, data: emptyProgressData()}; payload.data.study.xp = 321;
    await check('real database session round-trip and account privacy', async () => {
      assert.equal((await api('PUT', payload, tokens[0], {'X-Progress-Owner': ids[0]})).status, 200);
      assert.equal((await api('GET', undefined, tokens[0])).body.snapshot.data.study.xp, 321);
      assert.equal((await api('GET', undefined, tokens[1])).body.snapshot, null);
    });
    await check('origin, owner race, stale version, malformed and oversized payloads rejected', async () => {
      const owner = {'X-Progress-Owner': ids[0]};
      assert.equal((await api('PUT', payload, tokens[0], {...owner, Origin: 'https://evil.invalid'})).status, 403);
      assert.equal((await api('PUT', payload, tokens[1], owner)).status, 409);
      assert.equal((await api('PUT', payload, tokens[0], owner)).status, 409);
      assert.equal((await api('PUT', {...payload, userId: ids[1]}, tokens[0], owner)).status, 400);
      assert.equal((await api('PUT', '{"version":1,"data":{"constructor":{}}}', tokens[0], owner)).status, 400);
      assert.equal((await api('PUT', 'x'.repeat(1_048_577), tokens[0], owner)).status, 413);
      assert.equal((await db.user.findUniqueOrThrow({where: {id: ids[0]}})).xp, 0);
    });
    browser = await chromium.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox']});
    const a = await browser.newContext(); const b = await browser.newContext();
    await a.addCookies([{name: 'authjs.session-token', value: tokens[0], url: origin}]);
    await b.addCookies([{name: 'authjs.session-token', value: tokens[0], url: origin}]);
    const p = await a.newPage(); const q = await b.newPage();
    p.on('pageerror', error => console.error('Browser:', error.message)); q.on('pageerror', error => console.error('Browser:', error.message));
    p.on('dialog', dialog => void dialog.accept()); q.on('dialog', dialog => void dialog.accept());
    await check('browser restores on a second device and saves manually', async () => {
      await p.goto(origin); await q.goto(origin);
      await p.getByRole('button', {name: 'Restore from account', exact: true}).click();
      await p.getByText('Account backup restored on this device.', {exact: true}).waitFor();
      assert.equal(await p.evaluate(() => (window as any).accountQA.read().study.xp), 321);
      await p.evaluate(() => (window as any).accountQA.xp(777));
      await p.getByRole('button', {name: 'Save to account', exact: true}).click();
      await p.getByText('Saved to your private account backup. Later changes need another save.', {exact: true}).waitFor();
      await q.getByRole('button', {name: 'Restore from account', exact: true}).click();
      await q.getByText('Account backup restored on this device.', {exact: true}).waitFor();
      assert.equal(await q.evaluate(() => (window as any).accountQA.read().study.xp), 777);
    });
    await check('same-account focus and visibility checks preserve mounted drafts',async()=>{
      await p.getByLabel('Unsaved lesson draft').fill('日本語の入力途中');
      const original=await p.getByLabel('Unsaved lesson draft').elementHandle();
      for(const event of ['focus','visibilitychange']){
        let release!:()=>void;let requested!:()=>void;
        const hold=new Promise<void>(resolve=>{release=resolve;});
        const seen=new Promise<void>(resolve=>{requested=resolve;});
        await p.route('**/api/progress',async route=>{requested();await hold;await route.continue();});
        try{
          const response=p.waitForResponse(r=>r.url().endsWith('/api/progress'));
          await p.evaluate(event=>{if(event==='focus')window.dispatchEvent(new Event('focus'));else document.dispatchEvent(new Event('visibilitychange'));},event);
          await seen;await p.waitForTimeout(30);
          assert.equal(await original!.evaluate(node=>node.isConnected),true,'identity refresh must not remove the active lesson');
          release();await response;await p.waitForTimeout(30);
          assert.equal(await original!.evaluate(node=>node.isConnected),true);
          assert.equal(await p.getByLabel('Unsaved lesson draft').inputValue(),'日本語の入力途中');
        }finally{release();await p.unroute('**/api/progress');}
      }
    });
    await check('failed identity refresh preserves offline draft and recovers',async()=>{
      const original=await p.getByLabel('Unsaved lesson draft').elementHandle();
      await p.route('**/api/progress',route=>route.abort());
      await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await p.getByText('Could not complete the request. No save or restore was confirmed. Check your connection and retry.',{exact:true}).waitFor();
      assert.equal(await original!.evaluate(node=>node.isConnected),true);
      assert.equal(await p.getByLabel('Unsaved lesson draft').inputValue(),'日本語の入力途中');
      await p.unroute('**/api/progress');
      const response=p.waitForResponse(r=>r.url().endsWith('/api/progress'));
      await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await response;
      assert.equal(await original!.evaluate(node=>node.isConnected),true);
    });
    await check('browser conflict requires explicit choice and network failure never confirms save', async () => {
      await p.evaluate(() => (window as any).accountQA.xp(888));
      await p.getByRole('button', {name: 'Save to account', exact: true}).click();
      await p.getByText('Saved to your private account backup. Later changes need another save.', {exact: true}).waitFor();
      await q.reload();
      await q.getByRole('button', {name: 'Save to account', exact: true}).click();
      await q.getByRole('button', {name: 'Keep local and replace account backup', exact: true}).waitFor();
      await q.getByRole('button', {name: 'Keep local and replace account backup', exact: true}).click();
      await q.getByText('Saved to your private account backup. Later changes need another save.', {exact: true}).waitFor();
      await q.route('**/api/progress', route => route.request().method() === 'PUT' ? route.abort() : route.continue());
      await q.getByRole('button', {name: 'Save to account', exact: true}).click();
      await q.getByText('Could not complete the request. No save or restore was confirmed. Check your connection and retry.', {exact: true}).waitFor();
    });
    await check('browser explicit demo import stays local until a save', async () => {
      await a.addCookies([{name: 'authjs.session-token', value: tokens[1], url: origin}]);
      await p.evaluate(() => window.dispatchEvent(new Event('focus')));
      await p.waitForFunction(() => (window as any).accountQA.read().study.xp === 0);
      assert.equal((await api('GET', undefined, tokens[1])).body.snapshot, null);
      await p.getByRole('button', {name: 'Import this browser’s demo data', exact: true}).click();
      await p.getByText('Browser data imported locally. Choose Save to account to upload it.', {exact: true}).waitFor();
      assert.equal(await p.evaluate(() => (window as any).accountQA.read().study.xp), 50);
      assert.equal((await api('GET', undefined, tokens[1])).body.snapshot, null);
    });
    await check('boundary remount retains account isolation and original anonymous data',async()=>{
      await p.evaluate(() => { (window as any).accountQA.xp(999); (window as any).accountQA.remount(); });
      await p.getByRole('button',{name:'Sign out',exact:true}).waitFor();
      assert.equal(await p.evaluate(()=>(window as any).accountQA.read().study.xp),999);
    });
    await check('browser logout returns original anonymous data', async () => {
      await p.getByRole('button', {name: 'Sign out', exact: true}).click();
      await p.getByRole('link', {name: 'Connect an account', exact: true}).waitFor();
      assert.equal(await p.evaluate(() => (window as any).accountQA.read().study.xp), 50);
    });
    await check('expired database session rejected', async () => {await db.session.update({where: {sessionToken: tokens[0]}, data: {expires: new Date(0)}}); assert.equal((await api('GET', undefined, tokens[0])).status, 401);});
    await check('unconfigured auth hides cloud controls and leaves demo data unchanged', async () => {
      delete process.env.AUTH_GOOGLE_ID; delete process.env.AUTH_GOOGLE_SECRET;
      assert.equal((await api()).status, 503);
      await p.reload();
      await p.waitForFunction(() => !document.body.textContent?.includes('Checking account'));
      assert.equal(await p.getByTestId('account-settings').count(), 0);
      assert.equal(await p.evaluate(() => (window as any).accountQA.read().study.xp), 50);
    });
    await mkdir('qa', {recursive: true});
    await writeFile('qa/account-sync.json', JSON.stringify({passed: true, mode: 'manual-private-backup', database: '127.0.0.1:5434/nhaikanji_account_test', checks, count: checks.length, authoritativeXpUnchanged: true, externalOAuthOrEmail: false}, null, 2));
  } finally {
    await browser?.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    await db.user.deleteMany({where: {id: {in: ids}}}); assert.equal(await db.user.count({where: {id: {in: ids}}}), 0); await db.$disconnect();
  }
}
main().catch(async error => {console.error(error.name, error.message); await writeFile('qa/account-sync.json', JSON.stringify({passed: false, error: error instanceof Error ? error.message : 'unknown'}, null, 2)).catch(() => {}); process.exitCode = 1;});
