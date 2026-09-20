# 🎬 SyncWatch — تماشای مشترک فیلم

## چطور کار می‌کنه؟
- هر دو نفر **همون فایل** رو لوکال روی دستگاهشون دارن
- فقط دستورات play/pause/seek از طریق سرور sync میشه
- چت همزمان داره
- هیچ محدودیت سایزی ندارد

---

## Deploy رایگان روی Render.com

### مرحله ۱ — کد رو روی GitHub بذار
```bash
git init
git add .
git commit -m "init"
# یه repo جدید روی github.com بساز
git remote add origin https://github.com/USERNAME/syncwatch.git
git push -u origin main
```

### مرحله ۲ — روی Render deploy کن
1. برو به [render.com](https://render.com) و Sign Up کن (رایگانه)
2. روی **New → Web Service** کلیک کن
3. Repo رو انتخاب کن
4. تنظیمات:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. روی **Deploy** کلیک کن
6. بعد از چند دقیقه آدرسی مثل `https://syncwatch-xxxx.onrender.com` میگیری

### مرحله ۳ — استفاده
1. آدرس سرور رو برای دوستت بفرست
2. هر دو نفر اسم و یه کد اتاق مشترک وارد کنید (مثلاً: `film1`)
3. میزبان فایل رو انتخاب می‌کنه، دوستت هم همون فایل رو انتخاب می‌کنه
4. Enjoy! 🎉

---

## اجرای لوکال (برای تست)
```bash
npm install
npm start
# بازش کن روی http://localhost:3000
```
