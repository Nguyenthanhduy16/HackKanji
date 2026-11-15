import {chromium,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile,open} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {setupAccountDb} from './account-database';
import {emptyProgressData} from '../src/lib/account-data';

async function main(){
 await setupAccountDb();
 const db=new PrismaClient({datasourceUrl:process.env.DATABASE_URL});
 const ids=[`account_shell_${randomUUID()}`,`account_shell_${randomUUID()}`],tokens=ids.map(()=>randomBytes(32).toString('hex'));
 const probe=createServer();await new Promise<void>(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=(probe.address() as {port:number}).port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
 const origin=`http://127.0.0.1:${port}`;const checks:string[]=[],errors:string[]=[];
 await mkdir('.local/account-test',{recursive:true});const log=await open('.local/account-test/full-app.log','w');
 const env={...process.env,AUTH_URL:origin,AUTH_SECRET:randomBytes(48).toString('base64url'),AUTH_GOOGLE_ID:'local-test.invalid',AUTH_GOOGLE_SECRET:'local-test-only',AUTH_EMAIL_SERVER:'',AUTH_EMAIL_FROM:'',AUTH_TRUST_HOST:'true'};
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:process.cwd(),env,stdio:['ignore',log.fd,log.fd]});
 let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
 try{
  for(let i=0;i<ids.length;i++){await db.user.create({data:{id:ids[i],name:`Account shell fixture ${i}`,isPublic:false}});await db.session.create({data:{sessionToken:tokens[i],userId:ids[i],expires:new Date(Date.now()+600000)}});}
  const snapshot=emptyProgressData();snapshot.study.name='Tài khoản QA';snapshot.study.xp=321;snapshot.social.notes=[{id:'qa-note',title:'Ghi chú tài khoản',body:'Nội dung riêng tư',tag:'N5',updatedAt:new Date().toISOString()}];await db.progressSnapshot.create({data:{userId:ids[0],version:1,data:JSON.parse(JSON.stringify(snapshot))}});
  const deadline=Date.now()+30000;while(true){if(child.exitCode!==null)throw new Error('Production test server exited');try{const response=await fetch(origin+'/api/health');if(response.ok&&(await response.json()).authConfigured)break}catch{}if(Date.now()>deadline)throw new Error('Production test server unavailable');await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['microphone']});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>void d.accept());
  await page.goto(origin+'/vi/settings',{waitUntil:'networkidle'});await expect(page.getByTestId('account-settings')).toBeVisible();await expect(page.getByRole('link',{name:'Kết nối tài khoản',exact:true})).toBeVisible();checks.push('Settings renders configured signed-out controls');
  await context.addCookies([{name:'authjs.session-token',value:tokens[0],url:origin}]);await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Khôi phục từ tài khoản',exact:true}).click();await page.getByText('Đã khôi phục bản sao lưu trên thiết bị này.',{exact:true}).waitFor();await expect(page.getByLabel('Tên hiển thị',{exact:true})).toHaveValue('Tài khoản QA');checks.push('Real Settings restores a private database snapshot');
  await page.getByLabel('Tên hiển thị',{exact:true}).fill('Tài khoản QA đã sửa');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.getByRole('button',{name:'Lưu vào tài khoản',exact:true}).click();await page.getByText('Đã lưu bản sao riêng tư vào tài khoản. Thay đổi tiếp theo cần lưu lại.',{exact:true}).waitFor();assert.equal((await db.progressSnapshot.findUniqueOrThrow({where:{userId:ids[0]}})).version,2);checks.push('Save from Settings is read back in PostgreSQL');
  await page.getByLabel(/^Ngôn ngữ hiển thị/).selectOption('en');await page.waitForURL('**/en/settings');await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('Tài khoản QA đã sửa');checks.push('Locale navigation retains scoped account data');
  await page.goto(origin+'/vi/listening/morning-coffee',{waitUntil:'networkidle'});
  await page.locator('details').filter({has:page.locator('summary',{hasText:'Ghi chú của tôi'})}).locator('summary').click();
  await page.getByRole('textbox',{name:'Ghi chú của tôi',exact:true}).fill('Ghi chú riêng A');
  await page.locator('#dictation-answer').fill('まだ書いています');
  const answerNode=await page.locator('#dictation-answer').elementHandle();
  const noteNode=await page.getByRole('textbox',{name:'Ghi chú của tôi',exact:true}).elementHandle();
  let release!:()=>void;let seen!:()=>void;
  const hold=new Promise<void>(resolve=>{release=resolve;}),requested=new Promise<void>(resolve=>{seen=resolve;});
  await page.route('**/api/progress',async route=>{seen();await hold;await route.continue().catch(()=>{});});
  try{
    const response=page.waitForResponse(r=>r.url().endsWith('/api/progress')).catch(()=>null);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await requested;await page.waitForTimeout(50);
    assert.equal(await answerNode!.evaluate(node=>node.isConnected),true,'pending focus must preserve the actual dictation textarea');
    release();await response;await page.waitForTimeout(50);
    assert.equal(await answerNode!.evaluate(node=>node.isConnected),true);
    assert.equal(await noteNode!.evaluate(node=>node.isConnected),true);
    await expect(page.locator('#dictation-answer')).toHaveValue('まだ書いています');
    await expect(page.getByRole('textbox',{name:'Ghi chú của tôi',exact:true})).toHaveValue('Ghi chú riêng A');
    checks.push('Actual dictation input and unsaved notes survive delayed same-account focus');
  }finally{release();await page.unrouteAll({behavior:'wait'});}
  await page.getByRole('button',{name:'Lưu ghi chú',exact:true}).click();
  await page.goto(origin+'/vi/speaking/morning-coffee',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Thu âm',exact:true}).click();
  await page.getByRole('button',{name:'Dừng thu',exact:true}).waitFor();await page.waitForTimeout(700);
  await page.getByRole('button',{name:'Dừng thu',exact:true}).click();
  const take=page.locator('main audio[controls]');await take.waitFor();
  const takeNode=await take.elementHandle(),takeUrl=await take.getAttribute('src');
  assert.ok(takeUrl?.startsWith('blob:'));
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/progress'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await refreshed;await page.waitForTimeout(50);
  assert.equal(await takeNode!.evaluate(node=>node.isConnected),true);
  assert.equal(await take.getAttribute('src'),takeUrl);
  assert.ok(await page.evaluate(async url=>(await (await fetch(url!)).blob()).size,takeUrl));
  await page.route('**/api/progress',route=>route.abort());
  const failed=page.waitForEvent('requestfailed',r=>r.url().endsWith('/api/progress'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await failed;await page.waitForTimeout(50);
  assert.equal(await takeNode!.evaluate(node=>node.isConnected),true);
  assert.equal(await take.getAttribute('src'),takeUrl);
  await page.unroute('**/api/progress');
  checks.push('Actual recording survives successful and failed background account checks');
  await page.goto(origin+'/vi/listening/morning-coffee',{waitUntil:'networkidle'});
  await context.addCookies([{name:'authjs.session-token',value:tokens[1],url:origin}]);await page.reload({waitUntil:'networkidle'});await page.locator('details').filter({has:page.locator('summary',{hasText:'Ghi chú của tôi'})}).locator('summary').click();await expect(page.getByRole('textbox',{name:'Ghi chú của tôi',exact:true})).toHaveValue('');checks.push('Player notes do not leak across authenticated accounts');
  await page.goto(origin+'/vi/settings',{waitUntil:'networkidle'});await expect(page.getByLabel('Tên hiển thị',{exact:true})).not.toHaveValue('Tài khoản QA đã sửa');await page.getByTestId('account-settings').getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.getByRole('link',{name:'Kết nối tài khoản',exact:true})).toBeVisible();checks.push('Logout restores anonymous state in the full app');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);checks.push('Integrated Settings remains responsive and has no page errors');
  await writeFile('qa/account-app.json',JSON.stringify({passed:true,checks,errors,externalOAuthOrEmail:false},null,2));console.log(JSON.stringify({passed:true,checks},null,2));
 }finally{await browser?.close();if(child.exitCode===null){const exited=once(child,'exit');child.kill('SIGTERM');const timeout=setTimeout(()=>child.kill('SIGKILL'),5000);await exited;clearTimeout(timeout);}await log.close();await db.user.deleteMany({where:{id:{in:ids}}});assert.equal(await db.user.count({where:{id:{in:ids}}}),0);await db.$disconnect();}
}
main().catch(async error=>{console.error(error.name,error.message);await writeFile('qa/account-app.json',JSON.stringify({passed:false,error:error.message},null,2));process.exitCode=1;});
