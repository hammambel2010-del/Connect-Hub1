---
title: Connect Hub
emoji: 🌐
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Connect Hub — Social Networking App

تطبيق شبكة اجتماعية عربي متكامل يدعم الرسائل الفورية ومجموعات الدردشة وإدارة الصداقات.

## 🚀 النشر على Hugging Face Spaces

### 1. رفع الملفات
ارفع **كامل محتوى المجلد** إلى مستودع HF Space الخاص بك (نوعه Docker).

### 2. ضبط المتغيرات السرية (Secrets)

اذهب إلى **Settings → Variables and secrets** في Space الخاص بك وأضف:

| المتغير | الوصف | مطلوب |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | مفتاح Clerk العام (يبدأ بـ `pk_live_`) | ✅ **وقت البناء** |
| `CLERK_SECRET_KEY` | مفتاح Clerk السري (يبدأ بـ `sk_live_`) | ✅ وقت التشغيل |
| `DATABASE_URL` | رابط PostgreSQL (مثال: `postgresql://user:pass@host:5432/dbname`) | ✅ وقت التشغيل |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | محتوى ملف JSON لـ Google Cloud Service Account | ✅ لو تريد رفع الصور |

> ⚠️ **مهم جداً:** `VITE_CLERK_PUBLISHABLE_KEY` يُضمَّن في كود الواجهة وقت البناء (Docker build).  
> بعد إضافته كـ Secret، اضغط **Factory reboot** لإعادة بناء الـ Docker image.

### 3. إعداد Clerk Dashboard

في [dashboard.clerk.com](https://dashboard.clerk.com):

- أضف **رابط الـ Space** إلى "Allowed Origins":
  `https://<your-username>-connect-hub.hf.space`
- فعّل **Google OAuth** إذا أردت تسجيل الدخول بجوجل.

### 4. إعداد قاعدة البيانات

بعد تشغيل الـ Space لأول مرة، شغّل Drizzle لإنشاء الجداول:
```bash
# من جهازك المحلي مع DATABASE_URL في بيئتك
pnpm --filter @workspace/db run push
```

### 5. إعداد Google Cloud Storage (اختياري لرفع الصور)

1. اصنع **Service Account** في Google Cloud مع صلاحيات `Storage Object Admin`
2. حمّل ملف JSON للمفتاح
3. انسخ محتواه كله والصقه في متغير `GOOGLE_APPLICATION_CREDENTIALS_JSON`

---

## 🏗️ البنية التقنية

```
Port 7860 (nginx)
├── /api/__clerk/*  →  Express:8080/api/__clerk/*  (Clerk Auth Proxy)
├── /api/*          →  Express:8080/*               (REST API)
└── /*              →  /var/www/html                (React SPA)
```

- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express 5 + TypeScript + Drizzle ORM
- **Auth**: Clerk
- **DB**: PostgreSQL
- **Storage**: Google Cloud Storage
