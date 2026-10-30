import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LEVELS, useKanji } from '../lib/data.js'
import StrokeOrder from '../components/StrokeOrder.jsx'
import WritingPad from '../components/WritingPad.jsx'

export default function Practice() {
  const data = useKanji()
  const [params, setParams] = useSearchParams()
  const level = Number(params.get('level')) || 5
  const [i, setI] = useState(0)
  const items = useMemo(() => data?.list.filter((x) => x.n === level) ?? [], [data, level])
  const k = items[i]

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="card p-5">
        <h1 className="text-xl font-bold">Luyện viết Kanji</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button key={l.n} onClick={() => { setParams({ level: l.n }); setI(0) }} className={`chip ${level === l.n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200'}`}>{l.label}</button>
          ))}
        </div>
      </div>
      {k && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>←</button>
            <p className="text-center">
              <span className="text-2xl font-bold text-brand-600">{k.hv[0]}</span>
              <span className="ml-2 text-slate-500">{k.m[0]} · {i + 1}/{items.length}</span>
            </p>
            <button className="btn-ghost" disabled={i === items.length - 1} onClick={() => setI(i + 1)}>→</button>
          </div>
          <div className="flex flex-wrap items-start justify-center gap-8">
            <StrokeOrder char={k.k} size={260} />
            <WritingPad char={k.k} size={260} />
          </div>
        </div>
      )}
    </div>
  )
}
