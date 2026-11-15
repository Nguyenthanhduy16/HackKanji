'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, BarChart3, BookOpenCheck, ChevronRight, Clock3, ListChecks, Pause, Play, RotateCcw, SlidersHorizontal, Trophy, X } from 'lucide-react';
import { Badge, Button, Card, EmptyState, JlptBadge, Modal, PageTitle, Progress } from '@/components/ui';
import {
  PAST_MINUTES, PAST_SECTIONS, PAST_SECTION_JP, PAST_TYPES, buildBank, buildSessionIds, chunkAt, examHtml, examIds, filterPool,
  imagesOf, instrOf, passageOf, resolveExam, scoreSession, tabKeyOf, tabsFor, tagLabel, typeMeta,
  type PastBank, type PastQuestion, type PastSection, type PastType, type RawExam, type StatusFilter,
} from '@/lib/past-papers';
import { usePastStore, type PastSession } from '@/lib/past-papers-store';
import { cn, formatTime } from '@/lib/utils';
import { BackLink, StatTile, StudyLink, StudySkeleton, inputClass, sectionClass } from './shared';

/* Content lives outside the repository (see docs/JLPT-PAST-PAPERS.md). */
const BASE = (process.env.NEXT_PUBLIC_JLPT_BASE || '/jlpt').replace(/\/$/, '');

// ---------------------------------------------------------------- data loading
type BankState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; bank: PastBank };
const bankCache = new Map<string, Promise<PastBank | null>>();
let levelsCache: Promise<string[]> | null = null;
async function getJson<T>(url: string): Promise<T | null> { try { const r = await fetch(url); return r.ok ? await r.json() as T : null; } catch { return null; } }
export function loadLevels() {
  levelsCache ??= getJson<{ levels: string[] }>(`${BASE}/index.json`).then(d => (d?.levels ?? []).map(l => l.toUpperCase()));
  return levelsCache;
}
function loadBank(level: string) {
  const key = level.toUpperCase();
  if (!bankCache.has(key)) bankCache.set(key, (async () => {
    const lv = `${BASE}/${key.toLowerCase()}`;
    const ix = await getJson<{ tags: string[] }>(`${lv}/exams/index.json`);
    if (!ix?.tags?.length) return null;
    const exams = (await Promise.all(ix.tags.map(t => getJson<RawExam>(`${lv}/exams/${t}.json`)))).filter((e): e is RawExam => !!e);
    return exams.length ? buildBank(key, exams.map(e => resolveExam(e, lv))) : null;
  })());
  return bankCache.get(key)!;
}
function usePastBank(level: string | undefined): BankState {
  const [state, setState] = useState<BankState>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    if (!level) { setState({ status: 'missing' }); return; }
    loadBank(level).then(bank => { if (live) setState(bank ? { status: 'ready', bank } : { status: 'missing' }); });
    return () => { live = false; };
  }, [level]);
  return state;
}
function useLevels() {
  const [levels, setLevels] = useState<string[] | null>(null);
  useEffect(() => { let live = true; loadLevels().then(l => { if (live) setLevels(l); }); return () => { live = false; }; }, []);
  return levels;
}
function Html({ html, className }: { html: string; className?: string }) {
  // Exam markup is sanitised by scripts/jlpt/n2build.py: only <u>, <p>, <br>, <b> survive.
  return <span lang="ja" className={cn('jp', className)} dangerouslySetInnerHTML={{ __html: examHtml(html) }}/>;
}
const partLabel = (p: PastSection | 'all') => p === 'all' ? '言語知識・読解・聴解' : PAST_SECTION_JP[p];

// ---------------------------------------------------------------- library section (inside /exams)
export function PastPapersSection() {
  const t = useTranslations('study'); const router = useRouter(); const locale = useLocale();
  const levels = useLevels();
  const [level, setLevel] = useState<string>();
  useEffect(() => { if (levels?.length && !level) setLevel(levels.includes('N2') ? 'N2' : levels[0]); }, [levels, level]);
  const state = usePastBank(levels === null ? 'N2' : level);
  const progress = usePastStore(s => s.progress); const results = usePastStore(s => s.results); const start = usePastStore(s => s.start); const session = usePastStore(s => s.session);

  const header = <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className={sectionClass}>{t('pastTitle')}</h2>
    <div className="flex flex-wrap gap-2">
      {session && <Button size="sm" asChild><StudyLink href="exams/past-session"><Play size={15}/>{t('pastResume')}</StudyLink></Button>}
      <Button variant="secondary" size="sm" asChild><StudyLink href="exams/past-custom"><SlidersHorizontal size={15}/>{t('pastCustom')}</StudyLink></Button>
      <Button variant="outline" size="sm" asChild><StudyLink href="exams/past-review"><BarChart3 size={15}/>{t('pastReview')}</StudyLink></Button>
    </div>
  </div>;
  if (state.status === 'loading') return <section className="space-y-4">{header}<StudySkeleton/></section>;
  if (state.status === 'missing') return <section className="space-y-4">{header}<Card className="p-6"><EmptyState title={t('pastMissingTitle')} description={t('pastMissingHint')}/></Card></section>;

  const { bank } = state; const lv = bank.level.toLowerCase();
  const done = bank.list.filter(q => progress[q.id]); const right = done.filter(q => progress[q.id][0]).length;
  const wrong = done.length - right;
  const years = [...new Set(bank.tags.map(tg => tg.slice(0, 4)))].sort().reverse();
  function go(tag: string, part: PastSection | 'all') {
    const ids = examIds(bank, tag, part);
    start({ level: bank.level, title: `${bank.level} ${tagLabel(tag)} · ${partLabel(part)}`, sub: t('pastExamMode'), mode: 'exam', ids, minutes: PAST_MINUTES[part], resultKey: `${lv}|${tag}|${part}` });
    router.push(`/${locale}/exams/past-session`);
  }
  return <section className="space-y-4">
    {header}
    <div className="flex flex-wrap items-center gap-2">
      {(levels ?? [bank.level]).map(l => <button key={l} onClick={() => setLevel(l)} aria-pressed={l === bank.level} className="rounded-full focus-visible:ring-2 focus-visible:ring-ring"><JlptBadge level={l} className={cn('px-3 py-1 text-xs', l !== bank.level && 'opacity-50')}/></button>)}
      <p className="text-sm text-muted-foreground">{t('pastSubtitle', { count: bank.tags.length, questions: bank.list.length })}</p>
    </div>
    <div className="grid grid-cols-3 gap-3"><StatTile label={t('pastDone')} value={`${done.length}/${bank.list.length}`}/><StatTile label={t('pastAccuracy')} value={`${done.length ? Math.round(right / done.length * 100) : 0}%`}/><StatTile label={t('pastWrongNow')} value={wrong}/></div>
    {years.map(y => <div key={y}>
      <h3 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">{y}</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {bank.tags.filter(tg => tg.startsWith(y)).reverse().map(tag => {
          const parts = PAST_SECTIONS.filter(p => bank.list.some(q => q.tag === tag && q.sec === p));
          const full = results[`${lv}|${tag}|all`];
          return <Card key={tag} className="p-4">
            <div className="flex items-baseline justify-between"><p className="text-xl font-bold">{tagLabel(tag)}</p><span className="text-xs text-muted-foreground">{t('pastQuestionCount', { count: bank.list.filter(q => q.tag === tag).length })}</span></div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">{parts.map(p => {
              const r = results[`${lv}|${tag}|${p}`]; const pct = r ? Math.round(r[0] / r[1] * 100) : null;
              return <button key={p} onClick={() => go(tag, p)} className="rounded-lg border bg-muted/40 px-1 py-2 text-center transition hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring">
                <span lang="ja" className="jp block text-xs font-bold">{PAST_SECTION_JP[p]}</span>
                <span className={cn('text-[11px] tabular-nums', pct === null ? 'text-muted-foreground' : pct >= 60 ? 'text-success' : 'text-destructive')}>{pct === null ? '—' : `${pct}%`}</span>
              </button>;
            })}</div>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => go(tag, 'all')}><Clock3 size={14}/>{t('pastFullExam', { minutes: PAST_MINUTES.all })}{full ? ` · ${Math.round(full[0] / full[1] * 100)}%` : ''}</Button>
          </Card>;
        })}
      </div>
    </div>)}
    <p className="text-xs leading-6 text-muted-foreground">{t('pastDisclaimer')}</p>
  </section>;
}

// ---------------------------------------------------------------- session (exam or instant practice)
export function PastSessionPage() {
  const t = useTranslations('study'); const session = usePastStore(s => s.session);
  const state = usePastBank(session?.level);
  if (!session) return <div className="mx-auto max-w-2xl"><BackLink href="exams" label={t('examsTitle')}/><Card className="p-6"><EmptyState title={t('pastNoSession')} description={t('pastNoSessionHint')}/></Card></div>;
  if (state.status === 'loading') return <StudySkeleton/>;
  if (state.status === 'missing') return <Card className="p-6"><EmptyState title={t('pastMissingTitle')} description={t('pastMissingHint')}/></Card>;
  return <Runner bank={state.bank} session={session}/>;
}

function Runner({ bank, session }: { bank: PastBank; session: PastSession }) {
  const t = useTranslations('study'); const router = useRouter(); const locale = useLocale();
  const { answer, setTab, setTimer, grade, quit, start } = usePastStore();
  const ids = useMemo(() => session.ids.filter(id => bank.byId[id]), [session.ids, bank]);
  const tabs = useMemo(() => tabsFor(bank, ids), [bank, ids]);
  const tab = tabs.find(x => x.key === session.tab) ?? tabs[0];
  const [confirm, setConfirm] = useState(false); const [quitOpen, setQuitOpen] = useState(false); const [gridOpen, setGridOpen] = useState(false);
  const shown = (id: string) => session.graded || (session.mode === 'instant' && session.answers[id] !== undefined);
  const listenTags = [...new Set(tab?.ids.filter(id => bank.byId[id].sec === 'cho').map(id => bank.byId[id].tag) ?? [])];
  const hasListening = ids.some(id => bank.byId[id].sec === 'cho');
  const [playerTag, setPlayerTag] = useState<string | undefined>(listenTags[0]);
  useEffect(() => { if (listenTags[0] && listenTags[0] !== playerTag) setPlayerTag(listenTags[0]); }, [listenTags, playerTag]);
  const answered = ids.filter(id => session.answers[id] !== undefined).length;
  const score = scoreSession(bank, ids, session.answers);
  const doGrade = useCallback(() => { grade(bank.byId); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [grade, bank]);

  function jump(id: string) {
    const key = tabKeyOf(bank, ids, bank.byId[id]);
    if (key !== tab?.key) setTab(key);
    setGridOpen(false);
    requestAnimationFrame(() => setTimeout(() => document.getElementById(`pq-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30));
  }
  function moveTab(d: number) { const i = tabs.findIndex(x => x.key === tab?.key) + d; if (tabs[i]) { setTab(tabs[i].key); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  function retryWrong() {
    const wrong = ids.filter(id => session.answers[id] !== bank.byId[id].a); const units = new Set(wrong.map(id => bank.byId[id].unit));
    start({ level: bank.level, title: t('pastRetryWrongTitle'), sub: session.title, mode: 'instant', ids: ids.filter(id => units.has(bank.byId[id].unit)) });
  }

  // render the active tab: mondai headings, passages (once per unit), questions
  const blocks: React.ReactNode[] = []; let lastM = ''; let lastU = '';
  tab?.ids.forEach(id => {
    const q = bank.byId[id]; const mk = `${q.tag}-${q.sec}-${q.no}`;
    if (mk !== lastM) {
      lastM = mk; lastU = '';
      blocks.push(<div key={`m-${mk}`} className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-foreground pb-2 first:mt-2">
        <span lang="ja" className="jp text-lg font-bold">{q.sec === 'cho' ? '聴解 ' : ''}問題{q.no}</span>
        <Html className="w-full min-w-0 text-sm sm:w-auto sm:flex-1" html={instrOf(bank, q)}/>
        <span className="text-xs font-semibold text-muted-foreground">{tagLabel(q.tag)} · {t(`pastType_${q.type}`)}</span>
      </div>);
    }
    if (q.unit !== q.id && q.unit !== lastU) {
      lastU = q.unit; const imgs = imagesOf(bank, q); const ps = passageOf(bank, q);
      blocks.push(<div key={`p-${q.unit}`} className="mt-4">
        {imgs.length > 0 && <div className="space-y-2">{imgs.map(src => /* eslint-disable-next-line @next/next/no-img-element */ <img key={src} src={src} alt={t('pastOriginalPage', { exam: tagLabel(q.tag) })} className="w-full rounded-xl border bg-white"/>)}</div>}
        {ps && (imgs.length ? <details className="mt-2"><summary className="cursor-pointer text-sm text-muted-foreground">{t('pastTextVersion')}</summary><Passage html={ps}/></details> : <Passage html={ps}/>)}
      </div>);
    }
    blocks.push(<QuestionBlock key={id} bank={bank} q={q} pick={session.answers[id]} show={shown(id)} onPick={k => answer(id, k, q.a)}/>);
  });
  listenTags.forEach(tag => {
    const L = bank.exams[tag].listen!; const any = tab!.ids.some(id => bank.byId[id].tag === tag && shown(id));
    blocks.push(any
      ? <details key={`sc-${tag}`} className="mt-6 rounded-xl border bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">{t('pastScript', { exam: tagLabel(tag) })}</summary>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={L.sc} width={L.scW} height={L.scH} loading="lazy" alt={t('pastScript', { exam: tagLabel(tag) })} className="mt-3 h-auto w-full rounded-lg bg-white"/></details>
      : <p key={`sc-${tag}`} className="mt-6 text-xs text-muted-foreground">{t('pastScriptLater')}</p>);
  });

  return <div>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{session.sub}</p><h1 lang="ja" className="jp mt-1 text-xl font-bold sm:text-2xl">{session.title}</h1></div>
      <Button variant="ghost" size="sm" onClick={() => session.graded ? (quit(), router.push(`/${locale}/exams`)) : setQuitOpen(true)}><X size={16}/>{t('pastQuit')}</Button>
    </div>
    {session.graded && <ResultCard bank={bank} ids={ids} answers={session.answers} onRetryWrong={score.correct < score.total ? retryWrong : undefined}/>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        {hasListening && playerTag && bank.exams[playerTag].listen && <Player key={playerTag} tag={playerTag} level={bank.level} listen={bank.exams[playerTag].listen!}/>}
        <nav aria-label={t('pastParts')} className="flex flex-wrap items-center gap-1.5 border-b py-3">
          {tabs.map((x, i) => <span key={x.key} className="contents">
            {(i === 0 || tabs[i - 1].sec !== x.sec) && new Set(tabs.map(y => y.sec)).size > 1 && <span lang="ja" className="jp ml-1 text-[11px] font-bold text-muted-foreground first:ml-0">{PAST_SECTION_JP[x.sec]}</span>}
            <button onClick={() => setTab(x.key)} aria-pressed={x.key === tab?.key} className={cn('jp rounded-full border px-3 py-1 text-sm font-semibold transition', x.key === tab?.key ? 'border-primary bg-primary/10 text-primary' : 'bg-card hover:border-primary/40')}>{x.label}</button>
          </span>)}
        </nav>
        <div>{blocks}</div>
        <div className="mt-8 flex justify-between gap-3 border-t pt-5">
          <Button variant="outline" disabled={tabs[0]?.key === tab?.key} onClick={() => moveTab(-1)}><ArrowLeft size={16}/>{t('previous')}</Button>
          <Button variant="outline" disabled={tabs[tabs.length - 1]?.key === tab?.key} onClick={() => moveTab(1)}>{t('next')}<ArrowRight size={16}/></Button>
        </div>
      </div>
      <aside className={cn('fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 max-h-[60vh] overflow-auto rounded-t-2xl border bg-card p-4 shadow-lg lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:rounded-2xl lg:shadow-none', 'self-start')}>
        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
          <Timer session={session} onStart={() => setTimer(Date.now() + (session.minutes ?? 30) * 60_000)} onStop={() => setTimer(null)} onExpire={doGrade}/>
          <p className="text-sm text-muted-foreground">{t('answeredCount', { count: answered, total: ids.length })}{(session.mode === 'instant' || session.graded) && <> · {t('pastCorrectShort', { count: score.correct })}</>}</p>
          <Progress className="hidden lg:block" value={answered / Math.max(1, ids.length) * 100}/>
          {!session.graded && <Button onClick={() => session.mode === 'exam' && answered < ids.length ? setConfirm(true) : doGrade()}>{session.mode === 'exam' ? t('submitExam') : t('pastFinish')}</Button>}
          <Button variant="outline" size="sm" className="lg:hidden" aria-expanded={gridOpen} onClick={() => setGridOpen(o => !o)}><ListChecks size={15}/>{t('pastQuestionList')}</Button>
        </div>
        <div className={cn('mt-3 border-t pt-3 lg:block', gridOpen ? 'block' : 'hidden')}>
          {tabs.map(x => <div key={x.key} className="mb-3">
            <p lang="ja" className="jp mb-1.5 text-xs font-bold">{new Set(tabs.map(y => y.sec)).size > 1 ? `${PAST_SECTION_JP[x.sec]} · ` : ''}{x.label}</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1 lg:grid-cols-5">{x.ids.map(id => {
              const q = bank.byId[id]; const a = session.answers[id]; const show = shown(id);
              return <button key={id} onClick={() => jump(id)} title={`${tagLabel(q.tag)} · 問題${q.no} · ${q.sec === 'cho' ? q.q : q.n}`}
                className={cn('h-8 rounded-md border text-xs font-semibold tabular-nums', show ? (a === q.a ? 'border-success bg-success text-white' : 'border-destructive bg-destructive text-white') : a !== undefined ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/50')}>{q.sec === 'cho' ? q.n.replace('-', '·') : q.n}</button>;
            })}</div>
          </div>)}
        </div>
      </aside>
    </div>
    <div className="h-28 lg:hidden"/>
    <Modal open={confirm} onOpenChange={setConfirm} title={t('submitExam')} description={t('submitConfirm', { answered, total: ids.length })}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirm(false)}>{t('cancel')}</Button><Button onClick={() => { setConfirm(false); doGrade(); }}>{t('confirmSubmit')}</Button></div></Modal>
    <Modal open={quitOpen} onOpenChange={setQuitOpen} title={t('pastQuit')} description={t('pastQuitConfirm')}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setQuitOpen(false)}>{t('cancel')}</Button><Button onClick={() => { quit(); router.push(`/${locale}/exams`); }}>{t('pastQuit')}</Button></div></Modal>
  </div>;
}

function Passage({ html }: { html: string }) {
  return <div lang="ja" className="pp-passage jp mt-2 rounded-xl border bg-card p-4 text-[15.5px] leading-8 sm:p-5" dangerouslySetInnerHTML={{ __html: examHtml(html) }}/>;
}

function QuestionBlock({ bank, q, pick, show, onPick }: { bank: PastBank; q: PastQuestion; pick?: number; show: boolean; onPick: (k: number) => void }) {
  const t = useTranslations('study');
  const listening = q.sec === 'cho';
  const long = q.type === 'youhou' || q.sec === 'dok' || q.o.some(o => o.replace(/<[^>]+>/g, '').length > 12);
  const L = listening ? bank.exams[q.tag].listen : undefined;
  const crops = L && [1, 2, 5].includes(q.no) ? L.crops[`${q.no}-${q.n}`] : undefined;
  return <div id={`pq-${q.id}`} className="scroll-mt-28 border-b py-4 last:border-b-0">
    <div className="flex items-start gap-3">
      <span className="min-w-[2.2rem] pt-1 text-sm font-bold text-primary" lang={listening ? 'ja' : undefined}>{listening ? q.q.replace(' · ', ' ') : q.n}</span>
      <div className="min-w-0 flex-1">
        {listening
          ? crops ? <div className="max-w-xl overflow-hidden rounded-xl border bg-white">{crops.map(([y0, y1]) => {
              const h = y1 - y0; const py = L!.qH - h > 0 ? y0 / (L!.qH - h) * 100 : 0;
              return <div key={y0} role="img" aria-label={t('pastPrinted', { q: q.q })} style={{ aspectRatio: `${L!.qW}/${h}`, backgroundImage: `url("${L!.q}")`, backgroundSize: '100% auto', backgroundPosition: `0 ${py.toFixed(4)}%`, backgroundRepeat: 'no-repeat' }}/>;
            })}</div> : <p className="text-xs text-muted-foreground">{t('pastNothingPrinted')}</p>
          : <p className="text-base leading-8 sm:text-lg"><Html html={q.q || `[${q.n}]`}/></p>}
        <div role="radiogroup" aria-label={listening ? q.q : t('pastQuestionAria', { n: q.n })} className={cn('mt-3 gap-2', listening ? 'flex flex-wrap' : long ? 'grid grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-2')}>
          {q.o.map((o, i) => {
            const k = i + 1; const sel = pick === k;
            const state = show ? (k === q.a ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : '';
            return <button key={k} role="radio" aria-checked={sel} disabled={show} onClick={() => onPick(k)}
              className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-default', listening && 'min-w-12 justify-center px-4',
                state === 'sel' && 'border-primary bg-primary/5 ring-1 ring-primary/20', state === 'right' && 'border-success bg-success/10', state === 'wrong' && 'border-destructive bg-destructive/10', !state && 'bg-card hover:border-primary/40')}>
              <span className={cn('text-sm font-bold', state === 'right' ? 'text-success' : state === 'wrong' ? 'text-destructive' : state === 'sel' ? 'text-primary' : 'text-muted-foreground')}>{k}</span>
              {!listening && <Html className="text-[15px]" html={o}/>}
            </button>;
          })}
        </div>
        {show && <p className="mt-2 text-sm"><span className={cn('mr-2 rounded-full px-2 py-0.5 text-xs font-bold', pick === q.a ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>{pick === q.a ? t('pastRight') : pick ? t('pastWrong') : t('unanswered')}</span>{t('correctAnswer')}: <b>{q.a}</b> <span className="ml-2 text-xs text-muted-foreground">{tagLabel(q.tag)} · 問題{q.no}</span></p>}
      </div>
    </div>
  </div>;
}

function ResultCard({ bank, ids, answers, onRetryWrong }: { bank: PastBank; ids: string[]; answers: Record<string, number>; onRetryWrong?: () => void }) {
  const t = useTranslations('study'); const s = scoreSession(bank, ids, answers);
  return <Card className="mb-6 p-5 sm:p-6">
    <div className="flex flex-wrap items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Trophy size={28}/></div>
      <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('examResults')}</p><p className="text-3xl font-bold tabular-nums">{s.correct}<span className="text-base font-medium text-muted-foreground"> / {s.total} · {s.percent}%</span></p></div></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2">{s.byType.map(x => <div key={x.type} className="rounded-xl border p-3"><div className="flex justify-between gap-2 text-sm"><span><span lang="ja" className="jp font-semibold">{typeMeta(x.type).jp}</span> · <span className="text-muted-foreground">{t(`pastType_${x.type}`)}</span></span><span className="tabular-nums font-semibold">{x.correct}/{x.total}</span></div><Progress className="mt-2" value={x.correct / x.total * 100}/></div>)}</div>
    <p className="mt-4 text-xs text-muted-foreground">{t('pastResultHint')}</p>
    <div className="mt-4 flex flex-wrap gap-2">{onRetryWrong && <Button onClick={onRetryWrong}><RotateCcw size={15}/>{t('pastRetryWrong')}</Button>}<Button variant="outline" asChild><StudyLink href="exams">{t('examsTitle')}</StudyLink></Button></div>
  </Card>;
}

function Timer({ session, onStart, onStop, onExpire }: { session: PastSession; onStart: () => void; onStop: () => void; onExpire: () => void }) {
  const t = useTranslations('study'); const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!session.timerEnd) return; const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, [session.timerEnd]);
  useEffect(() => { if (session.timerEnd && now >= session.timerEnd && !session.graded) onExpire(); }, [now, session.timerEnd, session.graded, onExpire]);
  if (session.graded) return null;
  if (!session.timerEnd) return session.minutes ? <Button variant="outline" size="sm" onClick={onStart}><Clock3 size={15}/>{t('pastStartTimer', { minutes: session.minutes })}</Button> : null;
  const left = Math.max(0, Math.ceil((session.timerEnd - now) / 1000));
  return <div className={cn('flex items-center gap-3 rounded-xl border px-3 py-2', left < 300 ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'bg-background')}>
    <Clock3 size={18}/><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-wide">{t('timeRemaining')}</p><p role="timer" className="font-mono text-xl font-bold tabular-nums">{left >= 3600 ? `${Math.floor(left / 3600)}:` : ''}{formatTime(left % 3600)}</p></div>
    <Button variant="ghost" size="sm" onClick={onStop}>{t('pastStopTimer')}</Button>
  </div>;
}

// ---------------------------------------------------------------- listening player: chunks joined into one timeline
function Player({ tag, level, listen }: { tag: string; level: string; listen: NonNullable<RawExam['listen']> }) {
  const t = useTranslations('study');
  const audio = useRef<HTMLAudioElement | null>(null); const idx = useRef(0); const want = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false); const [time, setTime] = useState(0); const [rate, setRate] = useState(1); const [drag, setDrag] = useState<number | null>(null);
  const total = listen.dur ?? listen.chunks.reduce((s, c) => s + c.d, 0);
  const key = `nhaikanji-jlpt-pos-${level}-${tag}`;
  const offset = useCallback((i: number) => listen.chunks.slice(0, i).reduce((s, c) => s + c.d, 0), [listen.chunks]);
  const load = useCallback((i: number, at: number, play: boolean) => {
    const a = audio.current; if (!a) return;
    idx.current = i; const src = listen.chunks[i].u;
    if (a.getAttribute('src') !== src) { a.src = src; want.current = at; } else a.currentTime = at;
    a.playbackRate = rate; if (play) a.play().catch(() => setPlaying(false));
  }, [listen.chunks, rate]);
  const seek = useCallback((g: number) => { const c = chunkAt(listen.chunks, Math.max(0, Math.min(g, total - 0.5))); load(c.index, c.offset, !!audio.current && !audio.current.paused); setTime(g); }, [listen.chunks, total, load]);
  useEffect(() => {
    const a = new Audio(); a.preload = 'metadata'; audio.current = a;
    let saved = 0; try { saved = Number(localStorage.getItem(key)) || 0; } catch { /* storage unavailable */ }
    const c = chunkAt(listen.chunks, saved); idx.current = c.index; a.src = listen.chunks[c.index].u; want.current = c.offset; setTime(saved);
    let lastSave = 0;
    const onMeta = () => { if (want.current !== null) { a.currentTime = want.current; want.current = null; } };
    const onTime = () => { const g = offset(idx.current) + a.currentTime; setTime(g); if (Date.now() - lastSave > 3000) { lastSave = Date.now(); try { localStorage.setItem(key, String(Math.floor(g))); } catch { /* ignore */ } } };
    const onEnd = () => { if (idx.current < listen.chunks.length - 1) { idx.current++; a.src = listen.chunks[idx.current].u; a.play().catch(() => setPlaying(false)); } else setPlaying(false); };
    const onPlay = () => setPlaying(true); const onPause = () => setPlaying(false);
    a.addEventListener('loadedmetadata', onMeta); a.addEventListener('timeupdate', onTime); a.addEventListener('ended', onEnd); a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    return () => { a.pause(); a.removeAttribute('src'); a.load(); ['loadedmetadata', 'timeupdate', 'ended', 'play', 'pause'].forEach((ev, i) => a.removeEventListener(ev, [onMeta, onTime, onEnd, onPlay, onPause][i] as EventListener)); };
  }, [key, listen.chunks, offset]);
  useEffect(() => { if (audio.current) audio.current.playbackRate = rate; }, [rate]);
  const shownTime = drag ?? time;
  return <div className="sticky top-16 z-30 -mx-1 bg-background/95 px-1 py-2 backdrop-blur">
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
      <Button size="icon" className="h-11 w-11 rounded-full" aria-label={playing ? t('pastPause') : t('pastPlay')} onClick={() => { const a = audio.current; if (!a) return; if (a.paused) a.play().catch(() => setPlaying(false)); else a.pause(); }}>{playing ? <Pause size={18}/> : <Play size={18}/>}</Button>
      <div className="min-w-[180px] flex-1">
        <div className="flex justify-between text-xs"><span lang="ja" className="jp font-bold text-primary">聴解 {tagLabel(tag)}</span><span className="tabular-nums text-muted-foreground">{formatTime(shownTime)} / {formatTime(total)}</span></div>
        <input type="range" min={0} max={Math.round(total)} step={1} value={Math.round(shownTime)} aria-label={t('pastSeek')} className="w-full accent-[rgb(var(--primary))]"
          onChange={e => setDrag(Number(e.target.value))} onPointerUp={() => { if (drag !== null) { seek(drag); setDrag(null); } }} onKeyUp={() => { if (drag !== null) { seek(drag); setDrag(null); } }}/>
      </div>
      <div className="flex items-center gap-1">
        {[-10, -5, 5].map(d => <Button key={d} variant="outline" size="sm" onClick={() => seek(time + d)}>{d > 0 ? `+${d}` : `−${-d}`}s</Button>)}
        <select aria-label={t('pastSpeed')} value={rate} onChange={e => setRate(Number(e.target.value))} className="min-h-9 rounded-lg border bg-background px-2 text-sm">{[0.8, 0.9, 1, 1.1, 1.25].map(r => <option key={r} value={r}>{r}×</option>)}</select>
      </div>
    </div>
  </div>;
}

// ---------------------------------------------------------------- custom practice
export function PastCustomPage() {
  const t = useTranslations('study'); const router = useRouter(); const locale = useLocale();
  const levels = useLevels(); const [level, setLevel] = useState<string>();
  useEffect(() => { if (levels?.length && !level) setLevel(levels.includes('N2') ? 'N2' : levels[0]); }, [levels, level]);
  const state = usePastBank(levels === null ? undefined : level ?? 'N2');
  const filter = usePastStore(s => s.filter); const setFilter = usePastStore(s => s.setFilter); const progress = usePastStore(s => s.progress); const start = usePastStore(s => s.start);
  const [kw, setKw] = useState(filter.kw);
  useEffect(() => { const h = setTimeout(() => { if (kw !== filter.kw) setFilter({ kw }); }, 250); return () => clearTimeout(h); }, [kw, filter.kw, setFilter]);
  const pool = useMemo(() => state.status === 'ready' ? filterPool(state.bank, filter, progress) : [], [state, filter, progress]);
  if (state.status !== 'ready') return <div><BackLink href="exams" label={t('examsTitle')}/>{state.status === 'loading' ? <StudySkeleton/> : <Card className="p-6"><EmptyState title={t('pastMissingTitle')} description={t('pastMissingHint')}/></Card>}</div>;
  const bank = state.bank;
  const counts = new Map<PastType, number>();
  const from = filter.from || bank.tags[0]; const to = filter.to || bank.tags[bank.tags.length - 1];
  bank.list.forEach(q => { if (q.tag >= from && q.tag <= to) counts.set(q.type, (counts.get(q.type) ?? 0) + 1); });
  const toggle = (type: PastType) => setFilter({ types: filter.types.includes(type) ? filter.types.filter(x => x !== type) : [...filter.types, type] });
  const seg = <V extends string | number>(items: [V, string][], value: V, on: (v: V) => void) => <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">{items.map(([v, l]) => <button key={String(v)} aria-pressed={v === value} onClick={() => on(v)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', v === value ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{l}</button>)}</div>;
  function begin() {
    const ids = buildSessionIds(bank, pool, filter.n, filter.order);
    const name = filter.types.length <= 3 ? filter.types.map(x => typeMeta(x).jp).join('・') : t('pastTypesCount', { count: filter.types.length });
    start({ level: bank.level, title: `${t('pastCustom')} · ${name}`, sub: `${filter.kw ? `“${filter.kw}” · ` : ''}${tagLabel(from)}–${tagLabel(to)}`, mode: filter.mode, ids });
    router.push(`/${locale}/exams/past-session`);
  }
  return <div className="mx-auto max-w-4xl">
    <BackLink href="exams" label={t('examsTitle')}/>
    <PageTitle title={t('pastCustom')} subtitle={t('pastCustomSubtitle')} icon={<SlidersHorizontal size={26}/>}/>
    <Card className="space-y-6 p-5 sm:p-6">
      {(levels?.length ?? 0) > 1 && <div className="flex gap-2">{levels!.map(l => <button key={l} onClick={() => setLevel(l)} aria-pressed={l === bank.level}><JlptBadge level={l} className={cn('px-3 py-1 text-xs', l !== bank.level && 'opacity-50')}/></button>)}</div>}
      <div>
        <p className="text-sm font-semibold">{t('pastQuestionTypes')}</p>
        {PAST_SECTIONS.map(sec => {
          const types = PAST_TYPES.filter(x => x.sec === sec && (counts.get(x.type) ?? 0) > 0); if (!types.length) return null;
          const all = types.every(x => filter.types.includes(x.type));
          return <div key={sec} className="mt-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span lang="ja" className="jp">{PAST_SECTION_JP[sec]}</span><button className="text-primary hover:underline" onClick={() => setFilter({ types: all ? filter.types.filter(x => !types.some(y => y.type === x)) : [...new Set([...filter.types, ...types.map(x => x.type)])] })}>{all ? t('pastClearGroup') : t('pastSelectGroup')}</button></div>
            <div className="flex flex-wrap gap-2">{types.map(x => <label key={x.type} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm', filter.types.includes(x.type) ? 'border-primary bg-primary/10' : 'bg-card')}>
              <input type="checkbox" className="accent-[rgb(var(--primary))]" checked={filter.types.includes(x.type)} onChange={() => toggle(x.type)}/>
              <span lang="ja" className="jp font-medium">{x.jp}</span><span className="text-muted-foreground">{t(`pastType_${x.type}`)}</span><span className="text-xs tabular-nums text-muted-foreground">{counts.get(x.type)}</span>
            </label>)}</div>
            {sec === 'cho' && <p className="mt-2 text-xs text-muted-foreground">{t('pastListeningNote')}</p>}
          </div>;
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">{t('pastFrom')}<select className={cn(inputClass, 'mt-1.5')} value={from} onChange={e => setFilter({ from: e.target.value, ...(e.target.value > to ? { to: e.target.value } : {}) })}>{bank.tags.map(tg => <option key={tg} value={tg}>{tagLabel(tg)}</option>)}</select></label>
        <label className="text-sm font-semibold">{t('pastTo')}<select className={cn(inputClass, 'mt-1.5')} value={to} onChange={e => setFilter({ to: e.target.value, ...(e.target.value < from ? { from: e.target.value } : {}) })}>{bank.tags.map(tg => <option key={tg} value={tg}>{tagLabel(tg)}</option>)}</select></label>
      </div>
      <label className="block text-sm font-semibold">{t('pastKeyword')}<input type="search" className={cn(inputClass, 'mt-1.5')} value={kw} onChange={e => setKw(e.target.value)} placeholder={t('pastKeywordPlaceholder')}/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className="mb-1.5 text-sm font-semibold">{t('pastFilterStatus')}</p>{seg<StatusFilter>([['all', t('pastStatusAll')], ['new', t('pastStatusNew')], ['wrong', t('pastStatusWrong')], ['everwrong', t('pastStatusEverWrong')]], filter.status, v => setFilter({ status: v }))}</div>
        <div><p className="mb-1.5 text-sm font-semibold">{t('pastCount')}</p>{seg<string>([5, 10, 20, 30, 50, 'all'].map(v => [String(v), v === 'all' ? t('pastStatusAll') : String(v)]), String(filter.n), v => setFilter({ n: v === 'all' ? 'all' : Number(v) }))}</div>
        <div><p className="mb-1.5 text-sm font-semibold">{t('pastOrder')}</p>{seg<'random' | 'year'>([['random', t('pastOrderRandom')], ['year', t('pastOrderYear')]], filter.order, v => setFilter({ order: v }))}</div>
        <div><p className="mb-1.5 text-sm font-semibold">{t('pastGrading')}</p>{seg<'instant' | 'exam'>([['instant', t('pastInstant')], ['exam', t('pastExamMode')]], filter.mode, v => setFilter({ mode: v }))}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-5"><Button disabled={!pool.length} onClick={begin}><Play size={16}/>{t('pastStart')}</Button><span className="text-sm text-muted-foreground">{t('pastMatches', { count: pool.length })}</span></div>
    </Card>
  </div>;
}

// ---------------------------------------------------------------- wrong answers & statistics
export function PastReviewPage() {
  const t = useTranslations('study'); const router = useRouter(); const locale = useLocale();
  const state = usePastBank('N2'); const progress = usePastStore(s => s.progress); const start = usePastStore(s => s.start);
  if (state.status !== 'ready') return <div><BackLink href="exams" label={t('examsTitle')}/>{state.status === 'loading' ? <StudySkeleton/> : <Card className="p-6"><EmptyState title={t('pastMissingTitle')} description={t('pastMissingHint')}/></Card>}</div>;
  const bank = state.bank;
  const wrongIds = Object.keys(progress).filter(id => bank.byId[id] && !progress[id][0]);
  function drill(ids: string[], title: string) {
    const units = new Set(ids.map(id => bank.byId[id].unit));
    start({ level: bank.level, title, sub: t('pastReview'), mode: 'instant', ids: bank.list.filter(q => units.has(q.unit)).map(q => q.id) });
    router.push(`/${locale}/exams/past-session`);
  }
  const recent = [...wrongIds].sort((a, b) => progress[b][3] - progress[a][3]).slice(0, 30);
  return <div className="mx-auto max-w-4xl space-y-6">
    <BackLink href="exams" label={t('examsTitle')}/>
    <PageTitle title={t('pastReview')} subtitle={t('pastReviewSubtitle')} icon={<BookOpenCheck size={26}/>} actions={<Button disabled={!wrongIds.length} onClick={() => drill(wrongIds, t('pastRetryWrongTitle'))}><RotateCcw size={15}/>{t('pastDrillAll', { count: wrongIds.length })}</Button>}/>
    <Card className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3">{t('pastQuestionTypes')}</th><th className="p-3 text-right">{t('pastDone')}</th><th className="p-3 text-right">{t('pastAccuracy')}</th><th className="p-3 text-right">{t('pastWrongNow')}</th><th className="p-3"/></tr></thead>
      <tbody>{PAST_TYPES.map(x => {
        const qs = bank.list.filter(q => q.type === x.type); if (!qs.length) return null;
        const done = qs.filter(q => progress[q.id]); const right = done.filter(q => progress[q.id][0]).length; const w = wrongIds.filter(id => bank.byId[id].type === x.type);
        return <tr key={x.type} className="border-b last:border-b-0"><td className="p-3"><span lang="ja" className="jp font-semibold">{x.jp}</span><span className="block text-xs text-muted-foreground">{t(`pastType_${x.type}`)}</span></td>
          <td className="p-3 text-right tabular-nums">{done.length}/{qs.length}</td><td className="p-3 text-right tabular-nums">{done.length ? `${Math.round(right / done.length * 100)}%` : '—'}</td><td className="p-3 text-right tabular-nums">{w.length || '—'}</td>
          <td className="p-3 text-right"><Button variant="outline" size="sm" disabled={!w.length} onClick={() => drill(w, `${t('pastRetryWrongTitle')} · ${x.jp}`)}>{t('pastDrill')}<ChevronRight size={14}/></Button></td></tr>;
      })}</tbody></table></Card>
    <div><h2 className={sectionClass}>{t('pastRecentWrong')}</h2>
      {recent.length ? <Card className="mt-3 divide-y p-0">{recent.map(id => { const q = bank.byId[id]; return <div key={id} className="flex flex-wrap items-baseline gap-3 p-3 text-sm"><span className="w-24 shrink-0 text-xs text-muted-foreground">{tagLabel(q.tag)} · {q.sec === 'cho' ? `聴解${q.no}` : q.n}</span><span className="min-w-0 flex-1">{q.sec === 'cho' ? <span lang="ja" className="jp">聴解 問題{q.no} · {q.q}</span> : q.q ? <Html html={q.q}/> : <span className="text-muted-foreground">{t('pastClozeBlank')}</span>}</span><Badge lang="ja" className="jp">{typeMeta(q.type).jp}</Badge></div>; })}</Card>
        : <Card className="mt-3 p-6"><EmptyState title={t('pastNoWrong')} description={t('pastNoWrongHint')}/></Card>}
    </div>
  </div>;
}

