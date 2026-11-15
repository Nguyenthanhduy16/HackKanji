"use client";

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {BookMarked, BookOpen, Plus, Trash2, Volume2} from 'lucide-react';
import {Badge, Button, Card, EmptyState, JlptBadge, Modal, PageTitle} from '@/components/ui';
import {useSocialStore} from '@/lib/social-store';
import {useLearningStore} from '@/lib/study-store';
import {VOCABULARY} from '@/lib/study-data';
import {Field, fieldClass, Filters, Notice, RouteButton, SearchField, useNotice} from './social-ui';

export function VocabularyPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const studyText = useTranslations('study');
  const learning = useLearningStore();
  const personal = useSocialStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({word: '', reading: '', meaning: '', level: 'N5'});
  const [removing, setRemoving] = useState<{id: string; local: boolean} | null>(null);
  const {message, notify} = useNotice();
  const rows = [...learning.cards.map(card => ({...card, meaning: card.meaningKey ? studyText(card.meaningKey) : card.meaning, level: VOCABULARY.find(word => word.word === card.word)?.level ?? '', local: false})), ...personal.words.filter(word => !learning.cards.some(card => card.word === word.word)).map(word => ({...word, local: true}))];
  const visible = rows.filter(word => (filter === 'all' || word.level === filter) && `${word.word} ${word.reading} ${word.meaning}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
  const addWord = () => {
    if (rows.some(word => word.word === draft.word.trim())) {notify(t('duplicateWord')); return;}
    const deckId = learning.decks.find(deck => deck.name === t('personalDeckName'))?.id ?? learning.createDeck(t('personalDeckName'), t('personalDeckDescription'));
    if (learning.addCard(deckId, draft)) {setOpen(false); setDraft({word: '', reading: '', meaning: '', level: 'N5'}); notify(t('wordSaved'));}
  };
  const speak = (text: string) => {if (!('speechSynthesis' in window)) {notify(t('speechUnavailable')); return;} const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ja-JP'; utterance.rate = 0.8; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);};
  return <div className="page-shell"><PageTitle title={t('vocabularyTitle')} subtitle={t('vocabularySubtitle')} icon={<BookMarked size={24}/>} actions={<><RouteButton page="review" variant="outline"><BookOpen size={16}/>{t('reviewWords')}</RouteButton><Button onClick={() => setOpen(true)}><Plus size={16}/>{t('addWord')}</Button></>}/><Notice message={message}/><div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row"><SearchField value={query} onChange={setQuery} placeholder={t('searchWords')}/><Filters value={filter} onChange={setFilter} items={[{value: 'all', label: t('all'), count: rows.length}, ...['N5', 'N4', 'N3', 'N2', 'N1'].map(value => ({value, label: value}))]}/></div>
    {visible.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{t('vocabularyTitle')}</caption><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-4">{t('word')}</th><th className="hidden px-4 py-4 sm:table-cell">{t('reading')}</th><th className="px-4 py-4">{t('meaning')}</th><th className="hidden px-4 py-4 sm:table-cell">{t('level')}</th><th className="w-24 px-3 py-4"><span className="sr-only">{t('actions')}</span></th></tr></thead><tbody>{visible.map(word => <tr key={word.id} className="border-t hover:bg-muted/20"><td className="px-5 py-4"><p lang="ja" className="font-jp text-lg font-medium">{word.word}</p><p lang="ja" className="mt-1 font-jp text-xs text-muted-foreground sm:hidden">{word.reading}</p></td><td className="hidden px-4 py-4 font-jp text-muted-foreground sm:table-cell" lang="ja">{word.reading}</td><td className="max-w-xs px-4 py-4">{word.meaning}</td><td className="hidden px-4 py-4 sm:table-cell">{word.level ? <JlptBadge level={word.level}/> : <Badge>{t('personalWord')}</Badge>}</td><td className="px-2 py-4"><div className="flex"><Button size="icon" variant="ghost" onClick={() => speak(word.word)} aria-label={t('listenWord')}><Volume2 size={16}/></Button><Button size="icon" variant="ghost" onClick={() => setRemoving({id: word.id, local: word.local})} aria-label={t('removeWord')}><Trash2 size={16}/></Button></div></td></tr>)}</tbody></table></div></Card> : <Card><EmptyState title={t(rows.length ? 'noSearchResults' : 'emptyVocabulary')} description={t(rows.length ? 'tryDifferentSearch' : 'emptyVocabularyDescription')}><RouteButton page="vocabulary">{t('exploreVocabulary')}</RouteButton></EmptyState></Card>}
    <p className="mt-5 text-center text-xs text-muted-foreground">{t('vocabularyIntegrationNote')}</p>
    <Modal open={open} onOpenChange={setOpen} title={t('addWord')}><form className="space-y-4" onSubmit={event => {event.preventDefault(); addWord();}}><Field label={t('word')}><input required lang="ja" className={fieldClass} value={draft.word} maxLength={80} onChange={event => setDraft({...draft, word: event.target.value})} placeholder={t('wordPlaceholder')}/></Field><Field label={t('reading')}><input required lang="ja" className={fieldClass} value={draft.reading} maxLength={80} onChange={event => setDraft({...draft, reading: event.target.value})} placeholder={t('readingPlaceholder')}/></Field><Field label={t('meaning')}><input required className={fieldClass} value={draft.meaning} maxLength={200} onChange={event => setDraft({...draft, meaning: event.target.value})} placeholder={t('meaningPlaceholder')}/></Field><div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => setOpen(false)}>{t('cancel')}</Button><Button disabled={!draft.word.trim() || !draft.reading.trim() || !draft.meaning.trim()} type="submit">{t('addWord')}</Button></div></form></Modal>
    <Modal open={Boolean(removing)} onOpenChange={open => !open && setRemoving(null)} title={t('removeWord')} description={t('removeWordDescription')}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoving(null)}>{t('cancel')}</Button><Button onClick={() => {if (removing?.local) personal.removeWord(removing.id); else if (removing) learning.deleteCard(removing.id); setRemoving(null); notify(t('wordRemoved'));}}>{t('delete')}</Button></div></Modal>
  </div>;
}
