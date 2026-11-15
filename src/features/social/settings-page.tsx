"use client";

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import {useTheme} from 'next-themes';
import {Bell, Check, Globe2, Monitor, Moon, Settings2, ShieldCheck, Sun, Target} from 'lucide-react';
import {Button, Card, PageTitle, Switch} from '@/components/ui';
import {useSocialStore} from '@/lib/social-store';
import {useStudyStore} from '@/lib/store';
import {cn} from '@/lib/utils';
import {Field, fieldClass, Notice, RouteButton, useNotice} from './social-ui';
import {AccountSettings} from '@/features/account';

export function SettingsPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);
  const social = useSocialStore();
  const name = useStudyStore(state => state.name);
  const setName = useStudyStore(state => state.setName);
  const [draftName, setDraftName] = useState(name);
  const {message, notify} = useNotice();
  useEffect(() => setMounted(true), []);
  useEffect(() => setDraftName(name), [name]);
  const changeLocale = (value: string) => {const parts = pathname.split('/'); parts[1] = value; document.cookie = `NEXT_LOCALE=${value}; Path=/; Max-Age=31536000; SameSite=Lax`; router.push(parts.join('/'));};
  return <div className="page-shell"><PageTitle title={t('settingsTitle')} subtitle={t('settingsSubtitle')} icon={<Settings2 size={24}/>}/><Notice message={message}/><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-5">
    <Card className="p-5 sm:p-6"><h2 className="flex items-center gap-2 font-semibold"><Sun size={19} className="text-primary"/>{t('appearance')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('appearanceDescription')}</p><div className="mt-5 grid grid-cols-3 gap-3">{[{value: 'light', Icon: Sun}, {value: 'dark', Icon: Moon}, {value: 'system', Icon: Monitor}].map(({value, Icon}) => <button key={value} onClick={() => setTheme(value)} aria-pressed={mounted && theme === value} className={cn('relative rounded-xl border-2 p-3 text-left transition-colors', mounted && theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}><div className={cn('mb-3 flex h-20 gap-2 overflow-hidden rounded-lg border p-2', value === 'dark' ? 'border-zinc-700 bg-zinc-900' : value === 'system' ? 'border-zinc-300 bg-gradient-to-r from-zinc-50 from-50% to-zinc-900 to-50%' : 'border-zinc-200 bg-white')}><span className="w-1/4 rounded bg-primary/20"/><span className="flex-1 space-y-1.5"><span className="block h-2 w-3/4 rounded bg-primary/30"/><span className="block h-5 rounded bg-primary/10"/><span className="block h-4 rounded bg-primary/10"/></span></div><span className="flex items-center gap-2 text-xs font-semibold sm:text-sm"><Icon size={16}/>{t(`theme${value}`)}</span>{mounted && theme === value && <Check size={14} className="absolute right-3 bottom-3 text-primary"/>}</button>)}</div></Card>
    <Card className="p-5 sm:p-6"><h2 className="mb-5 flex items-center gap-2 font-semibold"><Globe2 size={19} className="text-primary"/>{t('language')}</h2><Field label={t('displayLanguage')} hint={t('languageDescription')}><select value={locale} onChange={event => changeLocale(event.target.value)} className={fieldClass}>{['vi', 'en', 'ja'].map(value => <option key={value} value={value}>{t(`language${value}`)}</option>)}</select></Field></Card>
    <Card className="p-5 sm:p-6"><h2 className="mb-5 flex items-center gap-2 font-semibold"><Target size={19} className="text-primary"/>{t('learningPreferences')}</h2><Field label={t('dailyGoal')} hint={t('dailyGoalDescription')}><select value={social.preferences.dailyGoal} className={fieldClass} onChange={event => {social.setPreference('dailyGoal', Number(event.target.value)); notify(t('preferencesSaved'));}}>{[5, 10, 15, 30, 60].map(value => <option key={value} value={value}>{t('minutesValue', {count: value})}</option>)}</select></Field><div className="mt-5 rounded-xl bg-muted/40 p-4"><p className="text-xs leading-6 text-muted-foreground">{t('dailyGoalLocalNote')}</p></div></Card>
    <Card className="p-5 sm:p-6"><h2 className="mb-5 flex items-center gap-2 font-semibold"><ShieldCheck size={19} className="text-primary"/>{t('account')}</h2><form className="space-y-4" onSubmit={event => {event.preventDefault(); if (draftName.trim()) {setName(draftName); notify(t('profileSaved'));}}}><Field label={t('displayName')}><input required maxLength={48} className={fieldClass} value={draftName} onChange={event => setDraftName(event.target.value)}/></Field><Button type="submit" disabled={!draftName.trim() || draftName === name}>{t('saveChanges')}</Button></form><div className="mt-5 border-t pt-5"><Switch label={t('publicProfile')} checked={social.profile.isPublic} onCheckedChange={value => social.updateProfile({isPublic: value})}/><p className="mt-2 text-xs text-muted-foreground">{t('privacyLocalNote')}</p></div></Card><AccountSettings />
  </div><Card className="p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={23}/></span><h2 className="mt-4 font-semibold">{t('yourLocalSpace')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('localSpaceDescription')}</p><div className="mt-5"><RouteButton page="feedbacks" variant="outline">{t('sendFeedback')}</RouteButton></div></Card></div></div>;
}
