import { useEffect, useState } from 'react'

// Kanji record: { k, n (JLPT level), s (strokes), f (freq), m (meanings), on, kun, hv (Hán Việt), r (radical no.) }
let cache = null
let pending = null

export function loadKanji() {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = fetch('/data/kanji.json')
      .then((r) => r.json())
      .then((list) => {
        cache = { list, byChar: new Map(list.map((x) => [x.k, x])) }
        return cache
      })
  }
  return pending
}

export function useKanji() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (!cache) loadKanji().then(setData)
  }, [])
  return data
}

export const LEVELS = [
  { n: 5, label: 'N5', desc: 'Cơ bản' },
  { n: 4, label: 'N4', desc: 'Sơ cấp' },
  { n: 3, label: 'N3', desc: 'Trung cấp' },
  { n: 2, label: 'N2', desc: 'Trung cao cấp' },
  { n: 1, label: 'N1', desc: 'Cao cấp' },
]

// Bỏ dấu tiếng Việt để tìm "nhat" khớp "NHẬT"
export function fold(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim()
}

export function searchKanji(list, q) {
  const query = q.trim()
  if (!query) return []
  const chars = [...query].filter((c) => /\p{Script=Han}/u.test(c))
  if (chars.length) return chars.map((c) => list.find((x) => x.k === c)).filter(Boolean)
  const f = fold(query)
  return list.filter((x) => x.hv.some((h) => fold(h) === f || fold(h).startsWith(f))).slice(0, 60)
}
