#!/bin/bash

# Скрипт для полной сборки проекта
# Собирает frontend и backend

set -e

echo "🔨 Начинаем сборку проекта..."

# Сборка фронтенда
echo "📦 Собираем фронтенд..."
cd client
npm install
npm run build
cd ..

# Сборка бэкенда
echo "⚙️  Собираем бэкенд..."
cd server
npm install --production=false
npm run build
cd ..

echo "✅ Сборка завершена!"
echo ""
echo "Для запуска:"
echo "  cd server"
echo "  npm start"
echo ""
echo "Или установите переменную окружения SERVE_STATIC=true для отдачи статики:"
echo "  SERVE_STATIC=true npm start"

