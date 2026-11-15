"use client";

import {useCallback,useEffect,useRef,useState,type RefObject} from 'react';
import type {LessonSentence} from '@/lib/lessons';
import {usePlayerStore} from '@/lib/player-store';
import {clipRange,createClipTransport,youtubePlayerOptions,type YouTubeAPI,type YouTubePlayer} from '@/lib/youtube';

type YouTubeWindow=Window&{YT?:YouTubeAPI;onYouTubeIframeAPIReady?:()=>void};
let apiPromise:Promise<YouTubeAPI>|null=null;
/** Shared script load; an error is retryable on the next player mount. */
export function loadYouTubeAPI():Promise<YouTubeAPI> {
  const host=window as YouTubeWindow;
  if(host.YT?.Player)return Promise.resolve(host.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
    const previous=host.onYouTubeIframeAPIReady;
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    const cleanup=()=>{clearTimeout(timeout);script.onerror=null;if(host.onYouTubeIframeAPIReady===ready)host.onYouTubeIframeAPIReady=previous;};
    const fail=()=>{cleanup();script.remove();apiPromise=null;reject(new Error('YouTube API unavailable'));};
    const ready=()=>{cleanup();try{previous?.();}finally{if(host.YT?.Player)resolve(host.YT);else fail();}};
    const timeout=setTimeout(fail,10000);host.onYouTubeIframeAPIReady=ready;script.onerror=fail;document.head.append(script);
  });
  return apiPromise;
}

export function YouTubeFrame({containerRef,title}:{containerRef:RefObject<HTMLDivElement|null>;title:string}) {
  // Keep the player visible; hiding third-party playback as background audio is
  // not supported. This wrapper owns a disposable API-managed child, not React's node.
  return <div ref={containerRef} role="group" aria-label={title} className="aspect-video min-h-[200px] w-full bg-black [&_iframe]:h-full [&_iframe]:min-h-[200px] [&_iframe]:w-full"/>;
}

export function useYouTubeAudio(sentence:LessonSentence,videoId:string|undefined,enabled:boolean,rate:number,volume:number,loop:boolean,onEnded:()=>void) {
  const containerRef=useRef<HTMLDivElement>(null);const transport=useRef<ReturnType<typeof createClipTransport>|null>(null);
  const [failed,setFailed]=useState(false);const [ready,setReady]=useState(false);const [error,setError]=useState('');
  const range=clipRange(sentence);const rangeRef=useRef(range);rangeRef.current=range;
  const settings=useRef({rate,volume,loop,onEnded});settings.current={rate,volume,loop,onEnded};
  const active=enabled&&!failed;
  const stop=useCallback(()=>transport.current?.stop(),[]);
  const play=useCallback(()=>{setError('');transport.current?.play();},[]);
  const seek=useCallback((seconds:number)=>transport.current?.seek(seconds),[]);
  const replay=useCallback(()=>{setError('');transport.current?.replay();},[]);
  useEffect(()=>{
    if(!active)return;
    if(!videoId||!rangeRef.current||!containerRef.current){setFailed(true);return;}
    let disposed=false;let player:YouTubePlayer|null=null;
    let interval:ReturnType<typeof setInterval>|undefined;
    let timeout:ReturnType<typeof setTimeout>|undefined;
    const fail=()=>{if(disposed)return;transport.current?.stop();setFailed(true);setReady(false);};
    const container=containerRef.current;const child=document.createElement('div');container.append(child);
    const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);
    void loadYouTubeAPI().then(api=>{
      if(disposed)return;
      timeout=setTimeout(fail,10000);
      player=new api.Player(child,{...youtubePlayerOptions(videoId,window.location.origin),events:{
        onReady:({target})=>{
          if(disposed)return;
          clearTimeout(timeout);const clip=rangeRef.current;if(!clip){fail();return;}
          const actualDuration=target.getDuration();if(actualDuration>0&&actualDuration<clip.end){fail();return;}
          const adapter=createClipTransport(target,clip,{
            onPosition:position=>usePlayerStore.getState().setPosition(position),
            onPlaying:playing=>usePlayerStore.getState().setPlaying(playing),
            onEnded:()=>settings.current.onEnded(),
          });
          transport.current=adapter;adapter.setRate(settings.current.rate);adapter.setVolume(settings.current.volume);adapter.setLoop(settings.current.loop);
          // Cue only: playback starts through a user gesture in the shared controls.
          setReady(true);
          interval=setInterval(()=>adapter.tick(),40);
        },
        onStateChange:({data})=>{if(!disposed)transport.current?.onState(data);},
        onError:fail,
        onAutoplayBlocked:()=>{if(!disposed){stop();setError('youtubePlayBlocked');}},
      }});
    }).catch(fail);
    return ()=>{
      disposed=true;clearInterval(interval);clearTimeout(timeout);document.removeEventListener('visibilitychange',hidden);
      if(transport.current){transport.current.destroy();transport.current=null;}else player?.destroy();
      container.replaceChildren();
    };
  },[active,videoId,stop]);
  useEffect(()=>{
    if(!active)return;
    if(!range){setFailed(true);return;}
    transport.current?.setClip(range);
    // Bounds, not object identity, define a new sentence clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active,sentence.id,sentence.startSec,sentence.endSec]);
  useEffect(()=>{transport.current?.setRate(rate);transport.current?.setVolume(volume);transport.current?.setLoop(loop);},[rate,volume,loop]);
  return {containerRef,failed,ready,error,duration:range?.duration??0,play,stop,seek,replay};
}
