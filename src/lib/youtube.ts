export interface YouTubePlayer {
  playVideo():void;pauseVideo():void;seekTo(seconds:number,allowSeekAhead:boolean):void;
  getCurrentTime():number;getDuration():number;getAvailablePlaybackRates():number[];
  setPlaybackRate(rate:number):void;setVolume(volume:number):void;destroy():void;
}
export type YouTubeOptions=ReturnType<typeof youtubePlayerOptions>&{events?:{
  onReady:(event:{target:YouTubePlayer})=>void;onStateChange:(event:{data:number})=>void;
  onError:(event:{data:number})=>void;onAutoplayBlocked?:()=>void;
}};
export type YouTubeAPI={Player:new(element:HTMLElement,options:YouTubeOptions)=>YouTubePlayer};
export function youtubePlayerOptions(videoId:string,origin:string) {
  if(!/^[\w-]{11}$/.test(videoId))throw new Error('Invalid YouTube video ID');
  return {videoId,width:'100%',height:'100%',playerVars:{origin,enablejsapi:1,autoplay:0,rel:0,playsinline:1,controls:0,disablekb:1,fs:0}};
}

export type ClipRange={start:number;end:number;duration:number};
/** Video sentences require explicit bounds; never play an unbounded video. */
export function clipRange(value:{startSec?:number;endSec?:number}):ClipRange|null {
  const {startSec:start,endSec:end}=value;
  return typeof start==='number'&&typeof end==='number'&&Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start?{start,end,duration:end-start}:null;
}
export function clipPosition(clip:ClipRange,absolute:number):number {
  return Math.min(clip.duration,Math.max(0,Number.isFinite(absolute)?absolute-clip.start:0));
}

/** All public times are relative to the sentence; the IFrame API uses video time. */
export function createClipTransport(player:YouTubePlayer,initial:ClipRange,events:{onPosition:(seconds:number)=>void;onPlaying:(playing:boolean)=>void;onEnded:()=>void}) {
  let clip=initial,playing=false,loop=false,disposed=false,started=false;
  let queuedPosition:number|null=null;
  let pendingSeek:number|null=null;let seekDeadline=0;
  const seek=(position:number)=>{
    if(disposed)return;
    const bounded=Math.min(clip.duration,Math.max(0,Number.isFinite(position)?position:0));
    // YouTube seekTo on an unstarted player may initiate playback even when
    // autoplay=0. Queue initial scrubs until the user invokes play/replay.
    if(!started){queuedPosition=bounded;events.onPosition(bounded);return;}
    pendingSeek=clip.start+bounded;seekDeadline=Date.now()+5000;
    player.seekTo(pendingSeek,true);
    if(Math.abs(player.getCurrentTime()-pendingSeek)<.25)pendingSeek=null;
    events.onPosition(bounded);
  };
  const stop=()=>{if(disposed)return;playing=false;player.pauseVideo();events.onPlaying(false);};
  const play=()=>{
    if(disposed)return;
    started=true;
    const time=player.getCurrentTime();
    if(queuedPosition!==null){const next=queuedPosition;queuedPosition=null;seek(next>=clip.duration?0:next);}
    else if(!Number.isFinite(time)||time<clip.start||time>=clip.end)seek(0);
    playing=true;player.playVideo();
  };
  const finish=()=>{
    if(!playing||disposed)return;
    if(loop){seek(0);player.playVideo();return;}
    seek(clip.duration);stop();events.onEnded();
  };
  const tick=()=>{
    if(!playing||disposed)return;
    const time=player.getCurrentTime();
    // seekTo is asynchronous across the iframe. Ignore its old cached time
    // until the target arrives; a stuck seek stops instead of advancing lessons.
    if(pendingSeek!==null){
      if(Math.abs(time-pendingSeek)<.5)pendingSeek=null;
      else {if(Date.now()>=seekDeadline){pendingSeek=null;stop();}return;}
    }
    if(time>=clip.end){finish();return;}
    if(time<clip.start){seek(0);return;}
    events.onPosition(clipPosition(clip,time));
  };
  return {
    play,stop,seek,tick,
    replay:()=>{if(disposed)return;seek(0);play();},
    setClip:(next:ClipRange)=>{if(disposed)return;stop();clip=next;seek(0);},
    setLoop:(value:boolean)=>{loop=value;},
    setRate:(rate:number)=>{
      if(disposed)return;
      const available=player.getAvailablePlaybackRates();
      const desired=Number.isFinite(rate)&&rate>0?rate:1;
      const supported=available.length?available.reduce((best,value)=>Math.abs(value-desired)<Math.abs(best-desired)?value:best):1;
      player.setPlaybackRate(supported);
      return supported;
    },
    setVolume:(volume:number)=>{if(!disposed)player.setVolume(Math.round(Math.max(0,Math.min(1,Number.isFinite(volume)?volume:1))*100));},
    onState:(state:number)=>{
      if(disposed)return;
      if(state===0){if(pendingSeek===null)finish();return;}
      if(state===1){started=true;playing=true;tick();events.onPlaying(playing);}
      if(state===2){playing=false;events.onPlaying(false);}
    },
    destroy:()=>{if(disposed)return;stop();disposed=true;player.destroy();},
  };
}

