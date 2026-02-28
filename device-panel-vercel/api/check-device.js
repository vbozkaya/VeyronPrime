const { getClient, ensureTables, cors, json } = require('./lib/db');

const TRIAL_DAYS = 7;

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
  var method = (req.method || '').toUpperCase();
  if (method === 'GET') {
    var body = JSON.stringify({ ok: true, msg: 'API calisiyor. Cihaz kaydi: POST ile deviceId, deviceKey gonder.' });
    cors(res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(200);
    res.end(body);
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
    const fromPanel = body.from_panel === true;

    if (!deviceId || !deviceKey) {
      json(res, 400, { error: 'missing device id or key' });
      return;
    }

    const row = await db.execute({
      sql: 'SELECT device_key, trial_ends_at FROM devices WHERE device_id = ?',
      args: [deviceId],
    });

    const existing = row.rows[0];

    if (fromPanel) {
      if (!existing) {
        // Panelden ilk giriş: cihaz yoksa oluştur, böylece playlist kaydedilebilsin
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
        await db.execute({
          sql: `INSERT INTO devices (device_id, device_key, trial_ends_at, updated_at)
                VALUES (?, ?, ?, datetime('now'))
                ON CONFLICT(device_id) DO NOTHING`,
          args: [deviceId, deviceKey, trialEndsAt.toISOString()],
        });
        json(res, 200, { status: 'created' });
        return;
      }
      if (existing.device_key !== deviceKey) {
        json(res, 403, { error: 'Geçersiz cihaz bilgisi' });
        return;
      }
      if (existing.trial_ends_at && new Date(existing.trial_ends_at) < new Date()) {
        json(res, 403, { error: 'Deneme süreniz doldu.' });
        return;
      }
      json(res, 200, { status: 'valid' });
      return;
    }

    // TV: yoksa oluştur
    if (!existing) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
      await db.execute({
        sql: `INSERT INTO devices (device_id, device_key, trial_ends_at, updated_at)
              VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(device_id) DO NOTHING`,
        args: [deviceId, deviceKey, trialEndsAt.toISOString()],
      });
      json(res, 200, { status: 'created' });
      return;
    }

    if (existing.device_key !== deviceKey) {
      json(res, 403, { error: 'Geçersiz cihaz bilgisi' });
      return;
    }
    if (existing.trial_ends_at && new Date(existing.trial_ends_at) < new Date()) {
      json(res, 403, { error: 'Deneme süreniz doldu.' });
      return;
    }
    json(res, 200, { status: 'valid' });
  } catch (e) {
    json(res, 500, { error: e.message || 'Internal error' });
  }
};
