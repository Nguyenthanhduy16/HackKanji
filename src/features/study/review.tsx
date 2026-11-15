'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen, Brain, GraduationCap } from 'lucide-react';
import { Button, Card, EmptyState, PageTitle } from '@/components/ui';
import { useLearningStore } from '@/lib/study-store';
import { isDue } from '@/lib/srs';
import { grammarReviewItem, ReviewSession, vocabularyReviewItem, type ReviewItem } from './review-session';
import { StatTile, StudyLink, StudySkeleton, useClock, useHydrated } from './shared';

export function ReviewPage() {
  const t = useTranslations('study'); const ready = useHydrated(); const now = useClock(); const state = useLearningStore(); const [session, setSession] = useState<ReviewItem[] | null>(null);
  const vocabulary = state.cards.filter(c => isDue(c.schedule, now)).map(c => vocabularyReviewItem(c, t));
  const grammar = state.grammar.filter(g => isDue(g.schedule, now)).map(g => grammarReviewItem(g.grammarId, g.schedule, t)).filter((item): item is ReviewItem => !!item);
  const items = [...vocabulary, ...grammar].sort((a, b) => a.schedule.dueAt - b.schedule.dueAt);
  if (!ready) return <StudySkeleton/>;
  if (session) return <ReviewSession items={session} onClose={() => setSession(null)}/>;
  return <div><PageTitle title={t('reviewTitle')} subtitle={t('reviewSubtitle')} icon={<Brain size={28}/>}/><Card className="mx-auto max-w-3xl">{items.length === 0 ? <EmptyState title={t('emptyReview')} description={t('emptyReviewHint')}><div className="flex flex-wrap justify-center gap-3"><Button asChild><StudyLink href="vocabulary">{t('exploreVocabulary')}<ArrowRight size={16}/></StudyLink></Button><Button variant="outline" asChild><StudyLink href="grammar">{t('exploreGrammar')}</StudyLink></Button></div></EmptyState> : <div className="p-6 sm:p-10"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary"><Brain size={40}/></div><h2 className="text-center text-2xl font-bold">{t('reviewReady')}</h2><p className="mt-3 text-center text-sm text-muted-foreground">{t('reviewSummary', { count: items.length })}</p><div className="my-8 grid gap-4 sm:grid-cols-2"><StatTile icon={<BookOpen size={21}/>} label={t('vocabulary')} value={vocabulary.length}/><StatTile icon={<GraduationCap size={21}/>} label={t('grammar')} value={grammar.length}/></div><Button className="min-h-12 w-full" onClick={() => setSession(items)}>{t('startReview')}<ArrowRight size={17}/></Button><p className="mt-4 text-center text-xs text-muted-foreground">{t('reviewTipBody')}</p></div>}</Card></div>;
}
