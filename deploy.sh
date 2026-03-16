#!/bin/bash
# ============================================
# Uchqun.ai — VPS Deploy Script
# Bu skriptni VPS da ishga tushiring:
#   curl -sL https://raw.githubusercontent.com/Mirfayz1993/uchqunai/master/deploy.sh | bash
# ============================================

set -e

echo "🚀 Uchqun.ai deploy boshlanmoqda..."

# 1. Tizimni yangilash
echo "📦 Tizim yangilanmoqda..."
apt update && apt upgrade -y

# 2. Node.js 20 o'rnatish
echo "📦 Node.js o'rnatilmoqda..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 3. PostgreSQL o'rnatish
echo "📦 PostgreSQL o'rnatilmoqda..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
fi
systemctl enable postgresql
systemctl start postgresql

# 4. PostgreSQL baza yaratish
echo "🗄️ Baza yaratilmoqda..."
sudo -u postgres psql -c "CREATE USER uchqun WITH PASSWORD 'uchqun2026';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE uchqunai OWNER uchqun;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE uchqunai TO uchqun;" 2>/dev/null || true

# 5. PM2 o'rnatish
echo "📦 PM2 o'rnatilmoqda..."
npm install -g pm2

# 6. Loyihani clone qilish
echo "📥 Loyiha yuklanmoqda..."
cd /root
if [ -d "uchqunai" ]; then
    cd uchqunai
    git pull origin master
else
    git clone https://github.com/Mirfayz1993/uchqunai.git
    cd uchqunai
fi

# 7. .env fayl yaratish
echo "⚙️ .env sozlanmoqda..."
cat > .env << 'ENVEOF'
# Database (VPS PostgreSQL)
DATABASE_URL="postgresql://uchqun:uchqun2026@localhost:5432/uchqunai?sslmode=disable"

# NextAuth
AUTH_SECRET="uchqunai-production-secret-2026-secure-key"
NEXTAUTH_URL="http://194.163.157.44:3000"

# AI Models — VPS da qo'lda qo'shing
GEMINI_API_KEY="your-gemini-api-key-here"
GROQ_API_KEY="your-groq-api-key-here"
ENVEOF

# 8. Dependencies o'rnatish
echo "📦 Dependencies o'rnatilmoqda..."
npm install

# 9. Prisma generate + migrate
echo "🗄️ Baza migratsiya qilinmoqda..."
npx prisma generate
npx prisma db push --accept-data-loss

# 10. Seed — botlarni kiritish
echo "🤖 Botlar kiritilmoqda..."
npx tsx prisma/seed.ts

# 11. Build
echo "🔨 Build qilinmoqda..."
npm run build

# 12. PM2 bilan ishga tushirish
echo "🚀 Server ishga tushirilmoqda..."
pm2 delete uchqunai 2>/dev/null || true
pm2 start npm --name "uchqunai" -- start
pm2 save
pm2 startup

# 13. Firewall
echo "🔒 Firewall sozlanmoqda..."
ufw allow 22
ufw allow 3000
ufw --force enable 2>/dev/null || true

echo ""
echo "✅ ============================================"
echo "✅ Uchqun.ai muvaffaqiyatli deploy qilindi!"
echo "✅ ============================================"
echo ""
echo "🌐 Sahifa: http://194.163.157.44:3000"
echo ""
echo "📋 Foydali buyruqlar:"
echo "   pm2 logs uchqunai    — loglarni ko'rish"
echo "   pm2 restart uchqunai — qayta ishga tushirish"
echo "   pm2 status           — holat"
echo ""
