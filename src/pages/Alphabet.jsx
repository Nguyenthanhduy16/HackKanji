import { useMemo, useState } from 'react'
import { ALL_SOUNDS, DAKUON, SEION, YOON, toKatakana } from '../lib/kana.js'
import { useStored } from '../lib/storage.js'
import { speak } from '../lib/speech.js'
import StrokeOrder from '../components/StrokeOrder.jsx'

function Grid({ title, rows, cols, script, onPick }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold tracking-wide text-slate-500">{title}</h3>
      <div className={`grid gap-2 ${cols === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'}`}>
        {rows.map((x, i) =>
          x ? (
            <button
              key={i}
              onClick={() => onPick(x)}
              className="flex flex-col items-center rounded-xl border border-slate-200 bg-white py-2 hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="font-jp text-2xl">{script === 'kata' ? toKatakana(x[0]) : x[0]}</span>
              <span className="text-xs text-slate-500">{x[1]}</span>
            </button>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
    </div>
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

function ListeningQuiz({ script }) {
  const [state, setState] = useStored(`quiz:${script}`, null)
  const [picked, setPicked] = useState(null)
  const conv = (s) => (script === 'kata' ? toKatakana(s) : s)

  const start = () => {
    setPicked(null)
    setState({ order: shuffle(ALL_SOUNDS.map((x) => x[0])), i: 0, correct: 0 })
  }
  const current = state && state.order[state.i]
  const options = useMemo(() => {
    if (!current) return []
    const others = shuffle(ALL_SOUNDS.map((x) => x[0]).filter((x) => x !== current)).slice(0, 3)
    return shuffle([current, ...others])
  }, [current])

  if (!state || state.i >= state.order.length)
    return (
      <div className="text-center">
        {state && <p className="mb-3 text-lg">Hoàn thành! Đúng <b>{state.correct}</b>/{state.order.length}</p>}
        <button className="btn-primary" onClick={start}>{state ? 'Làm lại' : 'Bắt đầu'}</button>
      </div>
    )

  const answer = (o) => {
    if (picked) return
    setPicked(o)
    setTimeout(() => {
      setPicked(null)
      setState((s) => ({ ...s, i: s.i + 1, correct: s.correct + (o === current ? 1 : 0) }))
    }, 700)
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-sm text-slate-500">Câu {state.i + 1}/{state.order.length} · Đúng {state.correct}</p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(state.i / state.order.length) * 100}%` }} />
      </div>
      <button className="btn-primary mt-5 text-lg" onClick={() => speak(current)}>🔊 Nghe</button>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className={`rounded-xl border py-4 font-jp text-3xl transition ${
              picked && o === current ? 'border-leaf-600 bg-leaf-100' : picked === o ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-brand-500'
            }`}
          >
            {conv(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Alphabet() {
  const [script, setScript] = useStored('alpha:script', 'hira')
  const [sel, setSel] = useState(null)
  const pick = (x) => {
    setSel(x)
    speak(x[0])
  }
  const char = sel && (script === 'kata' ? toKatakana(sel[0]) : sel[0])

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Bảng chữ cái tiếng Nhật</h1>
        <div className="mt-4 flex gap-2">
          {[['hira', 'あ', 'Hiragana'], ['kata', 'ア', 'Katakana']].map(([v, c, l]) => (
            <button key={v} onClick={() => setScript(v)} className={`chip flex items-center gap-2 ${script === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200'}`}>
              <span className="font-jp">{c}</span>{l}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">Bấm để xem thứ tự nét viết và nghe âm đọc của mỗi chữ</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card space-y-6 p-6">
          <Grid title="ÂM TRONG (SEION)" rows={SEION} cols={5} script={script} onPick={pick} />
          <Grid title="ÂM ĐỤC・BÁN ĐỤC (DAKUON・HANDAKUON)" rows={DAKUON} cols={5} script={script} onPick={pick} />
          <Grid title="ÂM GHÉP (YŌON)" rows={YOON} cols={6} script={script} onPick={pick} />
        </div>
        <div className="card sticky top-20 h-fit p-5 text-center">
          {sel ? (
            <>
              {[...char].length === 1 ? <StrokeOrder char={char} size={240} /> : <div className="py-10 font-jp text-8xl">{char}</div>}
              <p className="mt-2 text-xl font-semibold">{sel[1]}</p>
              <button className="btn-ghost mt-2 text-sm" onClick={() => speak(sel[0])}>🔊 Nghe lại</button>
            </>
          ) : (
            <p className="py-16 text-slate-400">Chọn một chữ để xem nét viết</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold">BÀI TẬP NGHE CHỌN CHỮ</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Mỗi vòng đi hết {ALL_SOUNDS.length} âm (xáo thứ tự): nghe âm đọc rồi chọn chữ đúng. Tiến độ tự lưu.
        </p>
        <ListeningQuiz key={script} script={script} />
      </div>
    </div>
  )
}
