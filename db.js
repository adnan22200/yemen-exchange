// db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = './data.db';
const db = new sqlite3.Database(DB_PATH);

// إنشاء الجداول وإضافة حساب إداري افتراضي
async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_code TEXT NOT NULL,
      country_name TEXT NOT NULL,
      flag_url TEXT,
      buy_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  // إضافة جدول الإعدادات لتخزين الشعار وغيره
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // جدول الزيارات
  await run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      user_agent TEXT,
      path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // إضافة مدير افتراضي إن لم يكن موجودًا
  const admin = await getAdminByUsername('admin');
  if (!admin) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await run(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      ['admin', passwordHash]
    );
    console.log('تم إنشاء حساب المدير الافتراضي: admin / admin123 (يرجى تغييره لاحقًا)');
  }
}

// أدوات مساعدة للتعامل مع SQLite بوعد
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// دوال الأعمال
async function getRates() {
  return await all('SELECT * FROM rates ORDER BY created_at DESC');
}

async function addRate({ currency_code, country_name, buy_price, sell_price }) {
  return await run(
    `INSERT INTO rates (currency_code, country_name, buy_price, sell_price)
     VALUES (?, ?, ?, ?)`,
    [currency_code, country_name, buy_price, sell_price]
  );
}

// إعدادات عامة (الشعار وغيره)
async function getSetting(key) {
  const row = await get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

async function setSetting(key, value) {
  return await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

async function getAdminByUsername(username) {
  return await get('SELECT * FROM admins WHERE username = ?', [username]);
}

async function getRateById(id) {
  return await get('SELECT * FROM rates WHERE id = ?', [id]);
}

async function updateRate({ id, currency_code, country_name, buy_price, sell_price }) {
  return await run(
    `UPDATE rates
     SET currency_code = ?, country_name = ?, buy_price = ?, sell_price = ?
     WHERE id = ?`,
    [currency_code, country_name, buy_price, sell_price, id]
  );
}

async function deleteRate(id) {
  return await run('DELETE FROM rates WHERE id = ?', [id]);
}

// تسجيل زيارة
async function logVisit({ ip, user_agent, path }) {
  return await run(
    'INSERT INTO visits (ip, user_agent, path) VALUES (?, ?, ?)',
    [ip, user_agent, path]
  );
}

// إجمالي الزيارات
async function getTotalVisits() {
  const row = await get('SELECT COUNT(*) AS c FROM visits', []);
  return row ? row.c : 0;
}

// زيارات اليوم
async function getTodayVisits() {
  const row = await get('SELECT COUNT(*) AS c FROM visits WHERE date(created_at) = date("now")', []);
  return row ? row.c : 0;
}

// الزوار الفريدون (حسب IP) إجماليًا
async function getUniqueVisitors() {
  const row = await get('SELECT COUNT(DISTINCT ip) AS c FROM visits', []);
  return row ? row.c : 0;
}

// الزوار الفريدون اليوم (حسب IP)
async function getTodayUniqueVisitors() {
  const row = await get('SELECT COUNT(DISTINCT ip) AS c FROM visits WHERE date(created_at) = date("now")', []);
  return row ? row.c : 0;
}

module.exports = {
  init,
  getRates,
  addRate,
  getSetting,
  setSetting,
  getAdminByUsername,
  getRateById,
  updateRate,
  deleteRate,
  logVisit,
  getTotalVisits,
  getTodayVisits,
  getUniqueVisitors,
  getTodayUniqueVisitors
};