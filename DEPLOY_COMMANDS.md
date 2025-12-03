# Команды для деплоя - Краткая шпаргалка

## 🚀 Быстрый старт

### Backend (Production)

```bash
cd server
npm install --production=false
npm run build
npm start
```

### Frontend (Production)

```bash
cd client
npm install
npm run build
# Файлы в client/dist/ готовы к деплою
```

## 📋 Полный деплой (одной строкой)

### Backend
```bash
cd server && npm install --production=false && npm run build && npm start
```

### Frontend
```bash
cd client && npm install && npm run build
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

