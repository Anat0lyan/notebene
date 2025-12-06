# Команды для деплоя на Render.com

## Проблема

При деплое возникает ошибка, что статические файлы не найдены, потому что фронтенд не собирается перед запуском сервера.

## Решение

### Обновите команду деплоя в Render.com

Используйте эту команду в настройках Build Command:

```bash
cd client && npm install && npm run build && cd ../server && npm install --production=false && npm run build
```

И Start Command:

```bash
cd server && NODE_ENV=production npm start
```

### Или одной командой (Build & Start)

```bash
cd client && npm install && npm run build && cd ../server && npm install --production=false && npm run build && NODE_ENV=production npm start
```

## Структура путей

После компиляции:
- Backend: `server/dist/index.js`
- Frontend: `client/dist/`
- Путь к статике: `server/dist/` → `../` → `server/` → `../` → корень → `client/dist/`

Путь настроен правильно: `path.resolve(__dirname, '..', '..', 'client', 'dist')`

## Переменные окружения

Убедитесь, что установлены:
- `NODE_ENV=production` (или `SERVE_STATIC=true`)
- Все переменные для БД (DB_HOST, DB_USER, и т.д.)
- `JWT_SECRET`

## Проверка

После деплоя проверьте:
1. API: `curl https://your-app.onrender.com/api/health`
2. Frontend: Откройте `https://your-app.onrender.com` в браузере



