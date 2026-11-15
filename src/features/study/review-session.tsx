'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Brain, CheckCircle2, RotateCw, X } from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { useLearningStore, type StudyCard } from '@/lib/study-store';
import { useStudyStore } from '@/lib/store';
import { GRAMMAR_POINTS } from '@/lib/study-data';
import { scheduleReview, type ReviewRating, type Schedule } from '@/lib/srs';
import { cn } from '@/lib/utils';
import { AudioButton } from './shared';

export interface ReviewItem { id: string; source: 'vocabulary' | 'grammar'; front: string; reading?: string; answer: string; example?: string; schedule: Schedule; }
export function vocabularyReviewItem(card: StudyCard, translate: (key: string) => string): ReviewItem {
  return { id: card.id, source: 'vocabulary', front: card.word, reading: card.reading, answer: card.meaningKey ? translate(card.meaningKey) : card.meaning, schedule: card.schedule };
}
export function grammarReviewItem(id: string, schedule: Schedule, translate: (key: string) => string): ReviewItem | null {
  const grammar = GRAMMAR_POINTS.find(g => g.id === id);
  return grammar ? { id, source: 'grammar', front: grammar.pattern, reading: grammar.reading, answer: translate(grammar.summaryKey), example: grammar.examples[0].text, schedule } : null;
}
const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy'];
const ratingStyle = ['border-destructive/30 bg-destructive/10 text-destructive', 'border-[var(--jlpt-n1-border)] bg-[var(--jlpt-n1-subtle)] text-[var(--jlpt-n1-content)]', 'border-success/30 bg-success/10 text-success', 'border-info/30 bg-info/10 text-info'];

export function ReviewSession({ items, onClose }: { items: ReviewItem[]; onClose: () => void }) {
  const t = useTranslations('study');
  const [queue] = useState(items);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [locked, setLocked] = useState(false);
  const card = queue[index];
  const reviewCard = useLearningStore(s => s.reviewCard);
  const reviewGrammar = useLearningStore(s => s.reviewGrammar);
  const recordReview = useStudyStore(s => s.recordReview);
  const rate = useCallback((rating: ReviewRating) => {
    if (!flipped || !card || locked) return;
    setLocked(true);
    if (card.source === 'vocabulary') reviewCard(card.id, rating); else reviewGrammar(card.id, rating);
    recordReview(); setFlipped(false); setIndex(i => i + 1);
  }, [flipped, card, locked, reviewCard, reviewGrammar, recordReview]);
  useEffect(() => setLocked(false), [index]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest('input, textarea, select, [role="dialog"]')) return;
      if (event.code === 'Space' && (event.target as HTMLElement).tagName !== 'BUTTON') { event.preventDefault(); if (card) setFlipped(f => !f); }
      const rating = ratings[Number(event.key) - 1];
      if (rating) { event.preventDefault(); rate(rating); }
    }
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [card, rate]);
  if (!card) return <Card className="mx-auto max-w-2xl p-8 text-center sm:p-14"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"><CheckCircle2 size={40}/></div><h1 className="mt-6 text-2xl font-bold">{t('sessionComplete')}</h1><p className="mt-3 text-muted-foreground">{t('sessionSummary', { count: index })}</p><Button className="mt-8" onClick={onClose}>{t('continueLearning')}<ArrowRight size={16}/></Button></Card>;
  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-muted-foreground">{t('sessionProgress', { current: index + 1, total: queue.length })}</span><Button variant="ghost" size="sm" onClick={onClose}><X size={16}/>{t('endSession')}</Button></div>
    <Progress value={index / queue.length * 100}/>
    <div className="relative" style={{ perspective: '1400px' }}>
      <button onClick={() => setFlipped(f => !f)} aria-label={t('flip')} aria-pressed={flipped} className="block w-full rounded-2xl text-center outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ minHeight: 360 }}>
        <div className="relative grid min-h-[360px] rounded-2xl transition-transform duration-300 motion-reduce:transition-none" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : undefined }}>
          <Card className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-6 p-8" style={{ backfaceVisibility: 'hidden' }}><Badge><Brain size={12}/>{t(card.source)}</Badge><span lang="ja" className="jp break-words text-4xl font-semibold sm:text-6xl">{card.front}</span><span className="text-sm text-muted-foreground">{t('readMeaning')}</span><span className="mt-4 flex items-center gap-2 text-xs text-primary"><RotateCw size={14}/>{t('flip')}</span></Card>
          <Card className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-5 border-primary/30 bg-primary/5 p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><span lang="ja" className="jp text-3xl font-semibold">{card.front}</span>{card.reading && <span lang={card.source === 'vocabulary' ? 'ja' : undefined} className="jp text-lg text-muted-foreground">{card.reading}</span>}<span className="text-2xl font-bold">{card.answer}</span>{card.example && <span lang="ja" className="jp text-base leading-8">{card.example}</span>}</Card>
        </div>
      </button>
    </div>
    <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{t('flipHint')}</p><AudioButton text={card.front} showLabel={false}/></div>
    {flipped ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{ratings.map((rating, i) => { const next = scheduleReview(card.schedule, rating); return <button key={rating} disabled={locked} onClick={() => rate(rating)} className={cn('min-h-20 rounded-xl border p-3 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none', ratingStyle[i])}><span className="mr-2 text-xs opacity-60">{i + 1}</span>{t(rating)}<span className="mt-1 block text-xs font-normal">{rating === 'again' ? t('oneMinute') : t('days', { count: next.interval })}</span></button>; })}</div> : <Button className="w-full min-h-12" onClick={() => setFlipped(true)}>{t('flip')}<RotateCw size={17}/></Button>}
  </div>;
}
