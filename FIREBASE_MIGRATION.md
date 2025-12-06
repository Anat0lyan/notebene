# Миграция на Firebase - Описание изменений

## Обзор

Приложение было полностью переписано для работы с Firebase вместо PostgreSQL + Express API.

## Основные изменения

### 1. Аутентификация
- **Было**: JWT токены через Express API (`/api/auth/login`, `/api/auth/register`)
- **Стало**: Firebase Authentication (email/password)
- **Файлы**: 
  - `client/src/stores/auth.js` - переписан для Firebase Auth
  - `client/src/views/Login.vue` - изменен на email вместо username

### 2. База данных
- **Было**: PostgreSQL с таблицами `users`, `notes`, `tags`, `tasks`, `note_tags`
- **Стало**: Firestore с коллекциями:
  - `notes` - заметки пользователей
  - `notes/{noteId}/tags` - подколлекция тегов для каждой заметки
  - `tags` - глобальная коллекция тегов
  - `tasks` - задачи

### 3. API
- **Было**: REST API через Express (`/api/notes`, `/api/tags`, `/api/tasks`)
- **Стало**: Прямая работа с Firestore через Firebase SDK
- **Файлы**: 
  - `client/src/stores/notes.js` - переписан для Firestore
  - `client/src/stores/tasks.js` - переписан для Firestore
  - `client/src/services/api.js` - больше не используется (можно удалить)

### 4. Структура данных

#### Notes (Заметки)
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

#### Tags (Теги)
Основная коллекция:
```javascript
{
  userId: string,
  name: string,
  color: string | null,
  createdAt: Timestamp
}
```

Подколлекция в заметках (`notes/{noteId}/tags`):
```javascript
{
  tagId: string,
  name: string,
  color: string | null
}
```

#### Tasks (Задачи)
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

### 5. Типы данных
- **ID**: Изменены с `number` на `string` (Firestore использует строковые ID)
- **Файл**: `client/src/types/index.ts` - обновлены интерфейсы

### 6. Безопасность
- **Было**: JWT middleware на сервере
- **Стало**: Firestore Security Rules (`firestore.rules`)
- Правила гарантируют, что пользователи могут видеть/редактировать только свои данные

### 7. Конфигурация
- **Новые файлы**:
  - `firebase.json` - конфигурация Firebase
  - `.firebaserc` - настройки проекта
  - `firestore.rules` - правила безопасности
  - `firestore.indexes.json` - индексы (пока пустой)
  - `client/src/config/firebase.js` - инициализация Firebase

### 8. Деплой
- **Было**: Отдельный сервер Express
- **Стало**: Firebase Hosting (статический хостинг)
- **Сборка**: `client/dist` → Firebase Hosting

## Измененные файлы

### Клиент
- ✅ `client/package.json` - добавлен Firebase SDK, удален axios
- ✅ `client/src/stores/auth.js` - переписан для Firebase Auth
- ✅ `client/src/stores/notes.js` - переписан для Firestore
- ✅ `client/src/stores/tasks.js` - переписан для Firestore
- ✅ `client/src/config/firebase.js` - новый файл
- ✅ `client/src/views/Login.vue` - email вместо username
- ✅ `client/src/router/index.js` - проверка через `user` вместо `token`
- ✅ `client/src/App.vue` - удалена логика с токенами
- ✅ `client/src/components/NoteTasks.vue` - обновлен для Firestore
- ✅ `client/src/components/TaskForm.vue` - обновлен для строковых ID
- ✅ `client/src/types/index.ts` - обновлены типы

### Конфигурация проекта
- ✅ `firebase.json` - новый
- ✅ `.firebaserc` - новый
- ✅ `firestore.rules` - новый
- ✅ `firestore.indexes.json` - новый

## Удаленные/неиспользуемые файлы

Следующие файлы больше не нужны (но оставлены для справки):
- `server/` - весь сервер Express больше не используется
- `client/src/services/api.js` - больше не используется

## Миграция данных

Если у вас есть данные в старой PostgreSQL базе, вам нужно будет создать скрипт миграции. Примерная структура:

1. Экспорт данных из PostgreSQL
2. Преобразование в формат Firestore
3. Импорт в Firestore через Firebase Admin SDK

## Важные замечания

1. **Email вместо Username**: Пользователи теперь регистрируются с email
2. **Строковые ID**: Все ID теперь строки, а не числа
3. **Индексы**: Firestore может потребовать создания индексов для сложных запросов
4. **Лимиты**: Обратите внимание на [лимиты Firestore](https://firebase.google.com/docs/firestore/quotas)
5. **Офлайн режим**: Firestore поддерживает офлайн режим из коробки

## Следующие шаги

1. Создайте проект в Firebase Console
2. Настройте переменные окружения (см. `QUICK_START_FIREBASE.md`)
3. Деплойте приложение (см. `FIREBASE_DEPLOY.md`)

