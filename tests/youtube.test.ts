import test from 'node:test';
import assert from 'node:assert/strict';
import {clipRange,clipPosition,createClipTransport,youtubePlayerOptions,type YouTubePlayer} from '../src/lib/youtube';

// This fake exercises our IFrame API command/state contract. It is not evidence
// that YouTube's network, real media decoding, or embed permissions succeeded.
class FakeIframe implements YouTubePlayer {
  time=0;duration=100;calls:(string|number)[][]=[];
  playVideo(){this.calls.push(['play']);}
  pauseVideo(){this.calls.push(['pause']);}
  seekTo(seconds:number){this.time=seconds;this.calls.push(['seek',seconds]);}
  getCurrentTime(){return this.time;}
  getDuration(){return this.duration;}
  getAvailablePlaybackRates(){return [.5,1,1.5];}
  setPlaybackRate(rate:number){this.calls.push(['rate',rate]);}
  setVolume(volume:number){this.calls.push(['volume',volume]);}
  destroy(){this.calls.push(['destroy']);}
}

test('fake iframe protocol: initial seek is deferred until a user requests play',()=>{
  const iframe=new FakeIframe();const transport=createClipTransport(iframe,clipRange({startSec:10,endSec:14})!,{onPosition:()=>{},onPlaying:()=>{},onEnded:()=>{}});
  transport.seek(0);assert.deepEqual(iframe.calls,[]);
  transport.play();assert.equal(iframe.time,10);assert.deepEqual(iframe.calls.at(-1),['play']);
});

test('fake iframe protocol: cue, clamped seeks, end pause, replay and cleanup',()=>{
  const iframe=new FakeIframe();let ended=0;let position=0;
  const transport=createClipTransport(iframe,clipRange({startSec:10,endSec:14})!,{onPosition:value=>position=value,onPlaying:()=>{},onEnded:()=>ended++});
  assert.equal(iframe.calls.some(call=>call[0]==='play'),false);
  transport.play();assert.equal(iframe.time,10);
  transport.seek(-100);assert.equal(iframe.time,10);
  transport.seek(100);assert.equal(iframe.time,14);
  transport.play();assert.equal(iframe.time,10);
  iframe.time=14.15;transport.tick();
  assert.equal(position,4);assert.equal(iframe.time,14);assert.equal(ended,1);
  transport.tick();assert.equal(ended,1);
  assert.deepEqual(iframe.calls.at(-1),['pause']);
  transport.replay();assert.equal(iframe.time,10);
  transport.setRate(.75);assert.deepEqual(iframe.calls.at(-1),['rate',.5]);
  transport.setVolume(3);assert.deepEqual(iframe.calls.at(-1),['volume',100]);
  transport.destroy();transport.play();assert.deepEqual(iframe.calls.at(-1),['destroy']);
});

test('fake iframe protocol: loop stays within clip and does not advance sentence',()=>{
  const iframe=new FakeIframe();let ended=0;
  const transport=createClipTransport(iframe,clipRange({startSec:4,endSec:6})!,{onPosition:()=>{},onPlaying:()=>{},onEnded:()=>ended++});
  transport.setLoop(true);transport.play();iframe.time=6;transport.tick();
  assert.equal(iframe.time,4);assert.equal(ended,0);assert.deepEqual(iframe.calls.at(-1),['play']);
  transport.stop();iframe.time=80;transport.tick();assert.equal(ended,0);
});

test('iframe options bind origin, enable API, and never request autoplay',()=>{
  const options=youtubePlayerOptions('abcdefghijk','http://localhost:3000');
  assert.equal(options.playerVars.origin,'http://localhost:3000');
  assert.equal(options.playerVars.enablejsapi,1);assert.equal(options.playerVars.autoplay,0);assert.equal(options.playerVars.rel,0);
  assert.throws(()=>youtubePlayerOptions('not an ID','http://localhost:3000'));
});

test('fake iframe protocol: changing sentence stops playback before resetting the clip',()=>{
  const iframe=new FakeIframe();let ended=0;
  const transport=createClipTransport(iframe,clipRange({startSec:4,endSec:6})!,{onPosition:()=>{},onPlaying:()=>{},onEnded:()=>ended++});
  transport.play();transport.setClip(clipRange({startSec:20,endSec:23})!);
  assert.equal(iframe.time,20);iframe.time=24;transport.tick();assert.equal(ended,0);
});

test('fake asynchronous iframe: stale video time after replay cannot end the new clip',()=>{
  class AsyncIframe extends FakeIframe {pending=0;seekTo(seconds:number){this.pending=seconds;this.calls.push(['seek',seconds]);}}
  const iframe=new AsyncIframe();iframe.time=40;let ended=0;
  const transport=createClipTransport(iframe,clipRange({startSec:10,endSec:14})!,{onPosition:()=>{},onPlaying:()=>{},onEnded:()=>ended++});
  transport.replay();transport.tick();assert.equal(ended,0);
  iframe.time=10.1;transport.tick();iframe.time=14.1;transport.tick();assert.equal(ended,1);
});

test('fake iframe protocol: a stale ended event after seek does not complete the clip',()=>{
  class AsyncIframe extends FakeIframe {seekTo(seconds:number){this.calls.push(['seek',seconds]);}}
  const iframe=new AsyncIframe();iframe.time=90;let ended=0;
  const transport=createClipTransport(iframe,clipRange({startSec:10,endSec:14})!,{onPosition:()=>{},onPlaying:()=>{},onEnded:()=>ended++});
  transport.replay();transport.onState(0);assert.equal(ended,0);
});

test('browser integration (explicit fake API) and real public API diagnostic',{skip:process.env.YOUTUBE_BROWSER_QA!=='1'},async()=>{
  const {runYouTubeBrowserQA}=await import('../qa/youtube-browser');
  await runYouTubeBrowserQA();
});

test('clip boundaries require a finite increasing authored range',()=>{
  assert.deepEqual(clipRange({startSec:12.5,endSec:18}),{start:12.5,end:18,duration:5.5});
  for(const value of [{},{startSec:-1,endSec:3},{startSec:3,endSec:3},{startSec:4,endSec:3},{startSec:0,endSec:Infinity},{startSec:NaN,endSec:2}])assert.equal(clipRange(value),null);
  const clip=clipRange({startSec:12.5,endSec:18})!;
  assert.equal(clipPosition(clip,-50),0);
  assert.equal(clipPosition(clip,15),2.5);
  assert.equal(clipPosition(clip,90),5.5);
});
