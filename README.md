# Notabene - Система управления заметками

Веб-приложение для управления заметками с тегами, поиском и фильтрацией.

## ⚠️ Миграция на Firebase

**Приложение было переписано для работы с Firebase!**

Теперь используется:
- **Firebase Authentication** для аутентификации (email/password)
- **Firestore** для хранения данных
- **Firebase Hosting** для деплоя

**Для деплоя на Firebase см. [QUICK_START_FIREBASE.md](./QUICK_START_FIREBASE.md) или [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md)**

---

## Технологии (старая версия с PostgreSQL)

- **Frontend**: Vue 3 (Composition API), Vue Router, Pinia, Vite
- **Backend**: Express.js, Node.js
- **База данных**: PostgreSQL
- **Аутентификация**: JWT токены

## Установка

### Требования

- Node.js (v16 или выше)
- PostgreSQL (v12 или выше)

### Настройка базы данных PostgreSQL

1. Установите PostgreSQL, если еще не установлен:
   ```bash
   # macOS (Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Создайте базу данных:
   ```bash
   # Войдите в PostgreSQL
   psql -U postgres
   
   # Создайте базу данных
   CREATE DATABASE notabene;
   
   # Выйдите из psql
   \q
   ```

3. Создайте файл `.env` в директории `server/` со следующим содержимым:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=notabene
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-secret-key-change-in-production
   ```
   
   Замените `your_password` на ваш пароль PostgreSQL и `your-secret-key-change-in-production` на случайную строку для JWT.

### Backend

```bash
cd server
npm install
npm run dev
```

Сервер запустится на порту 3000. База данных будет автоматически инициализирована при первом запуске.

### Frontend

```bash
cd client
npm install
npm run dev
```

Приложение откроется на http://localhost:5173

**Важно:** Убедитесь, что backend сервер запущен на порту 3000 перед запуском frontend.

### Проверка подключения

После запуска обоих серверов, вы можете проверить подключение:

1. Откройте консоль браузера (F12)
2. Проверьте, что запросы идут на `/api/*`
3. Если видите ошибки подключения, проверьте:
   - Запущен ли backend сервер на порту 3000
   - Правильно ли настроены переменные окружения в `server/.env`
   - Работает ли база данных PostgreSQL

### Если прокси не работает

Если запросы не проксируются через Vite, вы можете настроить прямой доступ к API:

1. Создайте файл `client/.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

2. Перезапустите dev сервер Vite

## Использование

### Тестовый аккаунт
- **Логин**: admin
- **Пароль**: admin

### Функционал

- ✅ CRUD операции для заметок
- ✅ Управление тегами (создание "на лету")
- ✅ Поиск по тексту
- ✅ Фильтрация по тегам
- ✅ Сортировка заметок (по дате, алфавиту)
- ✅ Избранное
- ✅ Архивация

## Деплой (Production)

Backend автоматически отдает статические файлы фронтенда в production режиме.

### Полный деплой (Backend отдает Frontend)

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
```

Или используйте скрипт:
```bash
./build.sh
cd server && NODE_ENV=production npm start
```

**Результат:** Один сервер на порту 3000 обслуживает и API (`/api/*`) и фронтенд.

Подробные инструкции по деплою: см. [DEPLOY.md](./DEPLOY.md) или краткую шпаргалку [DEPLOY_COMMANDS.md](./DEPLOY_COMMANDS.md)

## Структура проекта

```
├── client/          # Vue.js фронтенд (TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── router/
│   │   ├── services/
│   │   └── types/
├── server/          # Express.js бэкенд (TypeScript)
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── types/
│   └── dist/        # Скомпилированные JS файлы (после сборки)
```

