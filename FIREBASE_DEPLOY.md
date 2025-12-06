# Инструкция по деплою на Firebase

Это приложение было переписано для работы с Firebase. Оно использует:
- **Firebase Authentication** для аутентификации пользователей
- **Firestore** для хранения данных (заметки, теги, задачи)
- **Firebase Hosting** для хостинга фронтенда

## Предварительные требования

1. Установите Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Войдите в Firebase:
```bash
firebase login
```

3. Создайте новый проект в [Firebase Console](https://console.firebase.google.com/)

## Настройка проекта

1. Инициализируйте Firebase в корне проекта:
```bash
firebase init
```

Выберите:
- ✅ Firestore
- ✅ Hosting
- ✅ Functions (опционально)

2. При инициализации укажите:
   - Использовать существующий проект или создать новый
   - Выберите ваш проект
   - Для Firestore: используйте существующие правила (firestore.rules)
   - Для Hosting: укажите `client/dist` как публичную директорию
   - Для Hosting: настройте как SPA (single-page app)

3. Обновите `.firebaserc` с вашим project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Настройка Firebase Console

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Включите **Authentication**:
   - Перейдите в Authentication → Sign-in method
   - Включите **Email/Password** провайдер
4. Создайте Firestore Database:
   - Перейдите в Firestore Database
   - Создайте базу данных в режиме **Production** или **Test**
   - Правила безопасности уже настроены в `firestore.rules`

## Настройка переменных окружения

1. Создайте файл `.env` в директории `client/`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

2. Получите эти значения из Firebase Console:
   - Перейдите в Project Settings → General
   - Найдите секцию "Your apps" и нажмите на иконку веб-приложения (</>)
   - Скопируйте значения из `firebaseConfig`

## Установка зависимостей

1. Установите зависимости клиента:
```bash
cd client
npm install
```

## Сборка и деплой

1. Соберите клиент:
```bash
cd client
npm run build
```

2. Деплой Firestore правил:
```bash
firebase deploy --only firestore:rules
```

3. Деплой хостинга:
```bash
firebase deploy --only hosting
```

Или деплой всего сразу:
```bash
firebase deploy
```

## Структура данных в Firestore

### Коллекция `notes`
```javascript
{
  userId: string,
  title: string,
  content: string,
  isArchived: boolean,
  isFavorite: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Подколлекция `notes/{noteId}/tags`
```javascript
{
  tagId: string,
  name: string,
  color: string | null
}
```

### Коллекция `tags`
```javascript
{
  userId: string,
  name: string,
  color: string | null,
  createdAt: Timestamp
}
```

### Коллекция `tasks`
```javascript
{
  userId: string,
  title: string,
  description: string | null,
  dueDate: Timestamp | null,
  priority: 'low' | 'medium' | 'high',
  noteId: string | null,
  completed: boolean,
  recurringType: 'none' | 'daily' | 'weekly' | 'monthly',
  recurringInterval: number,
  reminder: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Важные замечания

1. **Аутентификация**: Приложение теперь использует email/password вместо username/password
2. **Безопасность**: Firestore rules настроены так, что пользователи могут видеть и редактировать только свои данные
3. **Индексы**: Если вы используете сложные запросы, возможно потребуется создать индексы в Firestore Console
4. **Лимиты**: Обратите внимание на [лимиты Firestore](https://firebase.google.com/docs/firestore/quotas)

## Локальная разработка

Для локальной разработки используйте Firebase Emulator Suite:

```bash
firebase emulators:start
```

И обновите конфигурацию Firebase в `client/src/config/firebase.js` для использования эмуляторов.

## Миграция данных (опционально)

Если у вас есть данные в старой PostgreSQL базе, вам нужно будет создать скрипт миграции для переноса данных в Firestore. Это выходит за рамки данной инструкции.

