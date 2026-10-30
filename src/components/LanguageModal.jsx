import { useStored } from '../lib/storage.js'

const LANGS = [
  ['vi', '🇻🇳', 'Tiếng Việt'],
  ['en', '🇺🇸', 'English'],
  ['th', '🇹🇭', 'ภาษาไทย'],
  ['id', '🇮🇩', 'Indonesia'],
  ['ko', '🇰🇷', '한국어'],
  ['fil', '🇵🇭', 'Filipino'],
  ['ne', '🇳🇵', 'नेपाली'],
  ['my', '🇲🇲', 'မြန်မာ'],
]

export default function LanguageModal() {
  const [lang, setLang] = useStored('lang', null)
  if (lang) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="text-4xl text-brand-500">文A</div>
          <h2 className="mt-3 text-xl font-semibold">Chọn ngôn ngữ</h2>
          <p className="text-sm text-slate-500">Select your language</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {LANGS.map(([code, flag, name]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-3 hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="text-3xl">{flag}</span>
              <span className="text-sm">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
