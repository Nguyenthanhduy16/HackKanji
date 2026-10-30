import { useEffect, useRef, useState } from 'react'

// Bảng luyện viết: chữ mẫu mờ phía sau, vẽ bằng chuột/cảm ứng
export default function WritingPad({ char, size = 260 }) {
  const canvas = useRef(null)
  const drawing = useRef(false)
  const [guide, setGuide] = useState(true)

  const clear = () => {
    const c = canvas.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }

  useEffect(clear, [char])

  const pos = (e) => {
    const r = canvas.current.getBoundingClientRect()
    const p = e.touches ? e.touches[0] : e
    return [((p.clientX - r.left) / r.width) * canvas.current.width, ((p.clientY - r.top) / r.height) * canvas.current.height]
  }
  const start = (e) => {
    drawing.current = true
    const ctx = canvas.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(...pos(e))
  }
  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvas.current.getContext('2d')
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e293b'
    ctx.lineTo(...pos(e))
    ctx.stroke()
  }
  const end = () => (drawing.current = false)

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white" style={{ width: size, height: size }}>
        {guide && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-brush text-slate-200" style={{ fontSize: size * 0.78 }}>
            {char}
          </div>
        )}
        <canvas
          ref={canvas}
          width={size * 2}
          height={size * 2}
          className="absolute inset-0 h-full w-full touch-none"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost text-sm" onClick={clear}>Xoá</button>
        <button className="btn-ghost text-sm" onClick={() => setGuide((g) => !g)}>{guide ? 'Ẩn mẫu' : 'Hiện mẫu'}</button>
      </div>
    </div>
  )
}
