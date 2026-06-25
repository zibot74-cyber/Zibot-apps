// ═══════════════════════════════════════════════════════
//  ecosystem.config.js — PM2 Production Config
//  التشغيل:
//    pm2 start ecosystem.config.js
//    pm2 start ecosystem.config.js --only zibot-bot
//    pm2 start ecosystem.config.js --only zibot-web
//    pm2 save && pm2 startup    ← للتشغيل التلقائي عند إعادة التشغيل
// ═══════════════════════════════════════════════════════

const path = require('path');
const ROOT = __dirname;

module.exports = {
  apps: [
    // ── البوت (Express + WhatsApp + داشبورد React) ─────────────
    {
      name: 'zibot-bot',
      script: path.join(ROOT, 'Bot/backend/server.js'),
      cwd:    path.join(ROOT, 'Bot/backend'),

      // إعادة التشغيل الذكية
      autorestart:      true,
      watch:            false,          // لا تراقب الملفات في production
      max_memory_restart: '512M',       // أعد التشغيل إذا تجاوز الذاكرة
      restart_delay:    3000,           // انتظر 3 ثوانٍ قبل إعادة التشغيل
      max_restarts:     10,             // أقصى محاولات
      min_uptime:       '10s',          // يجب أن يعمل 10 ثوانٍ على الأقل

      // Node.js args للأداء
      node_args: [
        '--max-old-space-size=512',
        '--gc-interval=100',
      ],

      // متغيرات البيئة
      env: {
        NODE_ENV: 'production',
        PORT:     3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:     3000,
      },

      // السجلات
      error_file:   path.join(ROOT, '.logs/bot-error.log'),
      out_file:     path.join(ROOT, '.logs/bot-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:   true,

      // instance (single process — WhatsApp لا تدعم multi-instance)
      instances: 1,
      exec_mode: 'fork',
    },

    // ── الموقع التسويقي (Next.js) ────────────────────────────────
    {
      name: 'zibot-web',
      script: 'node_modules/.bin/next',
      args:   'start -p 3001',
      cwd:    ROOT,

      autorestart:      true,
      watch:            false,
      max_memory_restart: '768M',
      restart_delay:    3000,
      max_restarts:     10,
      min_uptime:       '10s',

      node_args: ['--max-old-space-size=768'],

      env: {
        NODE_ENV: 'production',
        PORT:     3001,
      },

      // Bug #16 Fix: إضافة env_development كانت مفقودة → بعض الوظائف لا تعمل في وضع development
      env_development: {
        NODE_ENV:     'development',
        PORT:         3001,
        FRONTEND_URL: 'http://localhost:3001',
      },

      error_file:   path.join(ROOT, '.logs/web-error.log'),
      out_file:     path.join(ROOT, '.logs/web-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:   true,

      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
