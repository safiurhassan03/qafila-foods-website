# Qafila Foods E-commerce Website

এটি Qafila Foods-এর জন্য একটি চালানো যায় এমন Website + Admin Panel starter project। Sample ও editable content রাখা হয়েছে। নিজের আসল product photo, price, description এবং business details Admin Panel থেকে পরিবর্তন করা যাবে।

## কী কী আছে
- Responsive Bengali storefront
- Product listing, category filter, search
- Cart ও checkout (Cash on Delivery / manual payment selection)
- Order database ও stock decrement
- Contact form ও customer messages
- Admin login, password change
- Product CRUD, category CRUD, order status management
- Homepage text, hero image URL, contact, delivery charge, footer settings edit
- SQLite database; server restart হলেও data থাকে

## চালানোর নিয়ম (Windows / Mac / Linux)
1. Node.js LTS ইনস্টল করুন: https://nodejs.org/
2. এই project folder খুলে Terminal/Command Prompt চালু করুন।
3. `.env.example` কপি করে `.env` নামে save করুন।
4. `.env` ফাইলে `SESSION_SECRET`-এ দীর্ঘ random secret দিন। `ADMIN_USERNAME` ও `ADMIN_PASSWORD` নিজের মতো সেট করুন।
5. Terminal-এ চালান:
   ```bash
   npm install
   npm start
   ```
6. Browser-এ খুলুন: `http://localhost:3000`
7. Admin Panel: `http://localhost:3000/admin.html`

## Initial Admin Login
`.env`-এ দেওয়া ডিফল্ট:
- Username: `admin`
- Temporary password: `Qafila@2026!`

প্রথম login-এর পর Admin Panel-এর Password & Security থেকে password পরিবর্তন করুন। Public hosting-এ তোলার আগে অবশ্যই `.env`-এ নিজের password ও SESSION_SECRET দিন। `.env` কখনো কাউকে পাঠাবেন না।

## গুরুত্বপূর্ণ সীমাবদ্ধতা ও Live করার আগে করণীয়
এটি একটি working starter/MVP; production launch-এর আগে:
- HTTPS, secure hosting, regular database backup ও server monitoring সেটআপ করতে হবে।
- bKash/Nagad/SSLCommerz-এর live payment চালু করতে merchant account ও official API integration প্রয়োজন। এখন checkout-এ COD এবং manual payment choice আছে; অনলাইন payment স্বয়ংক্রিয়ভাবে collect হয় না।
- Courier API integration, SMS/WhatsApp notifications, email receipts, password reset, admin staff roles/permissions, audit log এবং stronger rate limiting এখনো যোগ করা হয়নি।
- Product image URL দিয়ে দেওয়া যায়; server upload endpoint-ও আছে, তবে admin UI-তে upload picker এখনো যুক্ত করা হয়নি।
- Admin session security-র জন্য production-এ `NODE_ENV=production`, HTTPS ও strong `SESSION_SECRET` ব্যবহার করুন।
- Sample product images internet-hosted; এগুলো নিজের অনুমোদিত Qafila product images দিয়ে বদলান।

## Database
প্রথম চালু হলে `qafila.sqlite` এবং session database তৈরি হবে। Database file নিয়মিত backup রাখুন।
