import { Link, useParams } from 'react-router-dom'
import { useKanji } from '../lib/data.js'
import { useStored } from '../lib/storage.js'
import { speak } from '../lib/speech.js'
import StrokeOrder from '../components/StrokeOrder.jsx'
import WritingPad from '../components/WritingPad.jsx'

function Row({ label, children }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="w-28 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="font-jp">{children}</span>
    </div>
  )
}

export default function KanjiDetail() {
  const { char } = useParams()
  const data = useKanji()
  const [starred, setStarred] = useStored('starred', [])
  if (!data) return <div className="card mx-auto max-w-5xl p-10 text-center text-slate-500">Đang tải…</div>
  const k = data.byChar.get(char)
  if (!k) return <div className="card mx-auto max-w-5xl p-10 text-center">Không có dữ liệu cho “{char}”. <Link className="text-brand-600" to="/">Về trang chủ</Link></div>

  const same = data.list.filter((x) => x.n === k.n)
  const idx = same.indexOf(k)
  const prev = same[idx - 1], next = same[idx + 1]
  const isStar = starred.includes(k.k)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-brand-600 hover:underline">Kanji</Link>
        <span className="text-slate-400">/</span>
        <span>N{k.n}</span>
        <div className="ml-auto flex gap-2">
          {prev && <Link className="btn-ghost py-1 text-sm" to={`/kanji/${prev.k}`}>← {prev.k}</Link>}
          {next && <Link className="btn-ghost py-1 text-sm" to={`/kanji/${next.k}`}>{next.k} →</Link>}
        </div>
      </div>

      <div className="card grid gap-6 p-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-3">
          <StrokeOrder char={k.k} size={240} />
          <p className="text-xs text-slate-400">Thứ tự nét: KanjiVG</p>
        </div>
        <div>
          <div className="flex items-start gap-3">
            <div>
              <p className="text-3xl font-bold text-brand-600">{k.hv.join(' · ') || '—'}</p>
              <p className="mt-1 text-slate-600">{k.m.join(', ')}</p>
            </div>
            <button
              onClick={() => setStarred(isStar ? starred.filter((x) => x !== k.k) : [...starred, k.k])}
              className={`ml-auto btn text-sm ${isStar ? 'bg-amber-100 text-amber-700' : 'btn-ghost'}`}
            >
              {isStar ? '★ Đã lưu' : '☆ Lưu'}
            </button>
          </div>
          <div className="mt-4">
            <Row label="Âm On">
              {k.on.map((r) => <button key={r} onClick={() => speak(r)} className="mr-2 rounded bg-slate-100 px-2 hover:bg-brand-50">{r} 🔊</button>)}
            </Row>
            <Row label="Âm Kun">
              {k.kun.map((r) => <button key={r} onClick={() => speak(r.replace(/[.-]/g, ''))} className="mb-1 mr-2 rounded bg-slate-100 px-2 hover:bg-brand-50">{r} 🔊</button>)}
            </Row>
            <Row label="Số nét">{k.s}</Row>
            <Row label="Bộ thủ">{k.r ? `Bộ số ${k.r}` : '—'}</Row>
            <Row label="JLPT">N{k.n}</Row>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            <b>Chiết tự:</b> chưa có nội dung. Khu vực này dành cho phần giải thích chiết tự khi bạn nạp dữ liệu riêng.
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold">Luyện viết</h3>
        <div className="flex flex-wrap justify-center gap-6">
          <WritingPad char={k.k} />
        </div>
      </div>
    </div>
  )
}
