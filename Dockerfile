# استخدم Node الرسمي
FROM node:18-alpine

# ضبط مجلد العمل
WORKDIR /app

# نسخ ملفات التعريف وتثبيت الحزم
COPY package*.json ./
RUN npm ci --only=production

# نسخ بقية المشروع
COPY . .

# المتغيرات الأساسية
ENV NODE_ENV=production
# Cloud Run يمرر PORT تلقائيًا، وتطبيقك يقرأه

# تشغيل السيرفر
CMD ["npm", "start"]