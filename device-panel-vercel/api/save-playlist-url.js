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
    const deviceKey = (body.deviceKey ?? body.device_key ?? '').toString().trim();
    const m3uUrl = (body.m3uUrl ?? body.m3u_url ?? '').toString().trim();
    const playlistName = (body.playlistName ?? body.playlist_name ?? '').toString().trim();

    if (!deviceId) {
      json(res, 400, { error: 'Missing deviceId' });
      return;
    }
    if (!m3uUrl) {
      json(res, 400, { error: 'Missing m3uUrl' });
      return;
    }

    // Panelden geldiği için cihaz zaten giriş yapmış; key ile yetki kontrolü isteğe bağlı
    const deviceRow = await db.execute({
      sql: 'SELECT device_key FROM devices WHERE device_id = ?',
      args: [deviceId],
    });
    const device = deviceRow.rows[0];
    if (device && device.device_key !== deviceKey) {
      json(res, 403, { error: 'Geçersiz cihaz bilgisi' });
      return;
    }

    await db.execute({
      sql: `INSERT INTO device_playlist (device_id, m3u_url, playlist_name, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(device_id) DO UPDATE SET
              m3u_url = excluded.m3u_url,
              playlist_name = excluded.playlist_name,
              updated_at = datetime('now')`,
      args: [deviceId, m3uUrl, playlistName || null],
    });

    json(res, 200, { success: true, m3u_url: m3uUrl });
  } catch (e) {
    json(res, 500, { error: e.message || 'Internal error' });
  }
};
