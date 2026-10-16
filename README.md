# Cờ Vua

Ứng dụng cờ vua chạy trên trình duyệt: chơi với máy (Stockfish, Elo 250–3200) hoặc hai người, có đồng hồ,
tiếng Việt / tiếng Anh, và phân tích ván đấu chi tiết (xếp loại từng nước, đòn chiến thuật, lý thuyết khai cuộc,
luyện tập lại nước sai, bài học sau ván).

## Mở app

- **Trên Windows:** bấm đúp `ChoiCoVua.bat` (chạy máy chủ cục bộ tại http://localhost:8123 và mở trình duyệt).
- Hoặc phục vụ thư mục này bằng bất kỳ máy chủ tĩnh nào rồi mở `index.html`.

Cần mạng để tải Stockfish và dữ liệu khai cuộc (Lichess, lưu lại trong trình duyệt sau lần đầu).
Không có mạng thì app dùng engine và danh sách khai cuộc dự phòng, yếu hơn.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html`, `style.css` | Giao diện |
| `js/chess.js` | Luật cờ + engine dự phòng |
| `js/engine.js` | Nạp Stockfish (WebAssembly) trong Web Worker |
| `js/openings.js` | Cơ sở dữ liệu khai cuộc |
| `js/review.js` | Chấm điểm và viết nhận xét từng nước |
| `js/i18n.js` | Chuỗi tiếng Việt / tiếng Anh |
| `js/app.js` | Bàn cờ, đồng hồ, máy theo Elo, màn hình phân tích |
