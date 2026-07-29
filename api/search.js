import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    'Referer': 'https://vn.fifaaddict.com/',
    'Cache-Control': 'no-cache',
  };

  try {
    // Fetch trang search của fifaaddict
    const url = `https://vn.fifaaddict.com/fo4db/?search=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers });
    const html = await response.text();

    const $ = cheerio.load(html);
    const players = [];

    // Parse từng card cầu thủ trong kết quả
    $('.db-card, .player-item, [class*="player"], [class*="card"]').each((i, el) => {
      if (i >= 12) return;
      const $el = $(el);

      // Lấy link → rút pid
      const href = $el.find('a').attr('href') || $el.closest('a').attr('href') || '';
      const pidMatch = href.match(/\/(pid[a-z0-9]+)/);
      if (!pidMatch) return;
      const pid = pidMatch[1];

      // Lấy ảnh → rút imgId
      const imgSrc = $el.find('img').attr('src') || '';
      const imgMatch = imgSrc.match(/players\/([a-z0-9]+)\.png/);
      const imgId = imgMatch ? imgMatch[1] : '';

      // Tên cầu thủ
      const name = $el.find('.player-name, .name, h3, h4, strong').first().text().trim()
        || $el.text().trim().split('\n')[0].trim();

      // OVR
      const ovrText = $el.find('.ovr, .overall, [class*="ovr"]').first().text().trim();
      const ovr = parseInt(ovrText) || 0;

      // Vị trí
      const pos = $el.find('.pos, .position, [class*="pos"]').first().text().trim() || '?';

      // Mùa thẻ
      const season = $el.find('.season, .class, [class*="season"]').first().text().trim() || '?';

      if (pid && name.length > 1) {
        players.push({ name, pid, imgId, ovr, pos, season, pace:0, shooting:0, passing:0, dribbling:0, defending:0, physical:0, club:'', nation:'' });
      }
    });

    // Nếu parse class không được, thử parse link trực tiếp
    if (players.length === 0) {
      const seen = new Set();
      $('a[href*="/fo4db/pid"]').each((i, el) => {
        if (i >= 12) return;
        const href = $(el).attr('href') || '';
        const pidMatch = href.match(/\/(pid[a-z0-9]+)/);
        if (!pidMatch) return;
        const pid = pidMatch[1];
        if (seen.has(pid)) return;
        seen.add(pid);

        const imgSrc = $(el).find('img').attr('src') || '';
        const imgMatch = imgSrc.match(/players\/([a-z0-9]+)\.png/);
        const imgId = imgMatch ? imgMatch[1] : '';

        // Lấy tên từ text hoặc alt
        const name = $(el).find('img').attr('alt')?.replace(' - FO4 Player','').trim()
          || $(el).text().replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ')
          || q;

        // OVR từ text gần đó
        const fullText = $(el).text();
        const ovrMatch = fullText.match(/\b(1[0-3]\d)\b/);
        const ovr = ovrMatch ? parseInt(ovrMatch[1]) : 120;

        const posMatch = fullText.match(/\b(ST|CF|CAM|CM|CDM|LW|RW|LM|RM|LB|RB|CB|GK|LWB|RWB)\b/);
        const pos = posMatch ? posMatch[1] : '?';

        players.push({ name, pid, imgId, ovr, pos, season:'?', pace:0, shooting:0, passing:0, dribbling:0, defending:0, physical:0, club:'', nation:'' });
      });
    }

    return res.status(200).json({ players, source: 'fifaaddict-scrape', total: players.length });

  } catch (err) {
    console.error('Scrape error:', err);
    return res.status(500).json({ error: err.message, players: [] });
  }
}
