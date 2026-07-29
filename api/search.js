// api/search.js - Vercel Serverless Function
// Deploy lên Vercel, file này tự động thành endpoint: /api/search

export default async function handler(req, res) {
  // Cho phép CORS từ mọi domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, pid } = req.query;

  try {
    let url;

    if (pid) {
      // Lấy chi tiết 1 cầu thủ theo player ID
      url = `https://vn.fifaaddict.com/fo4db/${pid}`;
    } else if (q) {
      // Tìm kiếm cầu thủ
      url = `https://vn.fifaaddict.com/api2?q=fo4db&search=${encodeURIComponent(q)}&locale=vn`;
    } else {
      return res.status(400).json({ error: 'Missing query param: q or pid' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Referer': 'https://vn.fifaaddict.com/',
      }
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(200).json(data);
    } else {
      // HTML response - parse thủ công
      const html = await response.text();
      return res.status(200).json({ html, raw: true });
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
