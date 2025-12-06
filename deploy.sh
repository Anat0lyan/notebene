#!/bin/bash
# Скрипт для деплоя - собирает фронтенд и бэкенд, затем запускает сервер

set -e

echo "🔨 Начинаем деплой..."

# Сборка фронтенда
echo "📦 Собираем фронтенд..."
cd client
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build
cd ..

# Сборка бэкенда
echo "⚙️  Собираем бэкенд..."
cd server
if [ ! -d "node_modules" ]; then
  npm install --production=false
fi
npm run build

# Запуск сервера
echo "🚀 Запускаем сервер..."
NODE_ENV=production npm start



