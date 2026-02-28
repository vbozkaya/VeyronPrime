/**
 * Sadece cihaza kayıtlı playlist bilgisini döndürür (dashboard için).
 * get-content'tan bağımsız; M3U çekmez, trial kontrolü yapmaz.
 */
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

    const playlistRow = await db.execute({
      sql: 'SELECT m3u_url, playlist_name FROM device_playlist WHERE device_id = ?',
      args: [deviceId],
    });
    const playlist = playlistRow.rows[0];

    if (!playlist || !playlist.m3u_url) {
      json(res, 200, { m3u_url: null, playlist_name: null });
      return;
    }

    json(res, 200, {
      m3u_url: playlist.m3u_url,
      playlist_name: playlist.playlist_name || null,
    });
  } catch (e) {
    json(res, 500, { error: e.message || 'Internal error' });
  }
};
