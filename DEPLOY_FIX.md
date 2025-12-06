# Исправление деплоя

## Проблема

При деплое возникает ошибка: статические файлы не найдены, потому что:
1. Фронтенд не собирается перед запуском сервера
2. Путь к статическим файлам может быть неправильным

## Решение

### 1. Обновите команду деплоя

Команда должна сначала собрать фронтенд, затем бэкенд:

```bash
# Полный деплой
cd client && npm install && npm run build && cd ../server && npm install --production=false && npm run build && NODE_ENV=production npm start
```

Или раздельно:

```bash
# 1. Собрать фронтенд
cd client
npm install
npm run build

# 2. Собрать и запустить бэкенд
cd ../server
npm install --production=false
npm run build
NODE_ENV=production npm start
```

### 2. Проверка пути к статике

Путь к статическим файлам настроен правильно:
- После компиляции: `server/dist/index.js`
- Путь к статике: `../../client/dist` (2 уровня вверх от `server/dist/`)

### 3. Переменные окружения

Убедитесь, что установлена переменная:
- `NODE_ENV=production` или
- `SERVE_STATIC=true`

## Для Render.com

Используйте эту команду в настройках деплоя:

```bash
cd client && npm install && npm run build && cd ../server && npm install --production=false && npm run build && NODE_ENV=production npm start
```

Или создайте скрипт в корне проекта `deploy.sh`:

```bash
#!/bin/bash
set -e

# Build frontend
cd client
npm install
npm run build
cd ..

# Build and start backend
cd server
npm install --production=false
npm run build
NODE_ENV=production npm start
```



