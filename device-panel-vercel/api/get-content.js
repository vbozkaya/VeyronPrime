const { getClient, ensureTables, cors, json } = require('./lib/db');

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (ch) => { data += ch; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const db = getClient();
  if (!db) {
    json(res, 503, { error: 'Veritabanı yapılandırılmamış (TURSO_*)' });
    return;
  }

  try {
    await ensureTables(db);
    const body = await parseBody(req);
    const deviceId = (body.deviceId ?? body.device_id ?? '').toString().trim();

    if (!deviceId) {
      json(res, 400, { error: 'Missing deviceId' });
      return;
    }

    // İsteğe bağlı: trial kontrolü (devices tablosundan)
    const deviceRow = await db.execute({
      sql: 'SELECT trial_ends_at FROM devices WHERE device_id = ?',
      args: [deviceId],
    });
    const device = deviceRow.rows[0];
    if (device && device.trial_ends_at && new Date(device.trial_ends_at) < new Date()) {
      json(res, 403, { error: 'Deneme süreniz doldu.' });
      return;
    }

    const playlistRow = await db.execute({
      sql: 'SELECT m3u_url, playlist_name FROM device_playlist WHERE device_id = ?',
      args: [deviceId],
    });
    const playlist = playlistRow.rows[0];

    if (!playlist || !playlist.m3u_url) {
      json(res, 200, { live: [], movies: [], series: [], m3u_url: null });
      return;
    }

    // CORS sorununu aşmak için M3U'yu sunucuda indirip içeriği de döndür
    let m3u_content = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const fetchRes = await fetch(playlist.m3u_url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'VeyronPrime-Panel/1.0' },
      });
      clearTimeout(timeoutId);
      if (fetchRes.ok) m3u_content = await fetchRes.text();
    } catch (e) {
      // m3u_content olmadan dönersek uygulama URL'den kendisi dener (CORS riski)
    }

    json(res, 200, {
      m3u_url: playlist.m3u_url,
      playlist_name: playlist.playlist_name || null,
      m3u_content: m3u_content || null,
      live: [],
      movies: [],
      series: [],
    });
  } catch (e) {
    json(res, 500, { error: e.message || 'Internal error' });
  }
};
