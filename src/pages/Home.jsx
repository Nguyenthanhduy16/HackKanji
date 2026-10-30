import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LEVELS, searchKanji, useKanji } from '../lib/data.js'
import { useStored } from '../lib/storage.js'
import { stats } from '../lib/srs.js'

function KanjiTile({ item }) {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  return (
    <button
      onClick={() => (open ? nav(`/kanji/${item.k}`) : setOpen(true))}
      className={`group flex aspect-square flex-col items-center justify-center rounded-xl border transition ${
        open ? 'border-leaf-600 bg-leaf-100' : 'border-leaf-200 bg-leaf-50 hover:border-leaf-600 hover:bg-leaf-100'
      }`}
    >
      <span className="font-brush text-3xl leading-none text-slate-800 sm:text-4xl">{item.k}</span>
      <span className={`mt-1 text-[10px] sm:text-[11px] ${open ? 'font-semibold text-leaf-700' : 'text-slate-400'}`}>
        {open ? item.hv[0] || '—' : 'bấm để xem'}
      </span>
    </button>
  )
}

function SearchCard({ list }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => (list ? searchKanji(list, q) : []), [list, q])
  return (
    <div className="card p-5">
      <h3 className="font-semibold">Tìm kiếm Kanji</h3>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nhập kanji hoặc âm Hán Việt (vd: nhat, 学)"
        className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-brand-500 focus:bg-white"
      />
      {q && (
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {results.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy kết quả.</p>}
          {results.map((x) => (
            <Link key={x.k} to={`/kanji/${x.k}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <span className="font-brush text-2xl">{x.k}</span>
              <span className="font-semibold text-brand-600">{x.hv.join(', ')}</span>
              <span className="truncate text-sm text-slate-500">{x.m.join(', ')}</span>
              <span className="ml-auto rounded bg-slate-100 px-1.5 text-xs text-slate-500">N{x.n}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const PAGE = 120

export default function Home() {
  const data = useKanji()
  const [level, setLevel] = useStored('home:level', 5)
  const [limit, setLimit] = useState(PAGE)
  const items = useMemo(() => data?.list.filter((x) => x.n === level) ?? [], [data, level])
  const s = stats(items.map((x) => x.k))

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-5">
        <div className="card bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
          <p className="text-sm opacity-80">Hôm nay</p>
          <p className="mt-1 text-2xl font-bold">Học Kanji bằng chiết tự</p>
          <p className="mt-1 text-sm opacity-90">Âm Hán Việt · Thứ tự nét · Flashcard ngắt quãng</p>
          <Link to="/flashcard" className="btn mt-4 bg-white/15 text-sm text-white hover:bg-white/25">Ôn tập ngay →</Link>
        </div>
        <SearchCard list={data?.list} />
        <div className="grid grid-cols-1 gap-3">
          {[
            ['2200+ Kanji', 'Âm Hán Việt · Thứ tự nét · N5→N1', '/'],
            ['Bảng chữ cái', 'Hiragana · Katakana · Bài nghe', '/alphabet'],
            ['Ngữ pháp N5→N1', 'Sẵn khung để nạp nội dung', '/bunpo'],
          ].map(([t, d, to]) => (
            <Link key={t} to={to} className="card flex items-center gap-3 p-4 hover:border-brand-500">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-jp text-brand-600">学</span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="text-sm text-slate-500">{d}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <section className="card p-5 md:p-6">
        <h2 className="text-xl font-bold">Khám phá Kanji theo trình độ</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.n}
              onClick={() => { setLevel(l.n); setLimit(PAGE) }}
              className={`chip ${level === l.n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500'}`}
            >
              <b>{l.label}</b> – {l.desc}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-lg font-semibold">Kanji N{level} <span className="text-sm font-normal text-slate-500">({items.length} chữ)</span></h3>
          <span className="rounded-lg bg-leaf-50 px-2 py-1 text-xs text-leaf-700">Mới {s.fresh} · Cần ôn {s.due} · Đã nhớ {s.learned}</span>
          <Link to={`/flashcard?level=${level}`} className="btn-primary py-1.5 text-sm">Flashcard</Link>
          <Link to={`/practice?level=${level}`} className="btn-ghost py-1.5 text-sm">Luyện viết</Link>
        </div>

        {!data ? (
          <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 xl:grid-cols-10">
            {Array.from({ length: 40 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 xl:grid-cols-10">
              {items.slice(0, limit).map((x) => <KanjiTile key={x.k} item={x} />)}
            </div>
            {limit < items.length && (
              <div className="mt-5 text-center">
                <button className="btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>Xem thêm ({items.length - limit})</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
