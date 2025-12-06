# Миграция на TypeScript

Проект был мигрирован на TypeScript. Следуйте инструкциям ниже для установки и запуска.

## Backend

### Установка зависимостей

```bash
cd server
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Команда `dev` использует `tsx watch` для автоматической перекомпиляции при изменениях.

### Сборка для production

```bash
npm run build
npm start
```

## Frontend

### Установка зависимостей

```bash
cd client
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

TypeScript будет проверяться автоматически через Vite и vue-tsc.

## Структура типов

### Backend типы

- `/server/types/index.ts` - все типы и интерфейсы для backend
- Включает модели данных: User, Tag, Note, Task
- Типы для API запросов и ответов
- Типы для Express middleware

### Frontend типы

- `/client/src/types/index.ts` - все типы для frontend
- Модели данных синхронизированы с backend
- Типы для API запросов

## Следующие шаги

1. **Установите зависимости**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Обновите оставшиеся файлы** (постепенная миграция):
   - Backend routes нужно переименовать `.js` -> `.ts` и добавить типы
   - Frontend stores и components можно постепенно переводить на TypeScript

3. **Проверьте работоспособность**:
   - Запустите backend: `cd server && npm run dev`
   - Запустите frontend: `cd client && npm run dev`

## Примечания

- TypeScript настроен в strict mode для максимальной безопасности типов
- Все существующие `.js` файлы продолжают работать
- Миграция может быть постепенной - можно смешивать `.js` и `.ts` файлы



