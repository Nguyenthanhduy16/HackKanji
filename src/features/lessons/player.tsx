"use client";

import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowLeft,ArrowRight,BookOpen,Check,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,Clock3,Eye,EyeOff,Headphones,Keyboard,Lightbulb,Mic,Pause,Play,RotateCcw,Settings2,SkipBack,SkipForward,Sparkles,Square,Volume2} from 'lucide-react';
import {Badge,Button,Card,EmptyState,JlptBadge,Modal,Progress,SegmentedTabs} from '@/components/ui';
import {categories,lessons,type Lesson,type LessonWord} from '@/lib/lessons';
import {getPlayerShortcut,gradeDictation,usePlayerStore} from '@/lib/player-store';
import {useStudyStore} from '@/lib/store';
import {gamification} from '@/lib/gamification/config';
import {cn,formatTime} from '@/lib/utils';
import {useLessonAudio,useRecorder} from './media';
import {YouTubeFrame} from './youtube';
import {LessonComments} from './comments';
import {useAccountIdentity} from '@/features/account';

export function LessonPlayer({mode,lessonId}:{mode:'listening'|'speaking';lessonId:string}) {
  const t=useTranslations('lessons');const locale=useLocale();const lesson=lessons.find(item=>item.id===lessonId);
  if(!lesson)return <EmptyState title={t('notFound')}><Link href={`/${locale}/${mode}`} className="text-primary hover:underline">{t('backToLibrary')}</Link></EmptyState>;
  return <Player key={`${mode}-${lessonId}`} lesson={lesson} mode={mode}/>;
}

function RubyWord({word,furigana=true}:{word:LessonWord;furigana?:boolean}) {
  return furigana?<ruby className="jp" lang="ja">{word.text}<rt className="text-[.45em] font-normal text-muted-foreground">{word.reading!==word.text?word.reading:''}</rt></ruby>:<span lang="ja" className="jp">{word.text}</span>;
}

function Player({lesson,mode}:{lesson:Lesson;mode:'listening'|'speaking'}) {
  const t=useTranslations('lessons');const locale=useLocale();const speaking=mode==='speaking';const state=usePlayerStore();const accountId=useAccountIdentity();
  const index=Math.min(state.sentenceIndex,lesson.sentences.length-1);const sentence=lesson.sentences[index];const attempt=state.attempts[index];
  const [loop,setLoop]=useState(false);const [hideImage,setHideImage]=useState(false);const [hideTranscript,setHideTranscript]=useState(false);
  const [difficulty,setDifficulty]=useState('normal');const [furigana,setFurigana]=useState(true);const [translation,setTranslation]=useState(true);const [autoPause,setAutoPause]=useState(true);
  const [settings,setSettings]=useState(false);const [shortcuts,setShortcuts]=useState(false);const [elapsed,setElapsed]=useState(0);const [message,setMessage]=useState('');const [activeWord,setActiveWord]=useState(-1);
  const [takes,setTakes]=useState<Record<number,string>>({});const takesRef=useRef(takes);takesRef.current=takes;const recordingSentence=useRef(index);const recordingAudio=useRef<HTMLAudioElement>(null);
  const [completion,setCompletion]=useState(false);const [earned,setEarned]=useState(0);const [finished,setFinished]=useState(false);const [note,setNote]=useState('');const [noteMessage,setNoteMessage]=useState('');
  const answer=useRef<HTMLTextAreaElement>(null);const revealButtons=useRef<(HTMLButtonElement|null)[]>([]);const advance=useRef(false);const started=useRef(0);const awarded=useRef(new Set<number>());const noteKey=`nhaikanji-lesson-note-${lesson.id}${accountId?`:account:${accountId}`:''}`;
  const completedCount=speaking?Object.keys(takes).length:Object.values(state.attempts).filter(item=>item.done).length;
  const progress=Math.round(completedCount/lesson.sentences.length*100);
  const category=categories.find(item=>item.id===lesson.category)!;

  const media=useLessonAudio(sentence,state.rate,()=>{
    if(speaking&&!autoPause&&index<lesson.sentences.length-1){advance.current=true;state.setSentence(index+1);}
  },lesson,loop);
  const recorder=useRecorder(url=>{
    const takeIndex=recordingSentence.current;
    setTakes(current=>{if(current[takeIndex])URL.revokeObjectURL(current[takeIndex]);return {...current,[takeIndex]:url};});
    useStudyStore.getState().recordShadowing();
  });
  const busy=recorder.status!=='idle';

  useEffect(()=>{
    state.openLesson(`${mode}:${lesson.id}`);started.current=Date.now();
    try{setNote(localStorage.getItem(noteKey)??'');}catch{}
    const timer=setInterval(()=>{if(document.visibilityState==='visible')setElapsed(current=>current+1);},1000);
    return ()=>{clearInterval(timer);for(const url of Object.values(takesRef.current))URL.revokeObjectURL(url);};
    // Each player is keyed by mode and lesson. Reset once on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lesson.id,mode,noteKey]);
  useEffect(()=>{setMessage('');setActiveWord(-1);recordingAudio.current?.pause();if(advance.current){advance.current=false;media.play();}},[index,media.play]);

  const move=useCallback((next:number)=>{if(next<0||next>=lesson.sentences.length||busy)return;media.stop();recordingAudio.current?.pause();state.setSentence(next);},[lesson.sentences.length,busy,media,state]);
  const submit=useCallback(()=>{
    if(speaking)return;
    const current=usePlayerStore.getState();const currentAttempt=current.attempts[current.sentenceIndex];
    if(!currentAttempt?.input.trim()){setMessage('emptyAnswer');answer.current?.focus();return;}
    const result=gradeDictation(currentAttempt.input,sentence.words,currentAttempt.revealed);
    current.setGrade(result);setMessage('');
    if(result.correct&&!awarded.current.has(index)){awarded.current.add(index);useStudyStore.getState().addStudy(0,gamification.sentenceXP);}
  },[index,sentence.words,speaking]);
  useEffect(()=>{
    const handle=(event:KeyboardEvent)=>{
      if(settings||shortcuts||completion||busy)return;
      const target=event.target as HTMLElement;
      const editing=target===answer.current;
      if((target.matches('input,textarea,[contenteditable="true"]')&&!editing)||target.closest('[role="dialog"]'))return;
      const shortcut=getPlayerShortcut({key:event.key,editing,interactive:!!target.closest('button,a,select,input'),isComposing:event.isComposing,shiftKey:event.shiftKey,ctrlKey:event.ctrlKey,metaKey:event.metaKey,altKey:event.altKey});
      if(!shortcut)return;
      if(shortcut==='submit'&&speaking)return;
      event.preventDefault();
      if(shortcut==='toggle'){recordingAudio.current?.pause();media.toggle();}
      if(shortcut==='forward')media.seek(usePlayerStore.getState().position+2);
      if(shortcut==='backward')media.seek(usePlayerStore.getState().position-2);
      if(shortcut==='submit')submit();
      if(shortcut==='blur')target.blur();
      if(shortcut==='next-word'){const next=(activeWord+1)%sentence.words.length;setActiveWord(next);revealButtons.current[next]?.focus();}
    };
    window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
  },[settings,shortcuts,completion,busy,speaking,media,submit,activeWord,sentence.words.length]);

  const finish=()=>{
    if(completedCount!==lesson.sentences.length)return;
    media.stop();recordingAudio.current?.pause();
    if(!finished){const study=useStudyStore.getState();const before=study.xp;study.completeLesson(lesson.id,mode);study.addStudy(Math.max(0,elapsed/60-1),0);setEarned(useStudyStore.getState().xp-before);setFinished(true);}
    setCompletion(true);
  };
  const startRecording=()=>{media.stop();recordingAudio.current?.pause();recordingSentence.current=index;void recorder.start();};
  const playTake=()=>{media.stop();if(recordingAudio.current){recordingAudio.current.currentTime=0;void recordingAudio.current.play().catch(()=>setMessage('recordingFailed'));}};
  const saveNote=()=>{try{localStorage.setItem(noteKey,note);setNoteMessage('noteSaved');}catch{setNoteMessage('saveFailed');}};
  const currentReadingLength=sentence.words.reduce((total,word)=>total+word.reading.length,0);
  const currentWord=(()=>{let cursor=0;const target=media.duration?state.position/media.duration*currentReadingLength:0;return sentence.words.findIndex(word=>{cursor+=word.reading.length;return cursor>target;});})();
  const togglePlayback=()=>{recordingAudio.current?.pause();media.toggle();};
  const replayOriginal=()=>{recordingAudio.current?.pause();media.replay();};
  const iconButton='min-h-11 min-w-11';
  const speedControl=<label className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-2.5"><span className="sr-only">{t('speed')}</span><select aria-label={t('speed')} value={state.rate} onChange={event=>state.setRate(Number(event.target.value))} className="bg-transparent text-xs font-semibold outline-none">{[.5,.75,1,1.25,1.5].map(rate=><option key={rate} value={rate}>{rate}×</option>)}</select></label>;

  return <div className="min-w-0 space-y-5 pb-10">
    <audio ref={media.audioRef} src={media.audioSrc} preload="metadata" {...media.audioEvents}/>
    <nav aria-label={t('practice')} className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><div className="flex min-w-0 flex-wrap items-center gap-2"><Link href={`/${locale}/practice`} className="hover:text-primary">{t('practice')}</Link><ChevronRight size={12}/><Link href={`/${locale}/${mode}`} lang="ja" className="jp hover:text-primary">{category.titleJa}</Link><ChevronRight size={12}/><span className="max-w-[240px] truncate font-medium text-foreground">{locale==='vi'?lesson.title:lesson.titleJa}</span><JlptBadge level={lesson.level}/></div><div className="flex items-center gap-2"><span className="mr-1 flex items-center gap-1.5 font-mono"><Clock3 size={13}/><span aria-label={t('elapsed')}>{formatTime(elapsed)}</span></span>{media.source!=='youtube'&&<Button variant="outline" size="sm" aria-pressed={hideImage} aria-label={t(hideImage?'showImage':'hideImage')} onClick={()=>setHideImage(!hideImage)}>{hideImage?<Eye size={14}/>:<EyeOff size={14}/>}<span className="hidden sm:inline">{t(hideImage?'showImage':'hideImage')}</span></Button>}<Button variant="outline" size="sm" aria-pressed={hideTranscript} onClick={()=>setHideTranscript(!hideTranscript)}>{hideTranscript?<Eye size={14}/>:<EyeOff size={14}/>}<span>{t(hideTranscript?'showTranscript':'hideTranscript')}</span></Button></div></nav>
    <div className={cn('grid min-w-0 items-start gap-5',hideTranscript?'xl:grid-cols-[minmax(240px,.85fr)_minmax(0,1.4fr)]':'xl:grid-cols-[minmax(215px,.85fr)_minmax(280px,1.15fr)_minmax(230px,.85fr)]')}>
      <div className="min-w-0 space-y-4">
        <Card className="overflow-hidden">
          {media.source==='youtube'&&<YouTubeFrame containerRef={media.videoRef} title={t('youtubeVideo')}/>}
          {media.source!=='youtube'&&!hideImage&&<div className="relative aspect-video overflow-hidden"><img src={lesson.image} alt="" width={800} height={450} className="h-full w-full object-cover"/><span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-foreground/75 px-2.5 py-1.5 text-xs text-background"><Headphones size={13}/>{t('sentenceOf',{current:index+1,total:lesson.sentences.length})}</span></div>}
          <div className="space-y-3 p-4"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className={iconButton} aria-label={t(state.playing?'pause':'play')} onClick={togglePlayback} disabled={busy||media.source==='unavailable'||!media.ready}>{state.playing?<Pause size={20}/>:<Play size={20}/>}</Button><span className="font-mono text-xs tabular-nums">{formatTime(state.position)} <span className="text-muted-foreground">/ {formatTime(media.duration)}</span></span><div className="ml-auto flex items-center gap-1"><Volume2 size={15} className="text-muted-foreground"/><input aria-label={t('volume')} type="range" min={0} max={1} step={.05} value={media.volume} onChange={event=>media.setVolume(Number(event.target.value))} className="h-6 w-16 accent-primary"/></div></div><input aria-label={t('seek')} type="range" min={0} max={media.duration||1} step={.05} value={Math.min(state.position,media.duration)} disabled={(media.source!=='native'&&media.source!=='youtube')||busy||!media.ready} onChange={event=>media.seek(Number(event.target.value))} className="h-5 w-full accent-primary disabled:opacity-40"/><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><CheckCircle2 size={12} className="text-success"/>{t(media.source==='youtube'?(media.ready?'youtubeClip':'youtubeLoading'):media.source==='native'?'offlineAudio':media.source==='speech'?'speechFallback':'noAudio')}</p></div>
        </Card>
        <p className="text-[10px] italic leading-5 text-muted-foreground">{t(lesson.source==='YOUTUBE'?'youtubeCopyright':'copyright')}</p>
        {media.error&&<p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-primary-dark">{t(media.error)}</p>}
        <div><h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t('controls')}</h2><div className="flex gap-2"><Button onClick={togglePlayback} disabled={busy||media.source==='unavailable'||!media.ready} className="min-h-11 flex-1">{state.playing?<Pause size={16}/>:<Play size={16}/>} {t(state.playing?'pause':'start')}</Button><Button variant="outline" onClick={replayOriginal} disabled={busy||media.source==='unavailable'||!media.ready} className="min-h-11"><RotateCcw size={16}/>{t('replay')}</Button></div></div>
        {media.source==='youtube'&&<Button variant={loop?'primary':'outline'} aria-pressed={loop} onClick={()=>setLoop(!loop)}>{t('loopSentence')}</Button>}
        {speaking&&<Card className="space-y-3 p-4"><label className="flex items-center justify-between gap-2 text-xs font-medium">{t('autoPause')}<button role="switch" aria-label={t('autoPause')} aria-checked={autoPause} onClick={()=>setAutoPause(!autoPause)} className={cn('relative h-7 w-12 rounded-full p-1 transition-colors',autoPause?'bg-primary':'bg-muted')}><span className={cn('block h-5 w-5 rounded-full bg-card shadow-sm transition-transform',autoPause&&'translate-x-5')}/></button></label><div className="flex flex-wrap gap-2"><Button variant={furigana?'primary':'outline'} size="sm" aria-pressed={furigana} onClick={()=>setFurigana(!furigana)}>{t('furigana')}</Button><Button variant={translation?'primary':'outline'} size="sm" aria-pressed={translation} onClick={()=>setTranslation(!translation)}>{t('translation')}</Button>{speedControl}<Button size="icon" variant="outline" aria-label={t('settings')} onClick={()=>setSettings(true)}><Settings2 size={17}/></Button></div></Card>}
        <Card className="p-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium">{t('progress')}</span><span className="font-mono text-primary">{progress}%</span></div><Progress value={progress}/><p className="mt-2 text-[11px] text-muted-foreground">{t('sentenceOf',{current:completedCount,total:lesson.sentences.length})}</p><Button className="mt-4 w-full" variant={progress===100?'success':'outline'} disabled={progress!==100} onClick={finish}><CheckCircle2 size={16}/>{t(finished?'completed':'finish')}</Button></Card>
      </div>
      <div className="min-w-0 space-y-4">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3"><span className="flex items-center gap-2 text-xs font-semibold text-primary">{speaking?<Mic size={15}/>:<Headphones size={15}/>} {t(mode)}</span>{!speaking&&<SegmentedTabs value={difficulty} onChange={setDifficulty} items={['easy','normal','hard'].map(value=>({value,label:t(value)}))}/>}</div>
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border bg-muted/20 px-2 py-2"><div className="flex items-center gap-0.5"><Button size="icon" variant="ghost" className={iconButton} aria-label={t('previousSentence')} onClick={()=>move(index-1)} disabled={index===0||busy}><SkipBack size={16}/></Button><Button size="icon" variant="ghost" className={iconButton} aria-label={t('replay')} onClick={replayOriginal} disabled={busy}><RotateCcw size={16}/></Button><Button size="icon" variant="ghost" className={cn(iconButton,'text-primary')} aria-label={t(state.playing?'pause':'play')} onClick={togglePlayback} disabled={busy}>{state.playing?<Pause size={18}/>:<Play size={18}/>}</Button><Button size="icon" variant="ghost" className={iconButton} aria-label={t('nextSentence')} onClick={()=>move(index+1)} disabled={index===lesson.sentences.length-1||busy}><SkipForward size={16}/></Button></div><div className="flex gap-1">{!speaking&&speedControl}<Button size="icon" variant="ghost" className={iconButton} aria-label={t('settings')} onClick={()=>setSettings(true)}><Settings2 size={17}/></Button><Button size="icon" variant="ghost" className={iconButton} aria-label={t('shortcuts')} onClick={()=>setShortcuts(true)}><Keyboard size={18}/></Button></div></div>
          {!speaking?<div className="space-y-5 p-4 sm:p-5"><div><label htmlFor="dictation-answer" className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t('typePrompt')}</label><textarea ref={answer} id="dictation-answer" lang="ja" spellCheck={false} autoComplete="off" value={attempt?.input??''} maxLength={500} onChange={event=>state.setInput(event.target.value)} placeholder={t('answerPlaceholder')} className="jp mt-2 min-h-36 w-full resize-y rounded-xl border border-border bg-canvas/50 p-4 text-lg leading-8 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/15"/><p className="mt-2 text-[10px] leading-4 text-muted-foreground">{t(`${difficulty}Hint`)}</p></div>
            {difficulty==='easy'&&<p className="flex items-start gap-2 rounded-xl bg-info/5 p-3 text-xs leading-5 text-muted-foreground"><Lightbulb size={15} className="mt-0.5 shrink-0 text-info"/>{sentence.translation}</p>}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-3" aria-label={t('transcript')}>{sentence.words.map((word,wordIndex)=>{const revealed=attempt?.revealed.includes(wordIndex);const graded=attempt?.grade?.words[wordIndex];const visible=revealed||graded?.correct;return <div key={wordIndex} className="flex min-w-12 flex-col items-center gap-1"><button ref={element=>{revealButtons.current[wordIndex]=element;}} aria-label={t('revealWord',{number:wordIndex+1})} aria-pressed={!!revealed} disabled={!!revealed} onClick={()=>state.revealWord(wordIndex)} className="flex h-9 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-35"><Eye size={14}/></button><span title={`${t('kanaCount',{count:word.reading.length})}${visible?` · ${word.translation}`:''}`} className={cn('jp inline-flex min-h-11 min-w-12 items-center justify-center rounded-lg border px-2.5 py-2 text-sm tracking-wide transition-colors',graded?.correct?'border-success/30 bg-success/10 text-success':graded?'border-primary/40 bg-primary/10 text-primary':'border-border bg-muted/50',activeWord===wordIndex&&'ring-2 ring-primary/30')}>{visible?word.text:difficulty==='hard'?'•••':difficulty==='easy'?word.reading[0]+'•'.repeat(Math.max(0,word.reading.length-1)):'•'.repeat(word.reading.length)}</span>{graded&&<span className={cn('text-[9px]',graded.correct?'text-success':'text-primary')}>{t(revealed?'revealed':graded.correct?'correctWord':'incorrectWord')}</span>}</div>;})}</div>
            <p className="text-center text-[10px] leading-5 text-muted-foreground">{t('revealHint')}</p>
            <div className="space-y-2"><Button variant="outline" className="min-h-11 w-full border-primary/30 text-primary hover:bg-primary/5" onClick={()=>state.revealAll(sentence.words.length)}><Eye size={16}/>{t('revealAll')}</Button><Button className="min-h-11 w-full" onClick={submit}><Check size={17}/>{t('check')}</Button></div>
            {message&&<p role="status" className="text-xs text-primary">{t(message)}</p>}
            {attempt?.grade&&<div role="status" className={cn('rounded-xl border p-4',attempt.grade.correct?'border-success/25 bg-success/5':'border-primary/20 bg-primary/5')}><p className={cn('text-sm font-semibold',attempt.grade.correct?'text-success':'text-primary')}>{t(attempt.grade.correct?'correct':'tryAgain')}</p><p className="mt-1 text-xs text-muted-foreground">{t('score',{score:attempt.grade.score})}</p>{attempt.grade.correct&&<Button variant="ghost" className="mt-2 w-full" onClick={()=>index<lesson.sentences.length-1?move(index+1):finish()}>{t(index<lesson.sentences.length-1?'nextSentence':'finish')}<ArrowRight size={15}/></Button>}</div>}
          </div>:<div className="p-5 sm:p-6"><p className="mb-8 text-center text-[11px] text-muted-foreground">{t('sentenceOf',{current:index+1,total:lesson.sentences.length})}</p><div className="flex min-h-24 flex-wrap justify-center gap-x-2 gap-y-6 text-center text-2xl font-medium leading-[2] md:text-3xl">{sentence.words.map((word,wordIndex)=><button key={wordIndex} disabled={busy} title={word.translation} aria-label={t('wordAudio',{word:word.text})} onClick={()=>{recordingAudio.current?.pause();media.speak(word.text,true);}} className={cn('rounded-lg px-1 transition-colors hover:bg-primary/10',state.playing&&wordIndex===currentWord?'bg-primary/10 text-primary':'text-foreground')}><RubyWord word={word} furigana={furigana}/></button>)}</div>{translation&&<p className="mt-7 text-center text-sm italic leading-6 text-muted-foreground">{sentence.translation}</p>}<p className="mt-6 text-center text-[10px] leading-5 text-muted-foreground">{t('karaokeHint')}</p>
            <div className="mt-7 border-t border-border pt-5"><div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={playTake} disabled={!takes[index]||busy} className="min-h-11"><Play size={15}/>{t('playRecording')}</Button><Button onClick={recorder.status==='recording'?recorder.stop:startRecording} disabled={recorder.status==='requesting'} className="min-h-11">{recorder.status==='recording'?<Square size={15} className="fill-current"/>:<Mic size={16}/>} {t(recorder.status==='recording'?'stopRecording':recorder.status==='requesting'?'requestingMic':'record')}</Button></div>
              {recorder.status==='recording'&&<div role="status" className="mt-4 rounded-xl bg-primary/5 p-4"><div className="flex items-center justify-between text-xs text-primary"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse"/>{t('recording')}</span><span className="font-mono">{formatTime(recorder.seconds)}</span></div><div className="mt-3 flex h-10 items-center justify-center gap-1" aria-hidden="true">{Array.from({length:28},(_,i)=><span key={i} className="w-1.5 rounded-full bg-primary/70 transition-[height] duration-75" style={{height:`${4+recorder.level*32*(.45+Math.sin(i*1.7)**2*.55)}px`}}/>)}</div></div>}
              {recorder.error&&<p role="alert" className="mt-3 text-xs leading-5 text-primary">{t(recorder.error)}</p>}
              {takes[index]&&<div className="mt-5 rounded-xl border border-border bg-canvas/50 p-4"><p className="mb-3 flex items-center gap-2 text-xs font-semibold text-success"><CheckCircle2 size={15}/>{t('recordingReady')}</p><audio ref={recordingAudio} src={takes[index]} controls preload="metadata" className="h-10 w-full" aria-label={t('yourTake')} onPlay={media.stop}/><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={()=>{recordingAudio.current?.pause();media.replay();}} disabled={busy}><Headphones size={13}/>{t('originalTake')}</Button><Button variant="outline" size="sm" onClick={playTake} disabled={busy}><Mic size={13}/>{t('yourTake')}</Button></div><p className="mt-3 text-[11px] leading-5 text-muted-foreground">{t('noPronunciationScore')}</p></div>}
              <p className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">{t('recordingHint')}</p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><Button variant="ghost" size="sm" disabled={index===0||busy} onClick={()=>move(index-1)}><ArrowLeft size={14}/>{t('previous')}</Button><Button variant="ghost" size="sm" disabled={busy||(index===lesson.sentences.length-1&&progress<100)} onClick={()=>index<lesson.sentences.length-1?move(index+1):finish()}>{t(index<lesson.sentences.length-1?'nextSentence':'finish')}<ArrowRight size={14}/></Button></div>
          </div>}
        </Card>
        <Card><details className="group"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-5 text-sm font-semibold"><span className="flex items-center gap-2"><BookOpen size={16} className="text-primary"/>{t('notes')}</span><ChevronDown size={16} className="transition-transform group-open:rotate-180"/></summary><div className="space-y-3 border-t border-border p-5"><p className="text-xs leading-5 text-muted-foreground">{t('noteHint')}</p><textarea aria-label={t('notes')} value={note} onChange={event=>{setNote(event.target.value);setNoteMessage('');}} maxLength={4000} placeholder={t('notePlaceholder')} className="min-h-24 w-full rounded-xl border border-border bg-canvas/50 p-3 text-sm outline-none focus:border-primary"/><div className="flex items-center justify-between gap-2"><span role="status" className="text-xs text-success">{noteMessage&&t(noteMessage)}</span><Button size="sm" onClick={saveNote}>{t('saveNote')}</Button></div></div></details></Card>
      </div>
      {!hideTranscript&&<Card className="min-w-0 overflow-hidden xl:sticky xl:top-20"><div className="border-b border-border p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase tracking-widest">{t('transcript')}</h2><span className="font-mono text-xs text-primary">{progress}%</span></div><Progress value={progress}/></div><div className="max-h-[650px] space-y-3 overflow-y-auto p-3 xl:max-h-[calc(100vh-245px)]">{lesson.sentences.map((item,sentenceIndex)=>{const entry=state.attempts[sentenceIndex];return <div key={item.id} className={cn('rounded-xl border p-3 transition-colors',index===sentenceIndex?'border-primary/60 bg-primary/[.035] ring-1 ring-primary/10':'border-border bg-canvas/30')}><button className="mb-3 flex min-h-8 w-full items-center justify-between text-xs" onClick={()=>move(sentenceIndex)} disabled={busy} aria-current={index===sentenceIndex?'step':undefined}><span className={cn('font-mono font-semibold',index===sentenceIndex?'text-primary':'text-muted-foreground')}>#{sentenceIndex+1}</span>{(speaking?!!takes[sentenceIndex]:entry?.done)?<CheckCircle2 size={14} className="text-success"/>:<Play size={13} className="text-muted-foreground"/>}</button><div className={cn('flex flex-wrap gap-1.5',speaking&&'gap-y-3 pt-2')}>{item.words.map((word,wordIndex)=>{const visible=speaking||entry?.revealed.includes(wordIndex)||entry?.grade?.words[wordIndex]?.correct;return speaking?<button key={wordIndex} disabled={busy} title={word.translation} aria-label={t('wordAudio',{word:word.text})} onClick={()=>{recordingAudio.current?.pause();if(sentenceIndex!==index)move(sentenceIndex);media.speak(word.text,true);}} className="rounded-md bg-muted/60 px-1.5 py-1 text-sm hover:bg-primary/10 hover:text-primary"><RubyWord word={word} furigana={furigana}/></button>:<span key={wordIndex} lang="ja" className={cn('jp rounded-md px-2 py-1.5 text-xs',entry?.grade?.words[wordIndex]?.correct?'bg-success/10 text-success':'bg-muted/70 text-muted-foreground')}>{visible?word.text:'•'.repeat(Math.min(word.reading.length,6))}</span>;})}</div>{speaking&&translation&&<p className="mt-3 text-[11px] italic leading-5 text-muted-foreground">{item.translation}</p>}</div>;})}</div></Card>}
    </div>
    <LessonComments lessonId={lesson.id}/>
    <Modal open={shortcuts} onOpenChange={setShortcuts} title={t('shortcuts')}><div className="space-y-4">{[['Space','shortcutSpace'],['← / →','shortcutArrows'],['Tab','shortcutTab'],['Enter','shortcutEnter'],['Esc','shortcutEscape']].map(([key,label])=><div key={key} className="flex items-center gap-4"><kbd className="min-w-20 rounded-lg border border-border bg-muted px-2 py-1.5 text-center font-mono text-xs">{key}</kbd><span className="text-xs leading-5 text-muted-foreground">{t(label)}</span></div>)}</div></Modal>
    <Modal open={settings} onOpenChange={setSettings} title={t('settings')}><div className="space-y-5"><div className="flex items-center justify-between"><span className="text-sm">{t('speed')}</span>{speedControl}</div>{!speaking&&<div><p className="mb-2 text-sm">{t('difficulty')}</p><SegmentedTabs value={difficulty} onChange={setDifficulty} items={['easy','normal','hard'].map(value=>({value,label:t(value)}))}/><p className="mt-2 text-xs leading-5 text-muted-foreground">{t(`${difficulty}Hint`)}</p></div>}<p className="text-xs leading-6 text-muted-foreground">{t('revealHint')}</p><Button className="w-full" onClick={()=>setSettings(false)}>{t('close')}</Button></div></Modal>
    <Modal open={completion} onOpenChange={setCompletion} title={t('completionTitle')} description={t('completionBody',{count:lesson.sentences.length})}><div className="text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10 text-success"><Sparkles size={38}/></div><p className="text-lg font-bold text-primary">{t('earnedXP',{xp:earned})}</p><p className="mt-2 text-xs text-muted-foreground">{t('completed')}</p><Link href={`/${locale}/${mode}`} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark">{t('continueLearning')}<ArrowRight size={16}/></Link></div></Modal>
  </div>;
}
