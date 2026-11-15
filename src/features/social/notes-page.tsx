"use client";

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {BookOpen, NotebookPen, Pencil, Plus, SearchX, StickyNote, Trash2} from 'lucide-react';
import {Badge, Button, Card, EmptyState, Modal, PageTitle} from '@/components/ui';
import {useSocialStore, type NoteInput, type PersonalNote} from '@/lib/social-store';
import {Field, fieldClass, Filters, Notice, SearchField, useNotice} from './social-ui';

const blankNote: NoteInput = {title: '', body: '', tag: 'N5'};
export function NotesPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const {notes, saveNote, deleteNote} = useSocialStore();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [draft, setDraft] = useState<NoteInput | null>(null);
  const [view, setView] = useState<PersonalNote | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const {message, notify} = useNotice();
  const visible = notes.filter(note => (tag === 'all' || note.tag === tag) && `${note.title} ${note.body}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
  return <div className="page-shell"><PageTitle title={t('notesTitle')} subtitle={t('notesSubtitle')} icon={<NotebookPen size={24}/>} actions={<Button onClick={() => setDraft({...blankNote})}><Plus size={17}/>{t('newNote')}</Button>}/><Notice message={message}/><div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row"><SearchField value={query} onChange={setQuery} placeholder={t('searchNotes')}/><Filters value={tag} onChange={setTag} items={[{value: 'all', label: t('all'), count: notes.length}, ...['N5', 'N4', 'N3', 'N2', 'N1'].map(value => ({value, label: value}))]}/></div>
    {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(note => <Card key={note.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md"><button onClick={() => setView(note)} className="flex-1 p-5 text-left"><div className="mb-4 flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600"><StickyNote size={22}/></span><Badge>{note.tag}</Badge></div><h2 className="line-clamp-2 break-words font-semibold">{note.title}</h2><p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{note.body}</p></button><div className="flex items-center justify-between border-t px-4 py-2"><time className="text-xs text-muted-foreground" dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleDateString(locale)}</time><div className="flex"><Button size="icon" variant="ghost" aria-label={t('editNote')} onClick={() => setDraft({...note})}><Pencil size={15}/></Button><Button size="icon" variant="ghost" aria-label={t('deleteNote')} onClick={() => setRemoving(note.id)}><Trash2 size={15}/></Button></div></div></Card>)}</div> : <Card><EmptyState title={t(notes.length ? 'noSearchResults' : 'emptyNotes')} description={t(notes.length ? 'tryDifferentSearch' : 'emptyNotesDescription')}><Button onClick={() => {if (notes.length) {setQuery(''); setTag('all');} else setDraft({...blankNote});}}><Plus size={16}/>{t(notes.length ? 'clearFilters' : 'newNote')}</Button></EmptyState></Card>}
    <p className="mt-5 text-center text-xs text-muted-foreground">{t('notesLocalNote')}</p>
    <Modal open={Boolean(draft)} onOpenChange={open => !open && setDraft(null)} title={t(draft?.id ? 'editNote' : 'newNote')}>{draft && <form className="space-y-4" onSubmit={event => {event.preventDefault(); if (saveNote(draft)) {setDraft(null); notify(t('noteSaved'));}}}><Field label={t('noteTitle')}><input className={fieldClass} value={draft.title} maxLength={120} required onChange={event => setDraft({...draft, title: event.target.value})} placeholder={t('noteTitlePlaceholder')}/></Field><Field label={t('noteBody')}><textarea className={fieldClass} rows={8} value={draft.body} maxLength={6000} required onChange={event => setDraft({...draft, body: event.target.value})} placeholder={t('noteBodyPlaceholder')}/></Field><Field label={t('noteTag')}><select className={fieldClass} value={draft.tag} onChange={event => setDraft({...draft, tag: event.target.value})}>{['N5', 'N4', 'N3', 'N2', 'N1'].map(value => <option key={value} value={value}>{value}</option>)}</select></Field><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>{t('cancel')}</Button><Button type="submit" disabled={!draft.title.trim() || !draft.body.trim()}>{t('saveNote')}</Button></div></form>}</Modal>
    <Modal open={Boolean(view)} onOpenChange={open => !open && setView(null)} title={view?.title ?? t('notesTitle')}>{view && <><Badge>{view.tag}</Badge><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{view.body}</p><Button className="mt-5" variant="outline" onClick={() => {setDraft({...view}); setView(null);}}><Pencil size={15}/>{t('editNote')}</Button></>}</Modal>
    <Modal open={Boolean(removing)} onOpenChange={open => !open && setRemoving(null)} title={t('deleteNote')} description={t('deleteNoteDescription')}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoving(null)}>{t('cancel')}</Button><Button onClick={() => {if (removing) deleteNote(removing); setRemoving(null); notify(t('noteDeleted'));}}>{t('delete')}</Button></div></Modal>
  </div>;
}
