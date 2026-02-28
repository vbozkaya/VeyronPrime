/**
 * Turso (libsql) client. TURSO_DATABASE_URL ve TURSO_AUTH_TOKEN gerekli.
 * Eksikse null döner; route'lar 503 döner.
 */
let client = null;

function getClient() {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    const { createClient } = require('@libsql/client');
    client = createClient({ url, authToken: token });
    return client;
  } catch (e) {
    return null;
  }
}

async function ensureTables(db) {
  if (!db) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      device_key TEXT NOT NULL,
      trial_ends_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS device_playlist (
      device_id TEXT PRIMARY KEY,
      m3u_url TEXT NOT NULL,
      playlist_name TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

module.exports = { getClient, ensureTables, cors, json };
