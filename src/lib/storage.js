import { useEffect, useState } from 'react'

export function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  useEffect(() => write(key, value), [key, value])
  return [value, setValue]
}
