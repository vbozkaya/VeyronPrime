/**
 * Cihaza kayıtlı playlist'i veritabanından siler.
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
    const deviceKey = (body.deviceKey ?? body.device_key ?? '').toString().trim();

    if (!deviceId) {
      json(res, 400, { error: 'Missing deviceId' });
      return;
    }

    if (deviceKey) {
      const deviceRow = await db.execute({
        sql: 'SELECT device_key FROM devices WHERE device_id = ?',
        args: [deviceId],
      });
      const device = deviceRow.rows[0];
      if (device && device.device_key !== deviceKey) {
        json(res, 403, { error: 'Geçersiz cihaz bilgisi' });
        return;
      }
    }

    await db.execute({
      sql: 'DELETE FROM device_playlist WHERE device_id = ?',
      args: [deviceId],
    });

    json(res, 200, { success: true });
  } catch (e) {
    json(res, 500, { error: e.message || 'Internal error' });
  }
};
