"use client";

import {useEffect} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {BookOpen, CalendarCheck, Check, CheckCheck, Gift, Headphones, Sparkles, Target, Trophy} from 'lucide-react';
import {Badge, Button, Card, PageTitle, Progress} from '@/components/ui';
import {gamification} from '@/lib/gamification/config';
import {useStudyStore} from '@/lib/store';
import {Currency, Notice, RouteButton, useNotice} from './social-ui';
import {cn} from '@/lib/utils';

const missionIcons = [CalendarCheck, Headphones, BookOpen, Trophy];
const missionRoutes = ['home', 'practice', 'review', 'speaking'];
export function MissionsPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const study = useStudyStore();
  const {message, notify} = useNotice();
  useEffect(() => {study.syncDay();}, [study.syncDay]);
  const completed = study.claimedMissions.length;
  return <div className="page-shell"><PageTitle title={t('missionsTitle')} subtitle={t('missionsSubtitle')} icon={<Target size={24}/>} actions={<Currency amount={study.dango}/>}/><Notice message={message}/><Card className="mb-6 overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-card to-amber-400/10 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><Badge className="mb-3 bg-primary/10 text-primary"><Sparkles size={13}/>{t('dailyChallenge')}</Badge><h2 className="text-xl font-bold">{t('missionBannerTitle')}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t('missionBannerDescription')}</p></div><div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-primary/10 text-2xl font-bold text-primary">{completed}<span className="text-sm font-medium text-muted-foreground">/4</span></div></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{t('claimedCount', {count: completed})}</span><span>{t('resetsDaily')}</span></div><Progress value={completed / 4 * 100}/></div></Card>
    <div className="grid gap-4 md:grid-cols-2">{gamification.missionTargets.map((target, index) => {const Icon = missionIcons[index]; const value = Math.min(target, study.missionsProgress[index]); const claimed = study.claimedMissions.includes(index); const ready = value >= target; return <Card key={index} className={cn('p-5', claimed && 'border-success/25')}><div className="flex items-start gap-4"><div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', claimed ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary')}>{claimed ? <CheckCheck size={25}/> : <Icon size={25}/>}</div><div className="flex-1"><h2 className="font-semibold">{t(`mission${index}Title`)}</h2><p className="mt-1 text-sm text-muted-foreground">{t(`mission${index}Description`)}</p><div className="mt-3 flex gap-2"><Badge className="bg-primary/10 text-primary">+{gamification.missionXP[index]} {t('xpUnit')}</Badge><Badge className="bg-amber-400/10 text-amber-800 dark:text-amber-300">🍡 +{gamification.missionDango[index]}</Badge></div></div></div><div className="my-5"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{t('progress')}</span><span>{value} / {target}</span></div><Progress value={value / target * 100}/></div><div className="flex items-center justify-between gap-2">{!ready ? <RouteButton page={missionRoutes[index]} variant="ghost">{t('goToMission')}</RouteButton> : <span className="text-xs text-success">{t(claimed ? 'rewardAdded' : 'readyToClaim')}</span>}<Button variant={claimed ? 'outline' : 'primary'} disabled={!ready || claimed} onClick={() => {if (study.claimMission(index)) notify(t('missionClaimed', {xp: gamification.missionXP[index], dango: gamification.missionDango[index]}));}}>{claimed ? <Check size={16}/> : <Gift size={16}/>} {t(claimed ? 'claimed' : 'claim')}</Button></div></Card>;})}</div><p className="mt-5 text-center text-xs leading-6 text-muted-foreground">{t('missionsHelp')}</p></div>;
}
