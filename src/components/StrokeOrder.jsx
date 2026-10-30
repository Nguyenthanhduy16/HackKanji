import { useEffect, useRef, useState } from 'react'

const svgCache = new Map()

function kvgUrl(ch) {
  const hex = ch.codePointAt(0).toString(16).padStart(5, '0')
  return `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`
}

async function loadStrokes(ch) {
  if (!svgCache.has(ch)) {
    svgCache.set(ch, fetch(kvgUrl(ch)).then(async (r) => {
      if (!r.ok) throw new Error('not found')
      const text = await r.text()
      const doc = new DOMParser().parseFromString(text.slice(text.indexOf('<svg')), 'image/svg+xml')
      const paths = [...doc.querySelectorAll('path')].map((p) => p.getAttribute('d'))
      const nums = [...doc.querySelectorAll('text')].map((t) => ({
        n: t.textContent,
        transform: t.getAttribute('transform'),
      }))
      return { paths, nums }
    }))
  }
  return svgCache.get(ch)
}

// Hoạt hình thứ tự nét viết từ KanjiVG (CC BY-SA 3.0)
export default function StrokeOrder({ char, size = 220, showNumbers = true, speed = 1 }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [run, setRun] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    setData(null)
    setError(false)
    loadStrokes(char).then(setData).catch(() => setError(true))
  }, [char])

  useEffect(() => {
    if (!data || !ref.current) return
    const els = [...ref.current.querySelectorAll('.anim path')]
    const timers = []
    let t = 0
    els.forEach((p) => {
      const len = p.getTotalLength()
      p.style.transition = 'none'
      p.style.strokeDasharray = len
      p.style.strokeDashoffset = len
      const dur = Math.max(250, len * 9) / speed
      timers.push(setTimeout(() => {
        p.style.transition = `stroke-dashoffset ${dur}ms linear`
        p.style.strokeDashoffset = 0
      }, t + 30))
      t += dur + 120 / speed
    })
    return () => timers.forEach(clearTimeout)
  }, [data, run, speed])

  if (error)
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center font-brush text-[120px]">
        {char}
      </div>
    )
  if (!data) return <div style={{ width: size, height: size }} className="animate-pulse rounded-xl bg-slate-100" />

  return (
    <div className="relative inline-block">
      <svg ref={ref} viewBox="0 0 109 109" width={size} height={size} className="kvg rounded-xl bg-white">
        <line x1="54.5" y1="0" x2="54.5" y2="109" stroke="#f1f5f9" strokeDasharray="3 3" />
        <line x1="0" y1="54.5" x2="109" y2="54.5" stroke="#f1f5f9" strokeDasharray="3 3" />
        <g className="ghost">{data.paths.map((d, i) => <path key={i} d={d} />)}</g>
        <g className="anim">{data.paths.map((d, i) => <path key={i} d={d} />)}</g>
        {showNumbers && data.nums.map((n, i) => <text key={i} transform={n.transform}>{n.n}</text>)}
      </svg>
      <button
        onClick={() => setRun((r) => r + 1)}
        className="absolute bottom-2 right-2 rounded-lg bg-slate-800/80 px-2 py-1 text-xs text-white hover:bg-slate-900"
      >
        ↻ Phát lại
      </button>
    </div>
  )
}
