"use client";

import {useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowRight,BookOpen,Check,ChevronLeft,ChevronRight,Headphones,Mic,Search,SlidersHorizontal,Sparkles,Volume2,X} from 'lucide-react';
import {Badge,Button,EmptyState,JlptBadge,PageTitle,SegmentedTabs} from '@/components/ui';
import {categories,lessons as library,type Lesson,type LessonMode} from '@/lib/lessons';
import {cn,formatTime} from '@/lib/utils';
import {useStudyStore} from '@/lib/store';

export {LessonPlayer} from './player';

export function LessonCard({lesson,mode='listening'}:{lesson:Lesson;mode?:LessonMode}) {
  const t=useTranslations('lessons');const locale=useLocale();
  const completedLessons=useStudyStore(s=>s.completedLessons);
  const target=mode==='practice'?'listening':mode;
  return <article className="group w-[260px] min-w-0 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--shadow-light)] motion-reduce:transform-none">
    <Link href={`/${locale}/${target}/${lesson.id}`} className="relative block aspect-video overflow-hidden focus-visible:outline-primary" aria-label={`${t(target==='speaking'?'speaking':'listening')}: ${lesson.title} · ${lesson.plays>0?new Intl.NumberFormat(locale).format(lesson.plays):t('original')} · ${lesson.level} · ${t(lesson.source==='YOUTUBE'?'youtubeVideo':'audio')} · ${formatTime(lesson.duration)}`}>
      {/* Original local SVG art keeps the catalogue fast and available offline. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={lesson.image} alt="" width={800} height={450} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none"/>
      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-foreground/75 px-2 py-1 text-[10px] font-medium text-background"><Headphones size={11}/>{lesson.plays>0?new Intl.NumberFormat(locale).format(lesson.plays):t('original')}</span>
      <span className="absolute right-2.5 top-2.5 rounded-md bg-card"><JlptBadge level={lesson.level}/></span>
      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-foreground/75 px-2 py-1 text-[10px] text-background"><Volume2 size={12}/>{t(lesson.source==='YOUTUBE'?'youtubeVideo':'audio')}</span>
      <span className="absolute bottom-2.5 right-2.5 rounded-md bg-foreground/75 px-1.5 py-0.5 font-mono text-[11px] text-background">{formatTime(lesson.duration)}</span>
      <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-opacity group-hover:bg-foreground/10 group-hover:opacity-100"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-primary"><Headphones size={20}/></span></span>
    </Link>
    <div className="px-3.5">
      <Link href={`/${locale}/${target}/${lesson.id}`} className="flex min-h-10 items-center text-sm font-medium leading-5 hover:text-primary"><span className="line-clamp-2" lang={locale==='vi'?undefined:'ja'}>{locale==='vi'?lesson.title:lesson.titleJa}</span></Link>
      <div className="flex h-11 items-center gap-1">
        {(['listening','speaking'] as const).map(item=>{const Icon=item==='listening'?Headphones:Mic;return <Link key={item} href={`/${locale}/${item}/${lesson.id}`} title={t(item)} aria-label={`${t(item)}: ${lesson.title}`} className={cn('flex h-11 w-11 items-center justify-center rounded-lg transition-colors',item===target?'text-primary hover:bg-primary/10':'text-muted-foreground hover:bg-muted')}><Icon size={17}/></Link>;})}
        {completedLessons.includes(`${target}:${lesson.id}`)&&<span className="ml-auto flex items-center gap-1 text-[10px] text-success"><Check size={12}/>{t('completed')}</span>}
      </div>
    </div>
  </article>;
}

export function LessonCarousel({title,lessons,mode='listening'}:{title:string;lessons:Lesson[];mode?:LessonMode}) {
  const t=useTranslations('lessons');const scroll=useRef<HTMLDivElement>(null);
  return <section className="min-w-0" aria-label={title}>
    <div className="mb-2 flex items-center justify-between gap-3"><h2 className="border-l-4 border-primary pl-3 text-lg font-semibold tracking-tight">{title}</h2><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" aria-label={t('carouselPrevious')} onClick={()=>scroll.current?.scrollBy({left:-280,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}><ChevronLeft size={19}/></Button><Button size="icon" variant="ghost" className="h-7 w-7" aria-label={t('carouselNext')} onClick={()=>scroll.current?.scrollBy({left:280,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}><ChevronRight size={19}/></Button></div></div>
    <div ref={scroll} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{lessons.map(lesson=><LessonCard key={lesson.id} lesson={lesson} mode={mode}/>)}</div>
  </section>;
}

const topics=[['daily','topicDaily'],['kids','topicKids'],['music','topicMusic'],['news','topicNews'],['anime','topicAnime'],['podcast','topicPodcast'],['history','topicHistory'],['jlpt','topicJlpt'],['work','topicWork'],['travel','topicTravel'],['folktales','topicFolktales'],['cooking','topicCooking']] as const;

export function Catalogue({mode}:{mode:LessonMode}) {
  const t=useTranslations('lessons');const locale=useLocale();
  const [audience,setAudience]=useState('all');const [topic,setTopic]=useState('all');const [search,setSearch]=useState('');const [expanded,setExpanded]=useState<string[]>([]);
  const filtered=useMemo(()=>library.filter(lesson=>(audience==='all'||(audience==='beginner'?['N5','N4'].includes(lesson.level):['N3','N2','N1'].includes(lesson.level)))&&(topic==='all'||lesson.tags.includes(topic))&&`${lesson.title} ${lesson.titleJa} ${lesson.level}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())),[audience,topic,search]);
  const reset=()=>{setAudience('all');setTopic('all');setSearch('');setExpanded([]);};
  const Icon=mode==='speaking'?Mic:Headphones;
  return <div className="mx-auto min-w-0 max-w-[1400px] space-y-8 pb-10">
    {mode==='practice'?<PageTitle title={t('title')} subtitle={t('practiceSubtitle')} icon={<BookOpen size={25}/>}/>:<header className="mx-auto max-w-4xl pt-1 text-center"><div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={22}/></div><h1 className="text-2xl font-bold tracking-tight md:text-[30px] md:leading-tight">{t(mode==='speaking'?'speakingTitle':'listeningTitle')}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{t(mode==='speaking'?'speakingSubtitle':'listeningSubtitle')}</p></header>}
    <div className="space-y-5">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2" aria-label={t('title')}>{topics.map(([value,key])=><button key={value} onClick={()=>setTopic(topic===value?'all':value)} aria-pressed={topic===value} className={cn('min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',topic===value?'border-primary bg-primary text-primary-foreground':'border-primary/10 bg-primary/[.065] text-primary-dark hover:border-primary/40 hover:bg-primary/10')}>#{t(key)}</button>)}</div>
      <div className="text-center"><SegmentedTabs value={audience} onChange={setAudience} items={[{value:'all',label:t('all')},{value:'beginner',label:t('beginner')},{value:'experienced',label:t('experienced')}]}/><p className="mt-3 text-xs leading-5 text-muted-foreground">{t(audience==='beginner'?'beginnerHint':audience==='experienced'?'experiencedHint':'originalNote')}</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal size={15}/><span>{t('lessonCount',{count:filtered.length})}</span>{(topic!=='all'||audience!=='all'||search)&&<button className="flex min-h-9 items-center gap-1 text-primary hover:underline" onClick={reset}><X size={13}/>{t('clearFilters')}</button>}</div><label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 sm:w-64"><Search size={16} className="shrink-0 text-muted-foreground"/><input aria-label={t('search')} placeholder={t('search')} value={search} onChange={event=>setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"/>{search&&<button aria-label={t('clearFilters')} onClick={()=>setSearch('')} className="flex h-8 w-8 items-center justify-center"><X size={14}/></button>}</label></div>
    </div>
    {filtered.length===0?<EmptyState title={t('emptyTitle')} description={t('emptyHint')}><Button onClick={reset}>{t('clearFilters')}</Button></EmptyState>:categories.map(category=>{
      const items=filtered.filter(lesson=>lesson.category===category.id);if(!items.length)return null;const all=expanded.includes(category.id);
      return <section key={category.id} id={`category-${category.id}`} className="min-w-0 scroll-mt-24"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="min-w-0 border-l-4 border-primary pl-3 text-lg font-semibold"><span lang="ja" className="jp">{category.titleJa}</span><span className="ml-2 hidden text-sm font-normal text-muted-foreground md:inline">{locale==='ja'?'':`(${t(category.labelKey)})`}</span><span className="ml-2 text-xs font-normal text-muted-foreground">({t('lessonCount',{count:items.length})})</span></h2><Button variant="ghost" size="sm" className="shrink-0" onClick={()=>setExpanded(current=>all?current.filter(id=>id!==category.id):[...current,category.id])}>{t(all?'collapse':'seeAll')}<ArrowRight size={15} className={cn(all&&'-rotate-90')}/></Button></div><div className={cn(all?'grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 [&>article]:w-full':'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}>{items.map(lesson=><LessonCard key={lesson.id} lesson={lesson} mode={mode}/>)}</div></section>;
    })}
    {filtered.length>0&&<div className="flex items-center justify-center gap-2 border-t border-border pt-7 text-center text-xs text-muted-foreground"><Sparkles size={15} className="text-primary"/>{t('originalNote')}</div>}
  </div>;
}
