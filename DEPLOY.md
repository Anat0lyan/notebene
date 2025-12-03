# Инструкция по деплою приложения

## Подготовка к деплою

### 1. Полный деплой (Backend отдает Frontend)

Backend автоматически отдает статические файлы фронтенда в production режиме.

```bash
# 1. Соберите фронтенд
cd client
npm install
npm run build

# 2. Соберите и запустите бэкенд
cd ../server
npm install --production=false
npm run build
npm start
```

Или используйте скрипт сборки:
```bash
./build.sh
cd server
npm start
```

**Важно:** Backend отдает статику только если:
- `NODE_ENV=production` или
- `SERVE_STATIC=true`

### 2. Backend только (без фронтенда)

Если нужно запустить только API без фронтенда:

```bash
cd server
npm install --production=false
npm run build
npm start
```

### 3. Frontend отдельно (для разработки)

Для разработки фронтенд можно запускать отдельно:

```bash
cd client
npm install
npm run dev
```

### 4. Полный деплой (старый способ - раздельно)

```bash
# Backend
cd server
npm install --production=false
npm run build
npm start

# Frontend (в другом терминале или после остановки backend)
cd client
npm install
npm run build
```

## Переменные окружения для Production

### Backend (`server/.env`)

```env
PORT=3000
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=notabene
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your-very-secure-secret-key-min-32-chars
```

**Важно:** В production обязательно:
- Используйте надежный `JWT_SECRET` (минимум 32 символа)
- Не храните `.env` файл в системе контроля версий
- Используйте переменные окружения сервера вместо файла `.env`

### Frontend

Если frontend и backend на разных доменах, создайте `client/.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Команды для разных окружений

### Development (разработка)

```bash
# Backend (API только)
cd server
npm install
npm run dev

# Frontend (отдельно, подключается к backend на порту 3000)
cd client
npm install
npm run dev
```

### Production (продакшн) - Backend отдает Frontend

```bash
# 1. Собрать фронтенд
cd client
npm install
npm run build

# 2. Собрать и запустить бэкенд (будет отдавать статику)
cd ../server
npm install --production=false
npm run build
NODE_ENV=production npm start

# Или использовать скрипт сборки
./build.sh
cd server && NODE_ENV=production npm start
```

**Результат:** Один сервер на порту 3000 обслуживает и API (`/api/*`) и фронтенд.

## Структура после сборки

После сборки создаются:

- **Backend**: `server/dist/` - скомпилированные JavaScript файлы
- **Frontend**: `client/dist/` - статические HTML/CSS/JS файлы

## Деплой на различные платформы

### Деплой на сервер (VPS/Dedicated)

#### Backend

```bash
# 1. Клонируйте репозиторий
git clone <your-repo-url>
cd notabene/server

# 2. Установите зависимости
npm install --production=false

# 3. Создайте .env файл
nano .env  # Или используйте ваш редактор

# 4. Соберите проект
npm run build

# 5. Запустите через PM2 (рекомендуется)
npm install -g pm2
pm2 start dist/index.js --name notabene-api

# Или через systemd/nohup
nohup node dist/index.js > server.log 2>&1 &
```

#### Frontend

```bash
# 1. Перейдите в client
cd ../client

# 2. Установите зависимости
npm install

# 3. Создайте .env.production (если нужно)
echo "VITE_API_BASE_URL=https://api.yourdomain.com/api" > .env.production

# 4. Соберите
npm run build

# 5. Настройте nginx/apache для отдачи статических файлов из dist/
# Пример nginx конфигурации:
# server {
#     listen 80;
#     root /path/to/notabene/client/dist;
#     index index.html;
#     
#     location / {
#         try_files $uri $uri/ /index.html;
#     }
#     
#     location /api {
#         proxy_pass http://localhost:3000;
#     }
# }
```

### Docker (рекомендуется)

Создайте `docker-compose.yml` в корне проекта:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: notabene
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: notabene
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - db

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Проверка работоспособности

### Backend

```bash
# Проверьте health endpoint
curl http://localhost:3000/api/health

# Ожидаемый ответ:
# {"status":"ok"}
```

### Frontend

```bash
# Откройте в браузере
http://localhost:5173  # dev режим
# или
http://localhost       # production после сборки
```

## Полезные команды

### Проверка версии Node.js

```bash
node --version  # Должен быть v16 или выше
```

### Проверка PostgreSQL

```bash
psql -U postgres -c "SELECT version();"
```

### Просмотр логов (если используете PM2)

```bash
pm2 logs notabene-api
```

## Troubleshooting

### Ошибка "Cannot find module"

Убедитесь, что:
1. Все зависимости установлены: `npm install`
2. Backend собран: `npm run build`
3. Запускается правильный файл: `node dist/index.js`

### Ошибка подключения к БД

Проверьте:
1. PostgreSQL запущен
2. Переменные окружения в `.env` правильные
3. База данных создана: `CREATE DATABASE notabene;`

### Frontend не подключается к API

1. Проверьте `VITE_API_BASE_URL` в `.env.production`
2. Убедитесь, что backend доступен
3. Проверьте CORS настройки в backend

