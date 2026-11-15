'use client';

import type { ReactNode } from 'react';
import { NextIntlClientProvider, useLocale, useMessages } from 'next-intl';
import vi from '@/messages/study.vi.json';
import en from '@/messages/study.en.json';
import ja from '@/messages/study.ja.json';
import { VocabularyPage as Vocabulary } from './vocabulary';
import { GrammarPage as Grammar } from './grammar';
import { ReviewPage as Review } from './review';
import { ExamsPage as Exams } from './exams';
import { GamesPage as Games } from './games';

function StudyMessages({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const messages = useMessages();
  const catalog = locale === 'ja' ? ja : locale === 'en' ? en : vi;
  return <NextIntlClientProvider locale={locale} messages={{ ...messages, study: catalog }}>{children}</NextIntlClientProvider>;
}
export function VocabularyPage(props: { deckId?: string }) { return <StudyMessages><Vocabulary {...props}/></StudyMessages>; }
export function GrammarPage(props: { grammarId?: string }) { return <StudyMessages><Grammar {...props}/></StudyMessages>; }
export function ReviewPage() { return <StudyMessages><Review/></StudyMessages>; }
export function ExamsPage(props: { examId?: string }) { return <StudyMessages><Exams {...props}/></StudyMessages>; }
export function GamesPage(props: { gameId?: string }) { return <StudyMessages><Games {...props}/></StudyMessages>; }
