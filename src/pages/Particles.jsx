import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStored } from '../lib/storage.js'

// Dữ liệu: public/data/particles.json — { groups: [...], quiz: [...] }
// Trong câu ví dụ: 漢字{よみ} = furigana, 【x】 = trợ từ được tô màu, ＿ = chỗ trống trong câu hỏi.
let cache = null
function useParticles() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (!cache)
      fetch('/data/particles.json')
        .then((r) => r.json())
        .then((d) => setData((cache = d)))
  }, [])
  return data
}

const TOKEN = /(【[^】]+】)|([㐀-鿿々〆ヶ]+)\{([^}]+)\}|(＿)/g

function JpText({ text, blank, furigana }) {
  const out = []
  let last = 0
  const re = new RegExp(TOKEN, 'g')
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<JpMark key={m.index} text={m[1].slice(1, -1)} furigana={furigana} />)
    else if (m[2]) out.push(<Ruby key={m.index} base={m[2]} yomi={m[3]} furigana={furigana} />)
    else out.push(<span key={m.index}>{blank}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

function Ruby({ base, yomi, furigana }) {
  return (
    <ruby>
      {base}
      {furigana && <rt className="text-[0.5em] font-normal text-slate-400">{yomi}</rt>}
    </ruby>
  )
}

function JpMark({ text, furigana }) {
  return (
    <mark className="rounded bg-amber-100 px-1 font-bold text-amber-900">
      <JpText text={text} furigana={furigana} />
    </mark>
  )
}

function shuffle(a) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function GroupView({ groups, index, onSelect, furigana }) {
  const g = groups[index]
  const prev = groups[index - 1]
  const next = groups[index + 1]
  return (
    <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:h-fit lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {groups.map((x, i) => (
          <button
            key={x.id}
            onClick={() => onSelect(i)}
            className={`flex shrink-0 flex-col rounded-xl border px-3 py-2 text-left transition lg:flex-row lg:items-baseline lg:gap-3 lg:border-transparent ${
              i === index ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50 lg:bg-transparent'
            }`}
          >
            <span className="text-xs text-slate-500 lg:w-10">Bài {x.id}</span>
            <span className={`max-w-[14rem] truncate font-jp lg:whitespace-normal ${i === index ? 'font-bold' : ''}`}>{x.title}</span>
          </button>
        ))}
      </nav>

      <article className="card min-w-0 p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bài {g.id} / {groups.length}</p>
        <h2 className="mt-1 break-words font-jp text-3xl font-bold tracking-wide text-brand-700 md:text-4xl">{g.title}</h2>
        <p className="mt-2 max-w-2xl text-slate-500">{g.summary}</p>
        {g.tip && (
          <div className="mt-4 max-w-3xl rounded-xl bg-brand-50 px-4 py-3 text-sm">
            <b className="block text-xs uppercase tracking-widest text-brand-600">Mẹo phân biệt</b>
            {g.tip}
          </div>
        )}

        {g.particles.map((p) => (
          <section key={p.p} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-[90px_1fr]">
            <div className="flex items-baseline gap-3 md:block">
              <div className="font-jp text-4xl font-bold text-brand-600">{p.p}</div>
              <div className="text-sm text-slate-500 md:mt-2">{p.gist}</div>
            </div>
            <ol className="min-w-0 space-y-4">
              {p.uses.map((u, k) => (
                <li key={k} className="grid grid-cols-[28px_1fr] gap-x-3">
                  <span className="row-span-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-500 text-xs font-bold text-brand-600">{k + 1}</span>
                  <p className="font-semibold">{u.meaning}</p>
                  <p lang="ja" className="break-words font-jp text-xl leading-[2.1]">
                    <JpText text={u.jp} furigana={furigana} />
                  </p>
                  <p className="text-sm text-slate-500">{u.vi}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <div className="mt-8 flex justify-between gap-3 border-t border-slate-100 pt-5">
          {prev ? (
            <button onClick={() => onSelect(index - 1)} className="btn-ghost flex-col items-start gap-0 text-left">
              <span className="text-xs text-slate-500">← Bài {prev.id}</span>
              <span className="font-jp font-bold">{prev.title}</span>
            </button>
          ) : <span />}
          {next && (
            <button onClick={() => onSelect(index + 1)} className="btn-ghost flex-col items-end gap-0 text-right">
              <span className="text-xs text-slate-500">Bài {next.id} →</span>
              <span className="max-w-[12rem] truncate font-jp font-bold">{next.title}</span>
            </button>
          )}
        </div>
      </article>
    </div>
  )
}

const PER_ROUND = 10

function Quiz({ quiz, furigana }) {
  const newRound = useCallback(() => shuffle(quiz).slice(0, PER_ROUND).map((q) => ({ ...q, options: shuffle(q.options) })), [quiz])
  const [qs, setQs] = useState(newRound)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const q = qs[i]

  const restart = () => { setQs(newRound()); setI(0); setPick(null); setChecked(false); setScore(0) }
  const check = useCallback(() => {
    if (pick === null || checked) return
    setChecked(true)
    if (q.options[pick] === q.answer) setScore((s) => s + 1)
  }, [pick, checked, q])
  const next = useCallback(() => { setI((x) => x + 1); setPick(null); setChecked(false) }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (!q || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea')) return
      if (/^[1-9]$/.test(e.key) && !checked) {
        const k = +e.key - 1
        if (k < q.options.length) setPick(k)
      } else if (e.key === 'Backspace' && !checked) {
        e.preventDefault(); setPick(null)
      } else if (e.key === 'Enter') {
        e.preventDefault(); checked ? next() : check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q, checked, check, next])

  if (!q)
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center">
        <p className="text-5xl font-bold text-brand-600">{score}/{qs.length}</p>
        <p className="mt-3 text-slate-500">
          {score === qs.length ? 'Đúng hết. Rất chắc tay!' : score >= qs.length * 0.7 ? 'Tốt lắm. Xem lại các câu sai ở phần Học nhé.' : 'Ôn lại các nhóm trợ từ rồi thử lượt mới.'}
        </p>
        <button className="btn-primary mt-5" onClick={restart}>Làm lượt mới</button>
      </div>
    )

  const right = checked && q.options[pick] === q.answer
  const blankText = checked ? q.answer : pick !== null ? q.options[pick] : ' '
  const blankColor = checked ? (right ? 'border-leaf-600 text-leaf-700' : 'border-red-500 text-red-600') : 'border-brand-500 text-brand-600'

  return (
    <div className="card mx-auto max-w-2xl p-5 md:p-8">
      <div className="flex justify-between text-sm text-slate-500">
        <span>Câu {i + 1} / {qs.length}</span>
        <span>Đúng: {score}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(i / qs.length) * 100}%` }} />
      </div>

      <p lang="ja" className="mt-7 break-words font-jp text-2xl leading-[2.2] md:text-3xl">
        <JpText
          text={q.q}
          furigana={furigana}
          blank={<span className={`mx-1 inline-block min-w-[3em] border-b-[3px] text-center font-bold leading-tight ${blankColor}`}>{blankText}</span>}
        />
      </p>
      <p className="mb-4 mt-1 text-sm text-slate-500">Chọn trợ từ cho chỗ trống</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {q.options.map((o, k) => {
          let cls = 'border-slate-200 bg-slate-50 hover:border-brand-500'
          if (checked) cls = o === q.answer ? 'border-leaf-600 bg-leaf-100' : k === pick ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 opacity-60'
          else if (k === pick) cls = 'border-brand-600 bg-brand-50'
          return (
            <button key={o} disabled={checked} onClick={() => setPick(k)} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition ${cls}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-500">{k + 1}</span>
              <span lang="ja" className="font-jp text-xl font-bold">{o}</span>
            </button>
          )
        })}
      </div>

      {checked && (
        <div className={`mt-5 rounded-xl px-4 py-3 ${right ? 'bg-leaf-50' : 'bg-red-50'}`}>
          <b className={right ? 'text-leaf-700' : 'text-red-600'}>{right ? 'Chính xác' : `Chưa đúng. Đáp án: ${q.answer}`}</b>
          <p className="text-sm text-slate-600">{q.explain}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        {checked ? (
          <button className="btn-primary" onClick={next}>{i === qs.length - 1 ? 'Xem kết quả' : 'Câu tiếp'}</button>
        ) : (
          <>
            <button className="btn-ghost" onClick={next}>Bỏ qua</button>
            <button className="btn-primary disabled:opacity-40" disabled={pick === null} onClick={check}>Kiểm tra</button>
          </>
        )}
      </div>
      <p className="mt-4 hidden text-center text-xs text-slate-400 sm:block">
        Phím 1–{q.options.length} chọn · Backspace bỏ chọn · Enter kiểm tra / sang câu
      </p>
    </div>
  )
}

export default function Particles() {
  const data = useParticles()
  const [mode, setMode] = useStored('particles:mode', 'learn')
  const [index, setIndex] = useStored('particles:group', 0)
  const [furigana, setFurigana] = useStored('particles:furigana', true)
  const groups = data?.groups ?? []
  const safeIndex = useMemo(() => Math.min(Math.max(0, index), Math.max(0, groups.length - 1)), [index, groups.length])

  const select = (i) => { setIndex(i); window.scrollTo({ top: 0 }) }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="card flex flex-wrap items-end justify-between gap-4 p-6">
        <div className="flex items-end gap-4">
          <span className="font-jp text-5xl font-bold leading-none text-brand-600">助詞</span>
          <div>
            <Link to="/bunpo" className="text-sm text-slate-500 hover:text-brand-600">← Ngữ pháp</Link>
            <h1 className="text-2xl font-bold">Trợ từ tiếng Nhật</h1>
            <p className="text-sm text-slate-500">15 nhóm trợ từ, từ は・が đến trợ từ cuối câu</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[['learn', 'Học theo nhóm'], ['quiz', 'Luyện tập']].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} className={`chip ${mode === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500'}`}>
              {l}
            </button>
          ))}
          <button
            onClick={() => setFurigana(!furigana)}
            aria-pressed={furigana}
            className={`chip flex items-center gap-2 ${furigana ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
          >
            <span className="font-jp font-bold">漢</span> Furigana {furigana ? 'bật' : 'tắt'}
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card p-10 text-center text-slate-400">Đang tải…</div>
      ) : mode === 'quiz' ? (
        <Quiz quiz={data.quiz} furigana={furigana} />
      ) : (
        <GroupView groups={groups} index={safeIndex} onSelect={select} furigana={furigana} />
      )}
    </div>
  )
}
