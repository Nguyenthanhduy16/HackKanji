"use client";

import {useEffect,useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {ChevronDown,MessageCircle} from 'lucide-react';
import {Badge,Button,Card} from '@/components/ui';
import {useAccountIdentity} from '@/features/account';

type LessonComment={id:string;text:string;createdAt:string};

export function LessonComments({lessonId}:{lessonId:string}) {
  const t=useTranslations('social');const lessons=useTranslations('lessons');const locale=useLocale();
  const [comments,setComments]=useState<LessonComment[]>([]);
  const [draft,setDraft]=useState('');const [status,setStatus]=useState<'saved'|'error'|null>(null);
  const accountId=useAccountIdentity();
  const storageKey=`nhaikanji-lesson-comments-${lessonId}${accountId?`:account:${accountId}`:''}`;
  useEffect(()=>{
    try {
      const saved:unknown=JSON.parse(localStorage.getItem(storageKey)??'[]');
      setComments(Array.isArray(saved)?saved.filter((item):item is LessonComment=>!!item&&typeof item.id==='string'&&typeof item.text==='string'&&typeof item.createdAt==='string'&&Number.isFinite(Date.parse(item.createdAt))):[]);
    } catch {setComments([]);}
  },[storageKey]);
  const save=()=>{
    const text=draft.trim();if(!text)return;
    const next=[...comments,{id:crypto.randomUUID(),text,createdAt:new Date().toISOString()}];
    try {localStorage.setItem(storageKey,JSON.stringify(next));setComments(next);setDraft('');setStatus('saved');}
    catch {setStatus('error');}
  };
  return <Card><details className="group">
    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-5 text-sm font-semibold">
      <span className="flex items-center gap-2"><MessageCircle size={16} className="text-primary"/>{t('comments')}<Badge>{comments.length}</Badge></span>
      <ChevronDown size={16} className="transition-transform group-open:rotate-180"/>
    </summary>
    <div className="space-y-4 border-t border-border p-4">
      <p className="text-xs leading-5 text-muted-foreground">{t('localCommentsNote')}</p>
      <ul className="space-y-3">{comments.map(comment=><li key={comment.id} className="rounded-xl border border-border bg-canvas/50 p-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{comment.text}</p>
        <time dateTime={comment.createdAt} className="mt-2 block text-[10px] text-muted-foreground">{new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(comment.createdAt))}</time>
      </li>)}</ul>
      <form className="space-y-3" onSubmit={event=>{event.preventDefault();save();}}>
        <textarea aria-label={t('comments')} value={draft} onChange={event=>{setDraft(event.target.value);setStatus(null);}} maxLength={2000} placeholder={t('commentPlaceholder')} className="min-h-24 w-full rounded-xl border border-border bg-canvas/50 p-3 text-sm outline-none focus:border-primary"/>
        <div className="flex flex-wrap items-center justify-between gap-2"><span role="status" className="text-xs text-muted-foreground">{status&&lessons(status==='saved'?'noteSaved':'saveFailed')}</span><Button type="submit" size="sm" disabled={!draft.trim()}>{t('addComment')}</Button></div>
      </form>
    </div>
  </details></Card>;
}
