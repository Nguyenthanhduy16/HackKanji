"use client";

import {useCallback,useEffect,useRef,useState} from 'react';
import type {Lesson,LessonSentence} from '@/lib/lessons';
import {usePlayerStore} from '@/lib/player-store';
import {useYouTubeAudio} from './youtube';

/** Shared transport used by dictation and shadowing. No video is requested for AUDIO. */
export function useLessonAudio(sentence:LessonSentence,rate:number,onEnded:()=>void,lesson?:Pick<Lesson,'source'|'youtubeId'>,loop=false) {
  const native=useNativeLessonAudio(sentence,rate,onEnded);
  const youtube=useYouTubeAudio(sentence,lesson?.youtubeId,lesson?.source==='YOUTUBE',rate,native.volume,loop,onEnded);
  const videoActive=lesson?.source==='YOUTUBE'&&!youtube.failed;
  const stop=useCallback(()=>{youtube.stop();native.stop();},[youtube.stop,native.stop]);
  const play=useCallback(()=>{if(videoActive)youtube.play();else native.play();},[videoActive,youtube.play,native.play]);
  const replay=useCallback(()=>{if(videoActive){native.stop();youtube.replay();}else native.replay();},[videoActive,youtube.replay,native.stop,native.replay]);
  const seek=useCallback((position:number)=>{if(videoActive)youtube.seek(position);else native.seek(position);},[videoActive,youtube.seek,native.seek]);
  const toggle=useCallback(()=>{if(usePlayerStore.getState().playing)stop();else play();},[play,stop]);
  const speak=useCallback((text:string,wordOnly=false)=>{youtube.stop();native.speak(text,wordOnly);},[youtube.stop,native.speak]);
  return {...native,play,stop,replay,seek,toggle,speak,
    source:videoActive?'youtube' as const:native.source,
    ready:!videoActive||youtube.ready,
    duration:videoActive?youtube.duration:native.duration,
    error:videoActive?youtube.error:youtube.failed?(native.source==='native'?'youtubeFallback':'youtubeUnavailable'):native.error,
    videoRef:youtube.containerRef,
    audioSrc:videoActive?undefined:sentence.audio??undefined,
    audioEvents:videoActive?{}:native.audioEvents,
  };
}

function useNativeLessonAudio(sentence:LessonSentence,rate:number,onEnded:()=>void) {
  const audioRef=useRef<HTMLAudioElement>(null);
  const endedRef=useRef(onEnded);endedRef.current=onEnded;
  const [duration,setDuration]=useState(sentence.duration);
  const [source,setSource]=useState<'native'|'speech'|'unavailable'>(sentence.audio?'native':'speech');
  const [error,setError]=useState('');const [volume,setVolume]=useState(1);
  const [voiceReady,setVoiceReady]=useState(false);
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const fallbackTimer=useRef<ReturnType<typeof setInterval>|null>(null);
  const speechStart=useRef(0);const speechOffset=useRef(0);
  const clearTimer=useCallback(()=>{if(fallbackTimer.current){clearInterval(fallbackTimer.current);fallbackTimer.current=null;}},[]);
  const stop=useCallback(()=>{
    audioRef.current?.pause();
    if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
    utteranceRef.current=null;clearTimer();usePlayerStore.getState().setPlaying(false);
  },[clearTimer]);
  useEffect(()=>{
    if(!('speechSynthesis' in window))return;
    const check=()=>setVoiceReady(window.speechSynthesis.getVoices().some(voice=>voice.lang.toLowerCase().startsWith('ja')));
    check();window.speechSynthesis.addEventListener('voiceschanged',check);
    return ()=>window.speechSynthesis.removeEventListener('voiceschanged',check);
  },[]);
  useEffect(()=>{
    const audio=audioRef.current;
    setDuration(sentence.duration);setSource(sentence.audio?'native':'speech');setError('');
    usePlayerStore.getState().setPosition(0);speechOffset.current=0;
    return ()=>{audio?.pause();if('speechSynthesis' in window)window.speechSynthesis.cancel();clearTimer();};
  },[sentence.id,sentence.audio,sentence.duration,clearTimer]);
  useEffect(()=>{if(audioRef.current){audioRef.current.playbackRate=rate;audioRef.current.volume=volume;}},[rate,volume,sentence.id]);
  useEffect(()=>()=>stop(),[stop]);
  const speak=useCallback((text:string,wordOnly=false)=>{
    if(!('speechSynthesis' in window)){setError('noAudio');return;}
    const voice=window.speechSynthesis.getVoices().find(candidate=>candidate.lang.toLowerCase().startsWith('ja'));
    if(!voice){setError('noAudio');return;}
    stop();setError('');
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang='ja-JP';utterance.rate=rate;utterance.volume=volume;
    utteranceRef.current=utterance;
    utterance.onstart=()=>{usePlayerStore.getState().setPlaying(true);speechStart.current=performance.now();if(!wordOnly){usePlayerStore.getState().setPosition(0);fallbackTimer.current=setInterval(()=>usePlayerStore.getState().setPosition(Math.min(sentence.duration,(performance.now()-speechStart.current)/1000*rate)),100);}};
    utterance.onend=()=>{clearTimer();utteranceRef.current=null;usePlayerStore.getState().setPlaying(false);if(!wordOnly){usePlayerStore.getState().setPosition(sentence.duration);endedRef.current();}};
    utterance.onerror=(event)=>{clearTimer();usePlayerStore.getState().setPlaying(false);if(event.error!=='interrupted'&&event.error!=='canceled')setError('audioError');};
    window.speechSynthesis.speak(utterance);
  },[rate,volume,sentence.duration,stop,clearTimer]);
  const play=useCallback(()=>{
    setError('');
    if(source==='native'&&audioRef.current){
      if(audioRef.current.ended)audioRef.current.currentTime=0;
      void audioRef.current.play().catch(()=>{usePlayerStore.getState().setPlaying(false);setError('audioError');});
    }else speak(sentence.text);
  },[source,sentence.text,speak]);
  const toggle=useCallback(()=>{if(usePlayerStore.getState().playing)stop();else play();},[play,stop]);
  const replay=useCallback(()=>{stop();if(audioRef.current)audioRef.current.currentTime=0;usePlayerStore.getState().setPosition(0);play();},[play,stop]);
  const seek=useCallback((position:number)=>{if(source!=='native'||!audioRef.current)return;audioRef.current.currentTime=Math.min(Math.max(0,position),duration);usePlayerStore.getState().setPosition(audioRef.current.currentTime);},[source,duration]);
  return {audioRef,duration,source,error,volume,setVolume,voiceReady,play,stop,toggle,replay,seek,speak,
    audioEvents:{
      onLoadedMetadata:()=>{const d=audioRef.current?.duration;if(d&&Number.isFinite(d))setDuration(d);},
      onTimeUpdate:()=>usePlayerStore.getState().setPosition(audioRef.current?.currentTime??0),
      onPlay:()=>usePlayerStore.getState().setPlaying(true),
      onPause:()=>usePlayerStore.getState().setPlaying(false),
      onEnded:()=>{usePlayerStore.getState().setPlaying(false);endedRef.current();},
      onError:()=>{setSource(voiceReady?'speech':'unavailable');setError(voiceReady?'speechFallback':'noAudio');usePlayerStore.getState().setPlaying(false);},
    },
  };
}

export function useRecorder(onTake:(url:string)=>void) {
  const [status,setStatus]=useState<'idle'|'requesting'|'recording'>('idle');
  const [seconds,setSeconds]=useState(0);const [level,setLevel]=useState(0);const [error,setError]=useState('');
  const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const context=useRef<AudioContext|null>(null);const frame=useRef(0);const mounted=useRef(true);const timer=useRef<ReturnType<typeof setInterval>|null>(null);const takeCallback=useRef(onTake);takeCallback.current=onTake;
  const release=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(context.current){void context.current.close().catch(()=>{});context.current=null;}},[]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recorder.current?.state==='recording')recorder.current.stop();release();};},[release]);
  const stop=useCallback(()=>{if(recorder.current?.state==='recording')recorder.current.stop();},[]);
  const start=useCallback(async()=>{
    if(status!=='idle')return;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('recordingUnavailable');return;}
    setError('');setStatus('requesting');setSeconds(0);setLevel(0);
    try {
      const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(!mounted.current){media.getTracks().forEach(track=>track.stop());return;}
      stream.current=media;
      const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));
      const instance=new MediaRecorder(media,mimeType?{mimeType}:undefined);recorder.current=instance;const chunks:BlobPart[]=[];
      instance.ondataavailable=event=>{if(event.data.size>0)chunks.push(event.data);};
      instance.onerror=()=>{release();if(mounted.current){setStatus('idle');setError('recordingFailed');}};
      instance.onstop=()=>{release();if(!mounted.current)return;setStatus('idle');setLevel(0);const blob=new Blob(chunks,{type:instance.mimeType||'audio/webm'});if(blob.size>0)takeCallback.current(URL.createObjectURL(blob));else setError('recordingFailed');};
      instance.start(250);setStatus('recording');const started=performance.now();timer.current=setInterval(()=>{const elapsed=(performance.now()-started)/1000;setSeconds(elapsed);if(elapsed>=120)stop();},100);
      try {
        const audioContext=new AudioContext();context.current=audioContext;const analyser=audioContext.createAnalyser();analyser.fftSize=256;audioContext.createMediaStreamSource(media).connect(analyser);const samples=new Uint8Array(analyser.fftSize);
        const update=()=>{analyser.getByteTimeDomainData(samples);let sum=0;for(const value of samples)sum+=((value-128)/128)**2;setLevel(Math.min(1,Math.sqrt(sum/samples.length)*5));frame.current=requestAnimationFrame(update);};update();
      }catch{/* The recorder still works when the audio analyser is unavailable. */}
    }catch{release();if(mounted.current){setStatus('idle');setError('micDenied');}}
  },[status,release,stop]);
  return {status,seconds,level,error,start,stop};
}
