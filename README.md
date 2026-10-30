# Kanji Học

App học tiếng Nhật (Vite + React + Tailwind), chạy hoàn toàn trên trình duyệt.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất ra dist/
```

## Dữ liệu

`public/data/kanji.json` là một mảng, mỗi phần tử:

| Trường | Ý nghĩa |
|---|---|
| `k` | chữ Kanji |
| `n` | cấp JLPT (5 → 1) |
| `s` | số nét |
| `f` | thứ hạng tần suất |
| `m` | nghĩa |
| `on` / `kun` | âm On / Kun |
| `hv` | âm Hán Việt |
| `r` | số bộ thủ |

Có thể thêm trường mới (ví dụ chiết tự) rồi hiển thị trong `src/pages/KanjiDetail.jsx`.

Nguồn: KANJIDIC2 (EDRDG, CC BY-SA 4.0), kanji-data (MIT), thứ tự nét KanjiVG (CC BY-SA 3.0, tải từ jsDelivr khi chạy).
