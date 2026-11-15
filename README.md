# NhaiKanji

Ứng dụng học tiếng Nhật cho người Việt, dựng theo `kitsumi-clone-prompt.md` và đối chiếu trực tiếp giao diện công khai của Kitsumi. Tên, logo, linh vật gấu, hình bài học và nội dung học được làm riêng theo yêu cầu của prompt.

## Chạy ngay

Yêu cầu Node.js 22+ và npm. Từ thư mục dự án:

```sh
npm ci
npm run dev
```

- Landing: http://localhost:3000/vi
- Dashboard: http://localhost:3000/vi/home
- Server mặc định chỉ lắng nghe `127.0.0.1`.

Không cần tài khoản hay PostgreSQL để thử đầy đủ giao diện và các luồng học cục bộ.

Bản production:

```sh
npm run build
npm start
```

Dừng dev server trước khi build/start cùng thư mục `.next`. Không chạy hai lượt build đồng thời. Các file trong `.next` là cache sinh ra; mã nguồn không nằm ở đó.

## Các phần đã triển khai

- Landing, sidebar 256/64px, header 64px, tìm từ `Ctrl/⌘K`, light/dark, chuyển locale, menu mobile và bottom tabs.
- Dashboard: streak/XP, nhiệm vụ, ôn tập nhanh, carousel, heatmap 90 ngày, mốc thưởng và bảng xếp hạng.
- Catalogue lọc chủ đề/trình độ/tìm kiếm; 30 bài học riêng, 5 chủ đề, JLPT N5–N1, 90 câu có file MP3 cục bộ.
- Dictation: điều khiển âm thanh, phím tắt, kiểm tra kanji/kana/romaji, chuẩn hóa full-width, gợi ý tính vào điểm, transcript và ghi chú.
- Shadowing: furigana bằng ruby, bản dịch, thu âm qua MediaRecorder, nghe lại và so sánh A/B. Không tạo điểm phát âm giả.
- Từ vựng: tạo/sửa bộ thẻ, thêm/sửa/xóa từ, lật thẻ, bốn mức đánh giá và lịch SM-2; hàng ôn tập chung với ngữ pháp.
- Thư viện ngữ pháp theo JLPT, lọc/tìm kiếm, ví dụ, ghi chú, lưu ôn tập.
- 5 đề luyện tập ngắn, đồng hồ đếm ngược, navigator, khôi phục bài chưa nộp, tự nộp và chấm điểm/lịch sử thực.
- 10 trò chơi với cơ chế gõ từ, nối nghĩa, đoán kana, ghép câu và chọn đáp án, lưu điểm và chơi lại.
- Shop/kho đồ/trang bị, bảng xếp hạng mẫu, cộng đồng cục bộ, hồ sơ, nhiệm vụ, ghi chú, từ cá nhân, góp ý và cài đặt.
- Prisma/PostgreSQL, Auth.js Google/email theo cấu hình, các API bảo vệ bằng session và giao dịch phần thưởng/mua hàng có chống xử lý lặp.
- Sao lưu/khôi phục thủ công theo tài khoản trong Settings: dữ liệu riêng, import demo có xác nhận, kiểm tra phiên bản để tránh ghi đè thay đổi trên thiết bị khác.
- YouTube IFrame transport cho bài được khai báo nguồn video: seek trong đoạn, loop, tốc độ, volume, tự dừng cuối câu và fallback MP3.

## Ranh giới của bản trải nghiệm

**Đây là bản triển khai hoạt động với dữ liệu demo, chưa phải bản sao giống hệt từng pixel hay dịch vụ Kitsumi đầy đủ.**

- Không chép tên thương hiệu, hình độc quyền, video/audio bài gốc, transcript hay dữ liệu người dùng thật. Các khác biệt được ghi trong [docs/DESIGN-REFERENCE.md](docs/DESIGN-REFERENCE.md).
- Tiến độ hoàn thành nghe/nói được lưu riêng. Dữ liệu cũ thiếu chế độ hoặc ngày vẫn được giữ, chỉ tính trong tổng toàn thời gian khi không thể xác định đúng kỳ.
- Mặc định dữ liệu nằm trong trình duyệt. Khi Auth.js được cấu hình, Settings cho phép lưu/khôi phục bản sao riêng theo tài khoản. Đây là thao tác thủ công, không tự đồng bộ; XP/vật phẩm phía client không ghi vào bảng phần thưởng hay xếp hạng server. Ghi chú/bình luận riêng của player và bản ghi âm chưa nằm trong snapshot. Xóa dữ liệu site sẽ xóa dữ liệu chưa sao lưu trên thiết bị.
- Bộ 30 bài mẫu dùng audio được biên soạn riêng. Player đã hỗ trợ nguồn YouTube nhưng chưa có bài video được cấp phép trong bộ seed; chẩn đoán dùng video mẫu chính thức của YouTube chỉ để kiểm thử, không đưa vào bài tiếng Nhật.
- Ghi âm cần quyền micro do trình duyệt hỏi. Kiểm thử tự động dùng thiết bị âm thanh giả của Chromium, không truy cập micro thật. Chưa có đánh giá phát âm tự động.
- Các đề là bài mẫu 5 câu, không phải đề thi JLPT đầy đủ/chính thức. Trò chơi là bản 2D trong trình duyệt; không có multiplayer hay game 3D tương đương nguyên bản.
- `vi` đầy đủ; `en`, `ja` có scaffold và bản dịch nhiều phần, một số nội dung landing/giải thích vẫn dùng ngôn ngữ dự phòng.
- Google OAuth và SMTP cần credential do chủ dự án cấu hình; chưa đăng nhập Google thật hoặc gửi email. Không có tài khoản demo dùng để vượt xác thực máy chủ.
- Chưa deploy công khai. Nội dung xếp hạng/cộng đồng được ghi rõ là mẫu.

## PostgreSQL trong thư mục dự án

Không cần Docker, sudo hoặc cài service hệ thống:

```sh
npm run db:local
```

Giữ terminal này chạy. Trong terminal khác:

```sh
npm run db:setup
npm run db:test
```

PostgreSQL chỉ bind `127.0.0.1:5434`; dữ liệu nằm trong `.local/postgres`. `db:setup` migrate và seed qua helper dùng credential phát triển cục bộ. Không chạy hai database cùng port. Xem [docs/BACKEND.md](docs/BACKEND.md) cho cấu hình Auth.js, API, deploy và giới hạn đồng bộ.

## Kiểm thử

```sh
npm run typecheck
npm test
npm audit
npm run build
```

Với ứng dụng chạy tại port 3000 và Chrome/Chromium có sẵn:

```sh
npm run qa:routes
npm run qa:lessons
npm run qa:study
npm run qa:social
npm run qa:youtube
npm run qa:account
```

Script QA hiện dùng `/usr/bin/google-chrome`; chỉnh executablePath nếu môi trường khác. Browser context kiểm thử tách biệt với trình duyệt cá nhân. Các form cộng đồng/góp ý chỉ lưu cục bộ.

Bằng chứng: `qa/`, `src/features/lessons/qa/report.json`, `src/features/study/qa/report.json`. Xem [qa/report.md](qa/report.md) để biết kết quả và giới hạn xác minh.

## Cấu trúc

- `src/app/`: App Router, layout, routes và API.
- `src/components/`: UI Radix, providers và app shell.
- `src/features/`: dashboard, landing, lessons, study, social.
- `src/messages/`: catalogue next-intl.
- `src/lib/gamification/`: cấu hình và luật phần thưởng.
- `src/lib/server/`: Prisma, session và xử lý API.
- `public/lessons/`: hình gốc và 90 MP3; `public/shop/`: SVG vật phẩm riêng.
- `prisma/`: schema, migration, seed và PostgreSQL cục bộ.

Mã cũ đã ở trạng thái bị xóa trước khi bắt đầu; thay đổi đó được giữ nguyên trong commit chuyển sang Next.js. Lịch sử Git được chia theo module để dễ xem xét và bảo trì.
