"use client";

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Bug, CheckCircle2, FileText, Heart, Lightbulb, MessageSquare, Save} from 'lucide-react';
import {Badge, Button, Card, PageTitle} from '@/components/ui';
import {useSocialStore} from '@/lib/social-store';
import {Field, fieldClass, Notice, useNotice} from './social-ui';

export function FeedbackPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const {feedbacks, saveFeedback} = useSocialStore();
  const [category, setCategory] = useState('idea');
  const [body, setBody] = useState('');
  const {message, notify} = useNotice();
  return <div className="page-shell"><PageTitle title={t('feedbackTitle')} subtitle={t('feedbackSubtitle')} icon={<MessageSquare size={24}/>}/><Notice message={message}/><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><Card className="p-5 sm:p-7"><h2 className="text-lg font-semibold">{t('feedbackFormTitle')}</h2><p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">{t('feedbackLocalNote')}</p><form className="space-y-5" onSubmit={event => {event.preventDefault(); if (saveFeedback(category, body)) {setBody(''); notify(t('feedbackSaved'));}}}><Field label={t('feedbackCategory')}><select value={category} className={fieldClass} onChange={event => setCategory(event.target.value)}>{['idea', 'bug', 'content', 'other'].map(value => <option key={value} value={value}>{t(`feedback${value}`)}</option>)}</select></Field><Field label={t('feedbackMessage')} hint={t('feedbackMessageHint')}><textarea value={body} className={fieldClass} onChange={event => setBody(event.target.value)} placeholder={t('feedbackPlaceholder')} required rows={8} maxLength={3000}/></Field><Button disabled={!body.trim()} type="submit"><Save size={17}/>{t('saveFeedbackLocally')}</Button></form></Card><div className="space-y-4"><Card className="border-primary/20 bg-primary/5 p-5"><Heart className="text-primary" size={27}/><h2 className="mt-4 font-semibold">{t('feedbackThankYou')}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('feedbackThankYouDescription')}</p></Card><Card className="p-5"><h2 className="mb-4 font-semibold">{t('helpfulFeedback')}</h2>{[{key: 'feedbackTipOne', Icon: Bug}, {key: 'feedbackTipTwo', Icon: Lightbulb}, {key: 'feedbackTipThree', Icon: FileText}].map(({key, Icon}) => <p className="mb-4 flex gap-3 text-sm leading-6 text-muted-foreground last:mb-0" key={key}><Icon size={17} className="mt-1 shrink-0 text-primary"/>{t(key)}</p>)}</Card></div></div>{feedbacks.length > 0 && <section className="mt-7"><h2 className="mb-4 text-lg font-semibold">{t('savedFeedback')}</h2><div className="space-y-3">{feedbacks.map(feedback => <Card key={feedback.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Badge>{t(`feedback${feedback.category}`)}</Badge><time className="text-xs text-muted-foreground" dateTime={feedback.createdAt}>{new Date(feedback.createdAt).toLocaleDateString(locale)}</time></div><p className="my-3 whitespace-pre-wrap break-words text-sm leading-6">{feedback.body}</p><span className="inline-flex items-center gap-1.5 text-xs text-success"><CheckCircle2 size={14}/>{t('savedOnlyOnDevice')}</span></Card>)}</div></section>}</div>;
}
