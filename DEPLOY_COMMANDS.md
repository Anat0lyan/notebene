# Команды для деплоя - Краткая шпаргалка

## 🚀 Быстрый старт (Backend отдает Frontend)

### Полный деплой - Backend с Frontend

```bash
# 1. Собрать фронтенд
cd client && npm install && npm run build

# 2. Собрать и запустить бэкенд (будет отдавать статику)
cd ../server && npm install --production=false && npm run build && NODE_ENV=production npm start
```

Или используйте скрипт:
```bash
./build.sh
cd server && NODE_ENV=production npm start
```

**Результат:** Один сервер на порту 3000 обслуживает и API (`/api/*`) и фронтенд.

## 📋 Деплой по отдельности

### Backend только (без фронтенда)
```bash
cd server && npm install --production=false && npm run build && npm start
```

### Frontend отдельно (для разработки)
```bash
cd client && npm install && npm run dev
```

## 🔧 Development режим

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 📝 Важные моменты

1. **Backend требует dev зависимости** для сборки TypeScript:
   - Используйте `npm install --production=false` или просто `npm install`
   - `npm run build` компилирует TypeScript в JavaScript
   - `npm start` запускает скомпилированный код из `dist/`

2. **Frontend создает статические файлы**:
   - `npm run build` создает готовые HTML/CSS/JS в `client/dist/`
   - Эти файлы можно отдавать через nginx/apache/CDN

3. **Переменные окружения**:
   - Backend: создайте `server/.env` перед запуском
   - Frontend: создайте `client/.env.production` если API на другом домене

## 🐳 Docker (опционально)

См. `DEPLOY.md` для полной инструкции по Docker деплою.

## ✅ Проверка после деплоя

```bash
# Backend health check
curl http://localhost:3000/api/health

# Должен вернуть: {"status":"ok"}
```

