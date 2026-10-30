export function speak(text, lang = 'ja-JP') {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.85
  const voice = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('ja'))
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
}
