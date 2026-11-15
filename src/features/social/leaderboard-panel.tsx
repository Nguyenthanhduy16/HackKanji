"use client";

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {ArrowRight, Clock, Crown, Flame, Medal, Trophy} from 'lucide-react';
import {Avatar, Badge, Card, PageTitle, SegmentedTabs} from '@/components/ui';
import {rankLearners, type RankingMetric, type RankingPeriod} from '@/lib/social-data';
import {useStudyStore} from '@/lib/store';
import {personalRankingValue,periodBounds} from '@/lib/progress';
import {cn} from '@/lib/utils';
import {RouteButton} from './social-ui';

export function LeaderboardPanel({compact = false}: {compact?: boolean}) {
  const t = useTranslations('social');
  const locale = useLocale();
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [metric, setMetric] = useState<RankingMetric>('xp');
  const name = useStudyStore(state => state.name);
  const level = useStudyStore(state => state.level);
  const streak = useStudyStore(state => state.streak);
  const xp = useStudyStore(state => state.xp);
  const studyDays = useStudyStore(state => state.studyDays);
  const completed = useStudyStore(state => state.completedLessons);
  const completedLessonDates=useStudyStore(state=>state.completedLessonDates);
  const rows = rankLearners(period, metric);
  const myValue = personalRankingValue({xp,studyDays,completedLessons:completed,completedLessonDates},period,metric);
  const myRank = rows.filter(row => row.value > myValue).length + 1;
  const format = (value: number) => `${value.toLocaleString(locale)} ${t(metric === 'xp' ? 'xpUnit' : metric === 'minutes' ? 'minuteShort' : 'lessonUnit')}`;
  if(compact){
    const bounds=periodBounds(period);const start=new Date(`${bounds.start}T12:00:00`),end=new Date(`${bounds.end}T12:00:00`);
    return <Card className="min-w-0 p-4 sm:p-6">
      <div className="flex items-center justify-between"><h2 className="section-title"><Trophy size={20} className="text-primary"/>{t('leaderboardTitle')}</h2><RouteButton page="leaderboard" variant="ghost"><ArrowRight size={16}/><span className="sr-only">{t('viewAll')}</span></RouteButton></div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('leaderboardSubtitle')}</p>
      <p className="my-3 text-[11px] text-muted-foreground">{start.toLocaleDateString(locale,{day:'numeric',month:'short'})} → {end.toLocaleDateString(locale,{day:'numeric',month:'short'})}</p>
      <div className="space-y-3"><SegmentedTabs value={period} onChange={value=>setPeriod(value as RankingPeriod)} items={(['week','month'] as const).map(value=>({value,label:t(value)}))}/><div><SegmentedTabs value={metric} onChange={value=>setMetric(value as RankingMetric)} items={(['xp','minutes'] as const).map(value=>({value,label:t(`metric${value}`)}))}/></div></div>
      <div className="my-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-[var(--accent-subtle)] p-3"><span className="w-6 text-center text-xs font-bold text-primary">{myRank}</span><Avatar name={name} level={level} size={36}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name} <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary">{t('you')}</span></p><p className="mt-1 text-[10px] text-muted-foreground">{t('levelValue',{value:level})}</p></div><strong className="text-xs">{format(myValue)}</strong></div>
      <div className="divide-y">{rows.map((learner,index)=><div key={learner.id} data-ranking-row={learner.id} className="flex items-center gap-3 px-1 py-3.5 hover:bg-muted/30"><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',index===0?'bg-amber-400/15 text-amber-700 dark:text-amber-300':index===1?'bg-slate-400/15 text-slate-600 dark:text-slate-300':index===2?'bg-orange-400/15 text-orange-700 dark:text-orange-300':'text-muted-foreground')}>{index+1}</span><Avatar name={learner.name} level={learner.level} size={36}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{learner.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{t('levelValue',{value:learner.level})}</p></div><span className="flex items-center gap-1.5 text-xs font-semibold">{metric==='minutes'&&<Clock size={12} className="text-muted-foreground"/>}{format(learner.value)}</span></div>)}</div>
    </Card>;
  }
  return <Card className={cn('overflow-hidden', compact ? 'p-5' : 'p-0')}>
    {compact && <div className="mb-5 flex items-center justify-between gap-2"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Trophy size={20} className="text-primary"/>{t('leaderboardTitle')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('leaderboardSubtitle')}</p></div><RouteButton page="leaderboard" variant="ghost"><ArrowRight size={18}/><span className="sr-only">{t('viewAll')}</span></RouteButton></div>}
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', !compact && 'border-b p-5')}><SegmentedTabs value={period} onChange={value => setPeriod(value as RankingPeriod)} items={(['week', 'month', 'allTime'] as const).filter(value => !compact || value !== 'allTime').map(value => ({value, label: t(value)}))}/><SegmentedTabs value={metric} onChange={value => setMetric(value as RankingMetric)} items={(['xp', 'minutes', 'lessons'] as const).filter(value => !compact || value !== 'lessons').map(value => ({value, label: t(`metric${value}`)}))}/></div>
    <div className={cn('flex items-end justify-center gap-3 border-b px-3 pt-9 sm:gap-5', compact ? 'pb-0' : 'bg-gradient-to-b from-amber-400/5 to-transparent pb-0 sm:pt-12')}>
      {[1, 0, 2].map(index => {const learner = rows[index]; const colors = ['border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300', 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300', 'border-orange-400/30 bg-orange-400/10 text-orange-700 dark:text-orange-300']; return <div key={learner.id} className={cn('flex w-1/3 max-w-52 flex-col items-center text-center', index === 0 && '-mt-3')}><div className="relative">{index === 0 && <Crown size={25} className="absolute -top-7 left-1/2 -translate-x-1/2 fill-amber-400/20 text-amber-500"/>}<Avatar name={learner.name} level={learner.level} size={compact ? (index === 0 ? 58 : 48) : (index === 0 ? 80 : 64)}/></div><p className="mt-4 w-full truncate px-1 text-xs font-semibold sm:text-sm">{learner.name}</p><p className="mb-3 mt-1 text-[11px] font-semibold text-primary sm:text-xs">{format(learner.value)}</p><div className={cn('flex w-full flex-col items-center justify-center rounded-t-2xl border border-b-0', colors[index], index === 0 ? 'h-24' : index === 1 ? 'h-16' : 'h-12')}><span className="text-2xl font-bold">{index + 1}</span></div></div>;})}
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{t('rankingTableCaption')}</caption><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="w-14 px-4 py-3 font-medium">{t('rank')}</th><th className="px-3 py-3 font-medium">{t('learner')}</th>{!compact && <><th className="hidden px-3 py-3 font-medium sm:table-cell">{t('level')}</th><th className="hidden px-3 py-3 font-medium sm:table-cell">{t('streak')}</th></>}<th className="whitespace-nowrap px-4 py-3 text-right font-medium">{t(`metric${metric}`)}</th></tr></thead><tbody>{rows.slice(0, compact ? 5 : 20).map((learner, index) => <tr key={learner.id} data-ranking-row={learner.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30"><td className="px-4 py-3 text-center font-semibold text-muted-foreground">{index < 3 ? <Medal size={19} className={cn('mx-auto', index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-orange-500')}/> : index + 1}</td><td className="px-3 py-3"><span className="flex items-center gap-3"><Avatar name={learner.name} level={learner.level} size={32}/><span className="max-w-28 truncate font-medium sm:max-w-none">{learner.name}</span></span></td>{!compact && <><td className="hidden px-3 py-3 sm:table-cell"><Badge>{t('levelValue', {value: learner.level})}</Badge></td><td className="hidden px-3 py-3 sm:table-cell"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Flame size={16} className="text-orange-500"/>{learner.streak}</span></td></>}<td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{format(learner.value)}</td></tr>)}</tbody></table></div>
    <div className={cn('flex items-center gap-3 border-t border-primary/20 bg-[var(--accent-subtle)] px-4 py-4', !compact && 'sticky bottom-0 z-10 backdrop-blur-xl')}><span className="w-9 text-center font-bold text-primary">{myRank}</span><Avatar name={name} level={level} size={34}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name} <span className="font-normal text-muted-foreground">({t('you')})</span></p><p className="mt-1 text-xs text-muted-foreground">{t('dayStreak', {count: streak})}</p></div><strong className="text-sm text-primary">{format(myValue)}</strong></div>
    {!compact && <p className="border-t px-5 py-3 text-xs text-muted-foreground">{t('rankingDemoNote')}</p>}
  </Card>;
}

export function LeaderboardPage() {
  const t = useTranslations('social');
  return <div className="page-shell"><PageTitle title={t('leaderboardTitle')} subtitle={t('leaderboardSubtitle')} icon={<Trophy size={24}/>}/><LeaderboardPanel/></div>;
}
