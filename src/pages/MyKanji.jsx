import { Link } from 'react-router-dom'
import { useKanji } from '../lib/data.js'
import { useStored } from '../lib/storage.js'

export default function MyKanji() {
  const data = useKanji()
  const [starred] = useStored('starred', [])
  const items = data ? starred.map((c) => data.byChar.get(c)).filter(Boolean) : []
  return (
    <div className="card mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-bold">Kanji đã lưu</h1>
      {items.length === 0 ? (
        <p className="mt-3 text-slate-500">Chưa có chữ nào. Mở một Kanji và bấm “☆ Lưu”.</p>
      ) : (
        <>
          <Link to="/flashcard?level=starred" className="btn-primary mt-4 text-sm">Ôn bằng Flashcard</Link>
          <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {items.map((x) => (
              <Link key={x.k} to={`/kanji/${x.k}`} className="flex aspect-square flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 hover:border-amber-500">
                <span className="font-brush text-3xl">{x.k}</span>
                <span className="text-[11px] font-semibold text-amber-700">{x.hv[0]}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
