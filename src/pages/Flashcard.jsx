import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LEVELS, useKanji } from '../lib/data.js'
import { useStored } from '../lib/storage.js'
import { getAll, review, stats } from '../lib/srs.js'
import { speak } from '../lib/speech.js'

const GRADES = [
  ['Quên', 'bg-red-50 text-red-700 hover:bg-red-100'],
  ['Khó', 'bg-amber-50 text-amber-700 hover:bg-amber-100'],
  ['Nhớ', 'bg-leaf-50 text-leaf-700 hover:bg-leaf-100'],
  ['Dễ', 'bg-brand-50 text-brand-700 hover:bg-brand-100'],
]

export default function Flashcard() {
  const data = useKanji()
  const [params, setParams] = useSearchParams()
  const [starred] = useStored('starred', [])
  const deck = params.get('level') || 'starred-or-5'
  const level = deck === 'starred' ? 'starred' : Number(deck) || (starred.length ? 'starred' : 5)
  const [flipped, setFlipped] = useState(false)
  const [tick, setTick] = useState(0)

  const items = useMemo(() => {
    if (!data) return []
    return level === 'starred' ? starred.map((c) => data.byChar.get(c)).filter(Boolean) : data.list.filter((x) => x.n === level)
  }, [data, level, starred])

  // Thẻ đến hạn trước, sau đó tối đa 20 thẻ mới mỗi phiên
  const queue = useMemo(() => {
    const all = getAll()
    const now = Date.now()
    const due = items.filter((x) => all[x.k] && all[x.k].due <= now)
    const fresh = items.filter((x) => !all[x.k]).slice(0, 20)
    return [...due, ...fresh]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tick])

  const card = queue[0]
  const s = stats(items.map((x) => x.k))
  const grade = (g) => {
    review(card.k, g)
    setFlipped(false)
    setTick((t) => t + 1)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card p-5">
        <h1 className="text-xl font-bold">Flashcard – Lặp lại ngắt quãng</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button key={l.n} onClick={() => setParams({ level: l.n })} className={`chip ${level === l.n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200'}`}>{l.label}</button>
          ))}
          <button onClick={() => setParams({ level: 'starred' })} className={`chip ${level === 'starred' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200'}`}>★ Đã lưu ({starred.length})</button>
        </div>
        <p className="mt-3 text-sm text-slate-500">Mới {s.fresh} · Cần ôn {s.due} · Đã nhớ {s.learned}</p>
      </div>

      {!data ? null : !card ? (
        <div className="card p-10 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-2 font-semibold">Đã ôn xong phiên này!</p>
          <p className="text-sm text-slate-500">Quay lại sau để ôn các thẻ đến hạn.</p>
        </div>
      ) : (
        <div className="card p-6">
          <p className="text-right text-xs text-slate-400">Còn {queue.length} thẻ</p>
          <button onClick={() => setFlipped(true)} className="flex w-full flex-col items-center py-6">
            <span className="font-brush text-[120px] leading-none">{card.k}</span>
            {!flipped && <span className="mt-6 text-sm text-slate-400">Bấm để lật thẻ</span>}
          </button>
          {flipped && (
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600">{card.hv.join(' · ')}</p>
              <p className="mt-1 text-slate-600">{card.m.join(', ')}</p>
              <p className="mt-2 font-jp text-slate-700">
                {card.on.join('、')} {card.kun.length > 0 && <>｜ {card.kun.join('、')}</>}
                <button className="ml-2" onClick={() => speak(card.on[0] || card.kun[0] || card.k)}>🔊</button>
              </p>
              <Link to={`/kanji/${card.k}`} className="mt-1 inline-block text-sm text-brand-600 hover:underline">Xem chi tiết</Link>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {GRADES.map(([label, cls], g) => (
                  <button key={label} onClick={() => grade(g)} className={`btn ${cls}`}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
