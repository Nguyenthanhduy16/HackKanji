import { LEVELS } from '../lib/data.js'

// Khung trang cho Từ vựng / Ngữ pháp / JLPT, chờ nạp nội dung
export default function Section({ title, subtitle, unit }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {LEVELS.map((l) => (
          <div key={l.n} className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold text-brand-600">{l.label}</span>
            <div>
              <p className="font-semibold">{title} {l.label}</p>
              <p className="text-sm text-slate-500">{l.desc} · 0 {unit}</p>
            </div>
            <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">Chưa có dữ liệu</span>
          </div>
        ))}
      </div>
    </div>
  )
}
