# Быстрый старт с Firebase

## 1. Установка Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 2. Создание проекта Firebase

1. Перейдите на https://console.firebase.google.com/
2. Создайте новый проект
3. Включите Authentication → Email/Password
4. Создайте Firestore Database (Production или Test режим)

## 3. Настройка проекта

```bash
# В корне проекта
firebase init

# Выберите:
# - Firestore
# - Hosting
# - Используйте существующий проект
# - Укажите client/dist как публичную директорию
```

## 4. Получение конфигурации Firebase

1. В Firebase Console → Project Settings → General
2. Найдите секцию "Your apps" → Web app (</>)
3. Скопируйте значения из `firebaseConfig`

## 5. Настройка переменных окружения

Создайте файл `client/.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 6. Установка зависимостей

```bash
cd client
npm install
```

## 7. Сборка и деплой

```bash
# Сборка
cd client
npm run build

# Деплой правил Firestore
firebase deploy --only firestore:rules

# Деплой хостинга
firebase deploy --only hosting
```

## 8. Готово!

Ваше приложение будет доступно по адресу:
`https://your-project-id.web.app`

## Важные изменения

- ✅ Аутентификация теперь через email/password (не username)
- ✅ Все данные хранятся в Firestore
- ✅ Не требуется отдельный сервер - все работает через Firebase
- ✅ Правила безопасности настроены автоматически

## Локальная разработка

```bash
cd client
npm run dev
```

Приложение будет доступно на http://localhost:5173

