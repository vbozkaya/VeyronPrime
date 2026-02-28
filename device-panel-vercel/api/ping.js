/**
 * GET /api/ping - API erişilebilir mi test (tarayıcıdan aç: https://xxx.vercel.app/api/ping)
 * POST /api/check-device TV'den geliyor mu görmek için Vercel Logs'a bak.
 */
const { cors, json } = require('./lib/db');

module.exports = function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  json(res, 200, { ok: true, msg: 'API calisiyor. Cihaz kaydi icin POST /api/check-device kullan.' });
};
