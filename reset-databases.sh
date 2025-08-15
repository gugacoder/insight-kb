#!/bin/bash
# reset-databases.sh

echo "💥 RESET COMPLETO - Apagando TUDO..."

cd ./api

# Apagar MongoDB completamente
echo "📦 Apagando MongoDB (InsightKB)..."
node -e "
const mongoose = require('mongoose');
async function dropMongo() {
  try {
    await mongoose.connect('mongodb://mongo:27017/InsightKB');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ MongoDB InsightKB APAGADO completamente');
    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Erro MongoDB:', error.message);
  }
}
dropMongo();
"

# Apagar Redis completamente
echo "🔴 Apagando Redis completamente..."
node -e "
const redis = require('redis');
async function flushRedis() {
  try {
    const client = redis.createClient({ url: 'redis://redis:6379' });
    await client.connect();
    await client.flushAll();
    console.log('✅ Redis APAGADO completamente');
    await client.quit();
  } catch (error) {
    console.log('❌ Erro Redis:', error.message);
  }
}
flushRedis();
" --experimental-modules

echo ""
echo "🎯 SISTEMA COMPLETAMENTE RESETADO!"
echo "🚀 Agora você pode testar o 'first run' do zero"
echo ""
echo "Para testar: npm run backend:dev"
