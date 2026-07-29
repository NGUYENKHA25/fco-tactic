# FCO Tactics – FC Online Tactics Builder

Trang web phân tích chiến thuật FC Online với search cầu thủ y chang fifaaddict.com

## Tính năng
- 🔍 Search cầu thủ thực tế từ fifaaddict.com (qua proxy)
- 🖼️ Ảnh cầu thủ thật từ fifaaddict CDN
- ⚽ Sân cỏ kéo thả, đổi sơ đồ chiến thuật
- 📊 Xem chỉ số chi tiết khi click cầu thủ
- 🤖 AI phân tích điểm mạnh/yếu đội hình
- 🔗 Chia sẻ đội hình qua link

## Deploy lên Vercel (miễn phí)

### Bước 1: Tạo tài khoản
- Vào https://github.com → tạo tài khoản (nếu chưa có)
- Vào https://vercel.com → đăng nhập bằng GitHub

### Bước 2: Upload code
1. Tạo repo mới trên GitHub tên `fco-tactics`
2. Upload toàn bộ file trong thư mục này lên repo
   - index.html
   - api/search.js
   - vercel.json
   - package.json

### Bước 3: Deploy
1. Vào Vercel → "Add New Project"
2. Import repo `fco-tactics` từ GitHub
3. Bấm Deploy → đợi ~1 phút
4. Vercel tự tạo link dạng: `https://fco-tactics.vercel.app`

### Bước 4: Test
- Vào link Vercel vừa tạo
- Thử search "Messi" → kết quả từ fifaaddict thật hiện ra!

## Cấu trúc file
```
fco-tactics-app/
├── index.html          # Web chính
├── api/
│   └── search.js       # Proxy bypass CORS → fifaaddict
├── vercel.json         # Config Vercel
├── package.json
└── README.md
```

## Lưu ý
- Proxy `/api/search?q=messi` → gọi fifaaddict API thật
- Ảnh cầu thủ từ `s1.fifaaddict.com` CDN (public)
- AI phân tích dùng Claude API (chỉ hoạt động trong Claude.ai)
- Khi host public, AI features cần Anthropic API key riêng
