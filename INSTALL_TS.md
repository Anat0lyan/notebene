# Установка TypeScript зависимостей

## Backend

```bash
cd server
npm install
```

Устанавливает:
- `typescript` - компилятор TypeScript
- `tsx` - для запуска TypeScript файлов в dev режиме
- `@types/*` - типы для Express, Node.js, pg, bcryptjs, jsonwebtoken

## Frontend

```bash
cd client
npm install
```

Устанавливает:
- `typescript` - компилятор TypeScript
- `vue-tsc` - проверка типов для Vue компонентов

## Запуск после установки

### Backend
```bash
cd server
npm run dev  # Использует tsx watch для авто-перезагрузки
```

### Frontend
```bash
cd client
npm run dev  # Vite с TypeScript поддержкой
```

## Структура

### Созданные файлы

**Backend:**
- `server/tsconfig.json` - конфигурация TypeScript
- `server/types/index.ts` - все типы и интерфейсы
- `server/config/database.ts` - типизированная конфигурация БД
- `server/index.ts` - типизированный входной файл
- `server/middleware/auth.ts` - типизированный middleware

**Frontend:**
- `client/tsconfig.json` - конфигурация TypeScript
- `client/tsconfig.node.json` - конфигурация для Node.js окружения
- `client/vite.config.ts` - типизированная конфигурация Vite
- `client/src/types/index.ts` - все типы для frontend
- `client/src/env.d.ts` - декларации типов для Vue

## Миграция файлов

Остальные файлы можно постепенно переводить на TypeScript:
- Переименовать `.js` -> `.ts`
- Добавить типы к функциям и переменным
- Импортировать типы из `types/index.ts`

Файлы `.js` продолжают работать, миграция может быть постепенной.

