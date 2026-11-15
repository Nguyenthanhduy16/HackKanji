import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const report={checks:[],errors:[],consoleErrors:[],externalRequests:[],writeRequests:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['microphone']});
const page=await context.newPage();
page.setDefaultTimeout(7000);
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:3000/'))report.externalRequests.push(r.url());if(!['GET','HEAD'].includes(r.method()))report.writeRequests.push({method:r.method(),url:r.url()});});
const main=page.locator('main');
async function check(name,fn){try{const detail=await fn();report.checks.push({name,pass:true,detail});}catch(e){report.checks.push({name,pass:false,error:e.message});}console.log(JSON.stringify(report.checks.at(-1)));}
async function visit(route){const response=await page.goto(`http://localhost:3000/${route}`,{waitUntil:'networkidle',timeout:45000});assert.equal(response.status(),200);}
async function size(width){await page.setViewportSize({width,height:900});await page.waitForTimeout(400);}
const output=process.env.LESSON_QA_OUTPUT||'qa/lessons-integration.json';
try{
 await visit('vi/listening');
 await check('compact catalogue cards',async()=>{
  const metrics=await main.locator('article').evaluateAll(cards=>cards.map(card=>{const body=card.children[1];const title=body.children[0];const footer=body.children[1];const rect=e=>e.getBoundingClientRect();return {width:rect(card).width,height:rect(card).height,bodyHeight:rect(body).height,titleHeight:rect(title).height,titles:body.querySelectorAll('a>span').length,footerInside:rect(footer).bottom<=rect(body).bottom};}));
  report.cardMetrics=metrics;assert.equal(metrics.length,30);assert.ok(metrics.every(m=>m.width===260&&m.titleHeight<=40&&m.titles===1&&m.bodyHeight<=86&&m.footerInside),JSON.stringify(metrics[0]));return metrics[0];
 });
 await check('all local MP3 files decode',async()=>{
  const manifest=JSON.parse(await fs.readFile('public/lessons/audio-manifest.json','utf8'));
  const entries=Object.entries(manifest);assert.equal(entries.length,90);
  const decoded=[];
  for(let start=0;start<entries.length;start+=10){const batch=await page.evaluate(async entries=>{const audio=new AudioContext();try{return await Promise.all(entries.map(async([id,expected])=>{const response=await fetch(`/lessons/audio/${id}.mp3`);const buffer=await response.arrayBuffer();const bytes=buffer.byteLength;const decoded=await audio.decodeAudioData(buffer);return{id,status:response.status,bytes,duration:decoded.duration,expected,channels:decoded.numberOfChannels};}));}finally{await audio.close();}},entries.slice(start,start+10));decoded.push(...batch);}
  report.audioFiles=decoded;assert.ok(decoded.every(a=>a.status===200&&a.bytes>100&&a.duration>0&&Math.abs(a.duration-a.expected)<.2));return{expected:entries.length,decoded:decoded.length};
 });
 for(const locale of ['vi','en','ja']){
  for(const route of ['practice','listening','speaking','listening/morning-coffee','speaking/morning-coffee']){
   await visit(`${locale}/${route}`);
   await check(`${locale}/${route} responsive and localized`,async()=>{
    const layouts=[];for(const width of [320,390,768,1024,1440]){await size(width);const metric=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,missing:document.body.innerText.match(/(?:lessons|social|common)\.[a-zA-Z][a-zA-Z0-9_.]*/g)||[]}));layouts.push(metric);}
    assert.ok(layouts.every(l=>l.scrollWidth<=l.width&&l.missing.length===0),JSON.stringify(layouts));return layouts;
   });
  }
 }
 await visit('en/speaking/morning-coffee');
 await check('furigana and translation toggles',async()=>{
  assert.ok(await main.locator('ruby').count()>0);await main.getByRole('button',{name:'Furigana',exact:true}).click();assert.equal(await main.locator('ruby').count(),0);await main.getByRole('button',{name:'Furigana',exact:true}).click();assert.ok(await main.locator('ruby').count()>0);
  const translation=main.getByText('Chào buổi sáng.',{exact:true});assert.equal(await translation.count(),2);await main.getByRole('button',{name:'Translation',exact:true}).click();assert.equal(await translation.count(),0);await main.getByRole('button',{name:'Translation',exact:true}).click();assert.equal(await translation.count(),2);return true;
 });
 await check('transcript and mobile artwork toggles',async()=>{
  await main.getByRole('button',{name:'Hide transcript',exact:true}).click();assert.equal(await main.getByRole('heading',{name:'Transcript',exact:true}).count(),0);await main.getByRole('button',{name:'Show transcript',exact:true}).click();assert.equal(await main.getByRole('heading',{name:'Transcript',exact:true}).count(),1);
  await size(390);await main.getByRole('button',{name:'Hide artwork',exact:true}).click();assert.equal(await main.locator('img').count(),0);await main.getByRole('button',{name:'Show artwork',exact:true}).click();assert.equal(await main.locator('img').count(),1);return true;
 });
 await size(1440);
 await check('continuous native playback advances sentence',async()=>{
  await main.getByRole('switch').click();await main.getByRole('button',{name:'Start listening',exact:true}).click();await page.waitForFunction(()=>document.querySelector('main audio')?.currentSrc.includes('morning-coffee-2.mp3')&&document.querySelector('main audio').currentTime>.1);await main.locator('audio').first().evaluate(a=>a.pause());return true;
 });
 await visit('en/speaking/morning-coffee');
 await check('replay pauses the recorded take',async()=>{
  await main.getByRole('button',{name:'Record',exact:true}).click();await main.getByRole('button',{name:'Stop recording',exact:true}).waitFor();await page.waitForTimeout(2400);await main.getByRole('button',{name:'Stop recording',exact:true}).click();await main.locator('audio[controls]').waitFor();await main.getByRole('button',{name:'Play my recording',exact:true}).click();await page.waitForFunction(()=>document.querySelector('audio[controls]')?.currentTime>.1);await main.getByRole('button',{name:'Replay',exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('main audio')?.currentTime>.1);assert.equal(await main.locator('audio[controls]').evaluate(a=>a.paused),true);return true;
 });
 await check('shadowing updates the shared daily mission',async()=>{
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('nhaikanji-study-v1')).state.missionsProgress[3]);assert.ok(progress>=1);return progress;
 });
 await visit('en/listening/morning-coffee');
 await check('lesson comments persist locally across modes',async()=>{
  const comments=main.locator('details').filter({has:page.locator('summary',{hasText:'Comments'})});assert.equal(await comments.count(),1);await comments.locator('summary').click();await comments.getByRole('textbox').fill('Lesson QA local comment');await comments.getByRole('button',{name:'Save comment',exact:true}).click();assert.ok(await comments.getByText('Lesson QA local comment',{exact:true}).isVisible());await comments.locator('summary').click();assert.equal(await comments.getByRole('textbox').isVisible(),false);await visit('en/speaking/morning-coffee');const persisted=main.locator('details').filter({has:page.locator('summary',{hasText:'Comments'})});await persisted.locator('summary').click();assert.ok(await persisted.getByText('Lesson QA local comment',{exact:true}).isVisible());return true;
 });
 await check('no browser errors or external writes',async()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.writeRequests,[]);assert.deepEqual(report.externalRequests,[]);return true;});
}catch(error){report.checks.push({name:'QA harness completed',pass:false,error:error.stack});}finally{report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.checks.filter(c=>!c.pass).length;await fs.mkdir('qa',{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({output,passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;}
