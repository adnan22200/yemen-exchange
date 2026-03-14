// app.js
const path = require('path');
const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();
app.set('trust proxy', 1);

// إعداد المحرك القوالبي
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// وسطاء المعالجة
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// جلسات (ذاكرة افتراضية للتبسيط - يمكن لاحقًا استخدام مخزن دائم)
app.use(
  session({
    secret: 'غيّر_هذا_المفتاح_السرّي',
    resave: false,
    saveUninitialized: false,
  })
);

// ملفات ثابتة (CSS/صور)
app.use(express.static(path.join(__dirname, 'public')));

// تهيئة قاعدة البيانات والجداول
db.init()
  .then(() => {
    console.log('تم تهيئة قاعدة البيانات بنجاح.');
  })
  .catch((err) => {
    console.error('خطأ في تهيئة قاعدة البيانات:', err);
  });

// المسارات
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// تشغيل السيرفر
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`السيرفر يعمل على المنفذ ${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`المنفذ ${port} مستخدم. سأجرب منفذًا آخر...`);
      startServer(port + 1);
    } else {
      console.error('خطأ في تشغيل السيرفر:', err);
    }
  });
}

startServer(DEFAULT_PORT);