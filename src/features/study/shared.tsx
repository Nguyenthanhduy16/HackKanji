'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Check, Search, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export const inputClass = 'w-full min-h-11 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20';
export const sectionClass = 'border-l-4 border-primary pl-3 text-lg font-semibold';
export const levelStyles = (level: string) => ({ background: `var(--jlpt-${level.toLowerCase()}-subtle)`, color: `var(--jlpt-${level.toLowerCase()}-content)`, borderColor: `var(--jlpt-${level.toLowerCase()}-border)` });

export function BackLink({ href, label }: { href: string; label: string }) {
  const locale = useLocale();
  return <Link href={`/${locale}/${href}`} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16}/>{label}</Link>;
}
export function StudyLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const locale = useLocale();
  return <Link className={className} href={`/${locale}/${href}`}>{children}</Link>;
}
export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="absolute left-3 top-3.5 text-muted-foreground" size={18}/><input className={cn(inputClass, 'pl-10')} type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/></div>;
}
export function StatTile({ icon, label, value, className }: { icon?: ReactNode; label: string; value: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-3 rounded-xl bg-muted/40 p-3.5', className)}>{icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>}<div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></div></div>;
}
export function useClock(interval = 15_000) {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(timer); }, [interval]);
  // A state mutation can add a card between timer ticks. Use the current render
  // time as well, so a newly-created card is immediately available for review.
  return now ? Math.max(now, Date.now()) : 0;
}
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
export function AudioButton({ text, showLabel = true }: { text: string; showLabel?: boolean }) {
  const t = useTranslations('study');
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  function speak() {
    if (!('speechSynthesis' in window)) { setError(true); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; utterance.rate = 0.82;
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ja'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => { setPlaying(false); setError(true); };
    setPlaying(true); setError(false); window.speechSynthesis.speak(utterance);
  }
  return <div><Button variant="outline" size={showLabel ? 'sm' : 'icon'} onClick={speak} aria-label={t('listen')} title={t('audioNotice')} className={cn(playing && 'border-primary text-primary')}><Volume2 size={16}/>{showLabel && t('listen')}</Button>{error && <p role="status" className="mt-2 max-w-sm text-xs text-muted-foreground">{t('audioUnavailable')}</p>}</div>;
}
export function SavedNotice({ visible }: { visible: boolean }) {
  const t = useTranslations('study');
  return visible ? <span role="status" className="inline-flex items-center gap-1 text-xs text-success"><Check size={14}/>{t('saved')}</span> : null;
}
export function StudySkeleton() {
  return <div aria-busy="true" className="space-y-6"><div className="h-16 w-2/3 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"/><div className="h-44 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"/><div className="grid gap-5 md:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"/>)}</div></div>;
}
