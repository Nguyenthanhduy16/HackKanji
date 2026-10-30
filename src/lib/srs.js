import { read, write } from './storage.js'

// Lặp lại ngắt quãng kiểu SM-2 rút gọn. Mỗi thẻ: { ease, interval (ngày), due (ms), reps }
const KEY = 'srs:v1'
const DAY = 86400000

export function getAll() {
  return read(KEY, {})
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now
}

// grade: 0 = Quên, 1 = Khó, 2 = Nhớ, 3 = Dễ
export function review(id, grade) {
  const all = getAll()
  const c = all[id] || { ease: 2.5, interval: 0, reps: 0, due: 0 }
  if (grade === 0) {
    c.reps = 0
    c.interval = 0
    c.ease = Math.max(1.3, c.ease - 0.2)
    c.due = Date.now() + 60_000
  } else {
    c.reps += 1
    c.ease = Math.max(1.3, c.ease + [0, -0.15, 0, 0.15][grade])
    if (c.reps === 1) c.interval = grade === 3 ? 3 : 1
    else if (c.reps === 2) c.interval = grade === 1 ? 3 : 6
    else c.interval = Math.round(c.interval * c.ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1))
    c.due = Date.now() + c.interval * DAY
  }
  all[id] = c
  write(KEY, all)
  return c
}

export function stats(ids) {
  const all = getAll()
  const now = Date.now()
  let fresh = 0, due = 0, learned = 0
  for (const id of ids) {
    const c = all[id]
    if (!c) fresh++
    else if (c.due <= now) due++
    else learned++
  }
  return { fresh, due, learned }
}
