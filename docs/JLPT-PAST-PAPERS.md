# Đề thi JLPT các năm (past papers)

Phần “Đề thi JLPT các năm” trong trang **Luyện thi JLPT** (`/[locale]/exams`) cho làm đề N2 theo từng phần
(文字・語彙, 文法, 読解, 聴解) hoặc cả bài, luyện tùy chỉnh theo dạng bài/năm/từ khóa, và ôn câu sai.

## Nội dung đề không nằm trong repository

Câu hỏi, đoạn văn, ảnh đề, script và audio là tài liệu có bản quyền (JEES/Japan Foundation; bản tái hiện của
cộng đồng) và audio nặng khoảng 1,2 GB. Vì vậy:

- Mã nguồn chỉ chứa giao diện (`src/features/study/past-papers.tsx`), logic (`src/lib/past-papers.ts`),
  store (`src/lib/past-papers-store.ts`) và công cụ tạo dữ liệu (`scripts/jlpt/n2build.py`).
- Dữ liệu được tạo vào `public/jlpt/` — thư mục này nằm trong `.gitignore`. **Không commit nó.**
- Khi chưa có dữ liệu, trang hiện thông báo “Chưa có dữ liệu đề thi” thay vì lỗi.
- Trước khi đưa lên một website công khai, chủ dự án cần tự cân nhắc quyền sử dụng nội dung đề.

## Tạo dữ liệu

Yêu cầu: Python 3.10+, `pip install pymupdf pillow`, `ffmpeg`/`ffprobe`, quyền truy cập thư mục Google Drive chứa đề
(ID trong `ROOT_FOLDER` của script; mỗi đề một thư mục con gồm PDF đề, PDF script có chữ “script”, file `.mp3`,
cùng file “ĐÁP ÁN JLPT N2 … .pdf” ở thư mục gốc).

```sh
python3 scripts/jlpt/n2build.py list                 # liệt kê đề trên Drive, “MỚI” = chưa tạo
python3 scripts/jlpt/n2build.py fetch                # tải tất cả (hoặc: fetch 2026-12)
python3 scripts/jlpt/n2build.py build --web          # tạo public/jlpt/n2/… (hoặc: build --web 2026-12)
```

`build` kiểm tra số câu, đáp án, đoạn văn và vị trí ảnh của từng câu nghe; in `OK` hoặc `CHECK …` kèm câu cần xem
(lỗi đánh máy trong PDF được sửa qua bảng `FIX` trong script). Đề mới chỉ thêm file của đề đó và cập nhật index;
không cần build lại đề cũ. Tải trang lại là thấy đề mới.

Cấu trúc tạo ra:

```
public/jlpt/index.json                 {"levels": ["N2"]}
public/jlpt/n2/exams/index.json        {"tags": ["2010-07", …]}
public/jlpt/n2/exams/<YYYY-MM>.json    câu hỏi, đáp án, đoạn văn, đáp án nghe, vị trí ảnh, danh sách audio
public/jlpt/n2/listen/<tag>-q.jpg      phần in trên đề của từng câu nghe (220 dpi)
public/jlpt/n2/listen/<tag>-script.jpg script nghe có đáp án
public/jlpt/n2/img/<tag>-p<n>.jpg      trang gốc phần 情報検索
public/jlpt/n2/audio/<tag>.mp3         file nghe gốc (copy nguyên)
```

## Lưu trữ ngoài `public/`

Đặt `NEXT_PUBLIC_JLPT_BASE` (ví dụ `https://cdn.example.com/jlpt`) để đọc dữ liệu từ CDN/bucket riêng có giới hạn
truy cập; mặc định là `/jlpt`. Server cần hỗ trợ HTTP Range để tua audio (Next.js `public/` và hầu hết CDN đều có).

## Tiến độ

Tiến độ từng câu, kết quả từng đề/phần, phiên đang làm và bộ lọc lưu trong trình duyệt (`localStorage`,
key `nhaikanji-jlpt-past-v1`). Phần này chưa nằm trong bản sao lưu tài khoản ở Settings.
