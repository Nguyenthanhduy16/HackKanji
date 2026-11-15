import {chromium,expect} from '@playwright/test';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

/** Diagnostic-only harness: never shipped as a lesson or route. */
export async function runYouTubeBrowserQA(){
  const report:any={fakeBrowser:[],realPublicAPI:{},errors:[]};
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {NextIntlClientProvider} from 'next-intl';
    import {LessonPlayer} from './src/features/lessons/player';
    import {lessons} from './src/lib/lessons';
    import {usePlayerStore} from './src/lib/player-store';
    import lessonMessages from './src/messages/lessons.en.json';
    import social from './src/messages/social.en.json';
    const testLesson={...lessons[0],id:'qa-youtube',source:'YOUTUBE',youtubeId:'abcdefghijk',sentences:lessons[0].sentences.map((s,i)=>({...s,startSec:10+i*10,endSec:14+i*10}))};
    lessons.push(testLesson);
    window.qaStore=usePlayerStore;const root=createRoot(document.getElementById('root'));window.qaUnmount=()=>root.unmount();
    window.qaRender=(mode='listening',id='qa-youtube')=>root.render(<NextIntlClientProvider locale="en" messages={{lessons:lessonMessages,social,common:{close:'Close'}}}><LessonPlayer key={mode+id} lessonId={id} mode={mode}/></NextIntlClientProvider>);
    window.qaRender();`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext();const page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(error.message));
    await page.route('**/__youtube-qa',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
    await page.goto('http://localhost:3000/__youtube-qa');
    await page.addScriptTag({content:'window.__name=(value)=>value;window.process={env:{NODE_ENV:"production"}};'});
    await page.evaluate(()=>{
      const w=window as any;w.qaCalls=[];w.qaPlayers=[];
      w.YT={Player:class {
        time=0;options:any;dead=false;
        constructor(element:HTMLElement,options:any){this.options=options;w.qaPlayers.push(this);const frame=document.createElement('iframe');frame.title='Explicit fake IFrame API';element.replaceWith(frame);queueMicrotask(()=>options.events.onReady({target:this}));}
        playVideo(){w.qaCalls.push(['play']);this.options.events.onStateChange({data:1});}
        pauseVideo(){w.qaCalls.push(['pause']);this.options.events.onStateChange({data:2});}
        seekTo(t:number){this.time=t;w.qaCalls.push(['seek',t]);}
        getCurrentTime(){return this.time;}getDuration(){return 100;}
        getAvailablePlaybackRates(){return [.5,.75,1,1.25,1.5];}
        setPlaybackRate(r:number){w.qaCalls.push(['rate',r]);}
        setVolume(v:number){w.qaCalls.push(['volume',v]);}
        destroy(){this.dead=true;w.qaCalls.push(['destroy']);}
      }};
    });
    await page.addScriptTag({content:bundle.outputFiles[0].text});
    await expect(page.getByText('YouTube sentence clip',{exact:true})).toBeVisible();
    assert.equal(await page.evaluate(()=>(window as any).qaCalls.some((c:any)=>c[0]==='play')),false);
    await page.getByRole('button',{name:'Start listening',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>(window as any).qaPlayers[0].time)).toBe(10);
    await page.getByRole('slider',{name:'Audio position',exact:true}).fill('2');
    assert.equal(await page.evaluate(()=>(window as any).qaPlayers[0].time),12);
    await page.getByRole('combobox',{name:'Playback speed',exact:true}).selectOption('0.75');
    await expect.poll(()=>page.evaluate(()=>(window as any).qaCalls.some((c:any)=>c[0]==='rate'&&c[1]===.75))).toBe(true);
    await page.getByRole('slider',{name:'Volume',exact:true}).fill('0.4');
    await expect.poll(()=>page.evaluate(()=>(window as any).qaCalls.some((c:any)=>c[0]==='volume'&&c[1]===40))).toBe(true);
    await page.evaluate(()=>(window as any).qaPlayers[0].time=14.2);
    await expect(page.getByRole('button',{name:'Start listening',exact:true})).toBeVisible();
    assert.equal(await page.evaluate(()=>(window as any).qaStore.getState().position),4);
    await page.getByRole('button',{name:'Replay',exact:true}).first().click();
    assert.equal(await page.evaluate(()=>(window as any).qaPlayers[0].time),10);
    await page.getByRole('button',{name:'Loop sentence',exact:true}).click();
    await page.evaluate(()=>(window as any).qaPlayers[0].time=14.1);
    await expect.poll(()=>page.evaluate(()=>(window as any).qaPlayers[0].time)).toBe(10);
    report.fakeBrowser.push({name:'dictation: explicit fake iframe, no autoplay, seek, rate, volume, pause, replay, loop',passed:true});
    await page.evaluate(()=>(window as any).qaRender('speaking'));
    await expect(page.getByRole('switch',{name:'Pause after each sentence'})).toBeVisible();
    await page.getByRole('switch',{name:'Pause after each sentence'}).click();
    await page.getByRole('button',{name:'Start listening',exact:true}).click();
    await page.evaluate(()=>(window as any).qaPlayers.at(-1).time=14.1);
    await expect.poll(()=>page.evaluate(()=>(window as any).qaStore.getState().sentenceIndex)).toBe(1);
    await expect.poll(()=>page.evaluate(()=>(window as any).qaPlayers.at(-1).time)).toBe(20);
    assert.equal(await page.evaluate(()=>(window as any).qaStore.getState().playing),true);
    report.fakeBrowser.push({name:'shadowing: auto-advance updates range before playback',passed:true});
    await page.evaluate(()=>(window as any).qaPlayers.at(-1).options.events.onError({data:150}));
    await expect(page.getByText('YouTube is unavailable. Using the included lesson audio.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Start listening',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('audio')!.currentTime>.05);
    assert.equal(await page.locator('iframe').count(),0);
    report.fakeBrowser.push({name:'iframe error selects and plays original local MP3',passed:true});
    await page.evaluate(()=>(window as any).qaRender('listening','morning-coffee'));
    await expect(page.getByText('Included lesson audio',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Start listening',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('audio')!.currentTime>.05);
    assert.equal(await page.locator('script[src*="youtube"]').count(),0);
    report.fakeBrowser.push({name:'AUDIO retains native playback and loads no YouTube script',passed:true});
    await page.evaluate(()=>(window as any).qaUnmount());
    assert.equal(await page.evaluate(()=>(window as any).qaPlayers.every((p:any)=>p.dead)),true);
    await context.close();
    const blocked=await browser.newContext();const offlinePage=await blocked.newPage();
    offlinePage.on('pageerror',error=>report.errors.push(error.message));
    await offlinePage.route('**/__youtube-qa',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
    await offlinePage.route('https://www.youtube.com/**',route=>route.abort('internetdisconnected'));
    await offlinePage.goto('http://localhost:3000/__youtube-qa');
    await offlinePage.addScriptTag({content:'window.process={env:{NODE_ENV:"production"}};'});
    await offlinePage.addScriptTag({content:bundle.outputFiles[0].text});
    await expect(offlinePage.getByText('YouTube is unavailable. Using the included lesson audio.',{exact:true})).toBeVisible();
    await offlinePage.getByRole('button',{name:'Start listening',exact:true}).click();
    await offlinePage.waitForFunction(()=>document.querySelector('audio')!.currentTime>.05);
    report.fakeBrowser.push({name:'blocked real API script falls back to playable local audio',passed:true});
    await blocked.close();

    // The official API example is diagnostic only; it is never added to lessons.
    const real=await browser.newContext();const p=await real.newPage();
    const network:any[]=[];p.on('response',r=>{if(/iframe_api|www-widgetapi|\/embed\//.test(r.url()))network.push({url:r.url(),status:r.status()});});
    p.on('requestfailed',r=>{if(/iframe_api|www-widgetapi|\/embed\//.test(r.url()))network.push({url:r.url(),failure:r.failure()?.errorText});});
    await p.route('**/__youtube-real',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="diagnostic"></div><button id="play">Play diagnostic clip</button>'}));
    await p.goto('http://localhost:3000/__youtube-real');
    await p.addScriptTag({content:'window.__name=(value)=>value;'});
    const realErrors:string[]=[];p.on('pageerror',error=>realErrors.push(error.message));
    const diagnosticBundle=await build({stdin:{contents:`import {loadYouTubeAPI} from './src/features/lessons/youtube';import {createClipTransport,youtubePlayerOptions} from './src/lib/youtube';window.qaDiagnostic={loadYouTubeAPI,createClipTransport,youtubePlayerOptions};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
    await p.addScriptTag({content:diagnosticBundle.outputFiles[0].text});
    try{
      await p.evaluate(()=>{const w=window as any;w.qaReal={ready:false,states:[],errors:[],ended:0};void w.qaDiagnostic.loadYouTubeAPI().then((api:any)=>{w.diagnostic=new api.Player(document.getElementById('diagnostic'),{...w.qaDiagnostic.youtubePlayerOptions('M7lc1UVf-VE',location.origin),events:{onReady:(e:any)=>{w.qaTransport=w.qaDiagnostic.createClipTransport(e.target,{start:10,end:12,duration:2},{onPosition:(position:number)=>w.qaReal.position=position,onPlaying:()=>{},onEnded:()=>w.qaReal.ended++});w.qaTransport.seek(0);w.qaReal.ready=true;setInterval(()=>w.qaTransport.tick(),40);},onStateChange:(e:any)=>{w.qaReal.states.push(e.data);w.qaTransport?.onState(e.data);},onError:(e:any)=>w.qaReal.errors.push(e.data)}});}).catch((e:any)=>w.qaReal.errors.push(String(e)));document.getElementById('play')!.onclick=()=>w.qaTransport.play();});
      await p.waitForFunction(()=>(window as any).qaReal.ready,{},{timeout:20000});
      await p.waitForTimeout(600);
      report.realPublicAPI.noAutoplay=await p.evaluate(()=>(window as any).diagnostic.getPlayerState()!==1);
      assert.equal(report.realPublicAPI.noAutoplay,true);
      await p.locator('#play').click();
      await p.waitForFunction(()=>(window as any).qaReal.ended===1||(window as any).qaReal.errors.length,{},{timeout:12000}).catch(()=>{});
      await p.waitForFunction(()=>(window as any).diagnostic.getPlayerState()===2,{},{timeout:3000}).catch(()=>{});
      report.realPublicAPI={...report.realPublicAPI,...await p.evaluate(()=>({...((window as any).qaReal),time:(window as any).diagnostic.getCurrentTime(),playerState:(window as any).diagnostic.getPlayerState(),iframe:document.querySelector('iframe')?.src}))};
      report.realPublicAPI.clipPauseVerified=report.realPublicAPI.ended===1&&report.realPublicAPI.playerState===2;
      if(report.realPublicAPI.clipPauseVerified){
        await p.evaluate(()=>{const w=window as any;document.getElementById('play')!.onclick=()=>w.qaTransport.replay();});
        await p.locator('#play').click();
        await p.waitForFunction(()=>(window as any).qaReal.ended===2,{},{timeout:12000});
        await p.waitForFunction(()=>(window as any).diagnostic.getPlayerState()===2,{},{timeout:3000});
        report.realPublicAPI.replayPauseVerified=true;
      }
    }catch(error){report.realPublicAPI={...report.realPublicAPI,blocker:String(error),state:await p.evaluate(()=>(window as any).qaReal)};if(error instanceof assert.AssertionError)throw error;}
    report.realPublicAPI.network=network;report.realPublicAPI.pageErrors=realErrors;
    report.realPublicAPI.document=await p.evaluate(()=>({scripts:[...document.scripts].map(s=>s.src).filter(Boolean),iframe:document.querySelector('iframe')?.src,apiLoaded:!!(window as any).YT?.Player}));
    await real.close();
    assert.deepEqual(report.errors,[]);
  }catch(error){report.failure=String(error);throw error;}
  finally{await browser.close();await writeFile('qa/youtube.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
}
