import { write } from '../lib/storage.js'

export default function Settings() {
  const reset = (key, msg) => {
    if (confirm(msg)) {
      localStorage.removeItem(key)
      location.reload()
    }
  }
  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold">Cài đặt</h1>
      <button className="btn-ghost w-full justify-between" onClick={() => { write('lang', null); location.reload() }}>Đổi ngôn ngữ <span>›</span></button>
      <button className="btn-ghost w-full justify-between" onClick={() => reset('srs:v1', 'Xoá toàn bộ tiến độ Flashcard?')}>Xoá tiến độ Flashcard <span>›</span></button>
      <button className="btn-ghost w-full justify-between" onClick={() => reset('starred', 'Xoá danh sách Kanji đã lưu?')}>Xoá Kanji đã lưu <span>›</span></button>
      <p className="pt-4 text-xs text-slate-400">
        Dữ liệu: KANJIDIC2 (EDRDG, CC BY-SA 4.0) · kanji-data (MIT) · Thứ tự nét: KanjiVG (Ulrich Apel, CC BY-SA 3.0).
        Tiến độ học được lưu trong trình duyệt.
      </p>
    </div>
  )
}
