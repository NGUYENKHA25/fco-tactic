// api/search.js - Vercel Serverless Function

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing q' });

  // Thử nhiều endpoint của fifaaddict
  const urls = [
    `https://vn.fifaaddict.com/api2?q=fo4db&search=${encodeURIComponent(q)}&locale=vn`,
    `https://kr.fifaaddict.com/api2?q=fo4db&search=${encodeURIComponent(q)}&locale=kr`,
    `https://en.fifaaddict.com/api2?q=fo4db&search=${encodeURIComponent(q)}&locale=en`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    'Referer': 'https://vn.fifaaddict.com/fo4db/',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://vn.fifaaddict.com',
  };

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      const ct = response.headers.get('content-type') || '';

      if (ct.includes('json')) {
        const data = await response.json();
        // Normalize response thành array
        let players = [];
        if (Array.isArray(data)) players = data;
        else if (data.players) players = data.players;
        else if (data.data) players = data.data;
        else if (data.results) players = data.results;

        if (players.length > 0) {
          // Map fields fifaaddict → format web cần
          const mapped = players.slice(0, 10).map(p => ({
            name: p.name || p.n || p.player_name || '',
            season: p.season || p.s || p.class || '?',
            pos: p.pos || p.position || p.fp || '?',
            ovr: parseInt(p.ovr || p.overall || p.rating || 0),
            pace: parseInt(p.pac || p.pace || p.speed || 0),
            shooting: parseInt(p.sho || p.shooting || p.shot || 0),
            passing: parseInt(p.pas || p.passing || p.pass || 0),
            dribbling: parseInt(p.dri || p.dribbling || p.dribble || 0),
            defending: parseInt(p.def || p.defending || p.defense || 0),
            physical: parseInt(p.phy || p.physical || p.physic || 0),
            imgId: p.imgId || p.img_id || p.image_id || extractImgId(p) || '',
            pid: p.pid || p.id || p.player_id || '',
            club: p.club || p.team || p.club_name || '',
            nation: p.nation || p.nationality || p.country || '',
          })).filter(p => p.name && p.ovr > 0);

          if (mapped.length > 0) {
            return res.status(200).json({ players: mapped, source: 'fifaaddict' });
          }
        }
      } else {
        // HTML response — parse player IDs
        const html = await response.text();
        const players = parseHtml(html, q);
        if (players.length > 0) {
          return res.status(200).json({ players, source: 'fifaaddict-html' });
        }
      }
    } catch (e) {
      console.error('Endpoint failed:', url, e.message);
      continue;
    }
  }

  // Tất cả endpoint thất bại
  return res.status(200).json({ players: [], source: 'none', error: 'fifaaddict blocked' });
}

function extractImgId(p) {
  // Thử tìm imgId từ các field khác nhau
  const imgUrl = p.img || p.image || p.photo || p.avatar || '';
  const match = imgUrl.match(/players\/([a-z0-9]+)\.png/);
  return match ? match[1] : '';
}

function parseHtml(html, q) {
  const players = [];
  // Tìm player IDs trong HTML
  const pidRegex = /\/fo4db\/(pid[a-z0-9]+)/g;
  const imgRegex = /players\/([a-z0-9]+)\.png/g;
  const ovrRegex = /(\d{3})/g;

  const pids = [...html.matchAll(pidRegex)].map(m => m[1]);
  const imgs = [...html.matchAll(imgRegex)].map(m => m[1]);

  const seen = new Set();
  pids.forEach((pid, i) => {
    if (seen.has(pid)) return;
    seen.add(pid);
    players.push({
      name: q, // fallback tên
      pid,
      imgId: imgs[i] || '',
      ovr: 120,
      pos: '?',
      season: '?',
      pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
      club: '', nation: '',
    });
  });

  return players.slice(0, 8);
}
