# ESLint Disable Audit

Документация всех мест в проекте, где используется `eslint-disable` для правил `@typescript-eslint/no-unsafe-*`.

**Дата создания:** 13 декабря 2025  
**Последнее обновление:** 13 декабря 2025  
**Всего файлов:** 19  
**Статус:** 🟢 6 файлов исправлено | 🟡 13 файлов осталось

---

## ✅ Исправленные файлы (без eslint-disable)

### 1. `auth/strategies/jwt.strategy.ts`
**Статус:** ✅ Исправлено  
**Что было:** `no-unsafe-return` при извлечении токена из cookies  
**Решение:** Типизирован request объект и возвращаемое значение:
```typescript
(request: { cookies?: Record<string, string> }): string | null => {
  const token = request?.cookies?.['access_token'];
  return typeof token === 'string' ? token : null;
}
```

### 2. `common/ai-video.service.ts`
**Статус:** ✅ Исправлено  
**Что было:** `no-unsafe-member-access` при обращении к `error.message`  
**Решение:** Type guard для проверки Error:
```typescript
const errorMessage = error instanceof Error ? error.message : 'Unknown error';
```

### 3. `storage/storage.service.ts`
**Статус:** ✅ Исправлено (2 места)  
**Что было:** `no-unsafe-member-access` при обращении к `error.message` и `error.stack`  
**Решение:** Type guards для обоих полей

### 4. `config/jwt-validation.constants.ts`
**Статус:** ✅ Исправлено  
**Что было:** `no-unsafe-argument` при проверке forbidden values  
**Решение:** Правильный type assertion: `as typeof JWT_SECRET_FORBIDDEN_VALUES[number]`

### 5. `projects/projects.service.ts`
**Статус:** ✅ Исправлено  
**Что было:** `no-unsafe-assignment`, `no-unsafe-member-access` при работе с `meta` полями  
**Решение:** 
- Типизирован `meta` параметр: `Record<string, unknown> = {}`
- Изменён тип в Asset entity: `meta: Record<string, unknown> | null`
- Type narrowing для prompt: `const prompt = asset.meta?.['prompt']; if (typeof prompt === 'string')`

### 6. `migrations/1764028675476-AddUniqueConstraintToGoogleId.ts`
**Статус:** ✅ Исправлено  
**Что было:** `no-unsafe-assignment`, `no-unsafe-member-access` при работе с `queryRunner.query()`  
**Решение:** Type assertion для результата query:
```typescript
const constraintExists = (await queryRunner.query(`...`)) as unknown[];
```

---

## 🔴 Сложность: Высокая (требует значительной работы)

### 1. `queues/processors/video.processor.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`  
**Причина:** Множественные обращения к API responses и динамическим полям  
**Примеры:**
- Работа с Kling API responses (task_id, video_url)
- Обращение к полям settings объекта
- toString() на Buffer объектах

**Рекомендация:** Создать типы для API responses:
```typescript
interface KlingApiResponse {
  data: {
    task_id: string;
    video_url?: string;
  };
}
```

**Оценка времени:** 30-45 минут

---

### 2. `queues/processors/background.processor.ts`
**Правила:** `no-unsafe-member-access`  
**Причина:** Работа с API responses от Photoroom и других сервисов  
**Примеры:**
- response.data.length проверки
- Обращения к полям результатов API

**Рекомендация:** Типизировать API responses

**Оценка времени:** 30 минут

---

### 3. `queues/processors/image.processor.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`  
**Причина:** Работа с image API и проверка response.startsWith()  
**Примеры:**
- Проверка формата URL
- Работа с Buffer объектами

**Рекомендация:** Типизировать responses и добавить type guards

**Оценка времени:** 20 минут

---

### 4. `config/env.validation.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`  
**Причина:** Работа с Joi validation и трансформациями строк  
**Примеры:**
- String.prototype.split/map/trim на value: any
- Манипуляции с массивами из env variables

**Рекомендация:** Типизировать Joi transform функции или добавить type assertions

**Оценка времени:** 30 минут

---

## 🟡 Сложность: Средняя

### 5. `auth/auth.controller.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`, `no-unsafe-argument`  
**Причина:** Работа с @Req() и @Res() декораторами NestJS (типы any)  
**Места (примерно 15-20):**
- res.cookie() вызовы
- res.json() вызовы
- req.cookies доступ
- req.user доступ

**Рекомендация:** Типизировать через:
```typescript
import { Request, Response } from 'express';

@Post('login')
async login(@Body() loginDto: LoginDto, @Res() res: Response) {
  // ...
}
```

**Оценка времени:** 15-20 минут

---

### 6. `auth/filters/oauth-exception.filter.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`  
**Причина:** Работа с exception объектом и response  
**Места:** 10-12 обращений к exception полям

**Рекомендация:** Типизировать exception и response

**Оценка времени:** 10 минут

---

### 7. `common/guards/frontend-auth.guard.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`  
**Причина:** Работа с request объектом из ExecutionContext  
**Места:** 3-4 места

**Рекомендация:** Типизировать request extraction

**Оценка времени:** 10 минут

---

### 8. `common/interceptors/http-logging.interceptor.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`  
**Причина:** Работа с ExecutionContext и response  
**Места:** 5-6 мест

**Рекомендация:** Типизировать context extraction

**Оценка времени:** 15 минут

---

### 9. `common/ai-text.service.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`  
**Причина:** Парсинг JSON из AI API (Gemini)  
**Места:** 10+ мест с обращениями к parsed JSON

**Рекомендация:** Создать интерфейсы для AI responses и использовать type guards:
```typescript
interface GeminiProductAnalysis {
  productName?: string;
  description?: string;
  usps?: string[];
  scenePrompt?: string;
  category?: string;
}

const parsed = JSON.parse(text) as unknown;
if (isGeminiProductAnalysis(parsed)) {
  // типизированная работа
}
```

**Оценка времени:** 20 минут

---

### 10. `common/tts.service.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`  
**Причина:** Работа с API responses от TTS сервисов  
**Места:** 3-4 места

**Рекомендация:** Типизировать API responses

**Оценка времени:** 10 минут

---

### 11. `projects/projects.controller.ts`
**Правила:** `no-unsafe-member-access`  
**Причина:** Доступ к req.requestId  
**Места:** 2 места

**Рекомендация:** Расширить Request тип с requestId полем

**Оценка времени:** 5 минут

---

### 12. `logger/logger.controller.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-return`  
**Причина:** Работа с динамическими логами из request body  
**Места:** 5-7 мест

**Рекомендация:** Типизировать log structure

**Оценка времени:** 15 минут

---

### 13. `main.ts`
**Правила:** `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-argument`  
**Причина:** Работа с app instance и logger  
**Места:** 8-10 мест

**Рекомендация:** Типизировать через NestExpressApplication

**Оценка времени:** 10 минут

---

## 🟢 Сложность: Низкая (Transform декораторы)

### 14-16. DTO файлы с Transform
**Файлы:**
- `projects/dto/create-project.dto.ts`
- `projects/dto/animate-video.dto.ts`
- `projects/dto/regenerate-background.dto.ts`

**Правила:** `no-unsafe-return`, `no-unsafe-call`, `no-unsafe-member-access`  
**Причина:** `@Transform()` декораторы используют `value.trim()` где value: any

**Рекомендация:** Типизировать transform функции:
```typescript
@Transform(({ value }: { value: unknown }) => 
  typeof value === 'string' ? value.trim() : value
)
```

**Оценка времени:** 5 минут на файл = 15 минут всего

---

## 🔵 Можно оставить (тесты и migrations)

### 17-18. Test файлы
**Файлы:**
- `projects/dto/create-project.dto.spec.ts`
- `projects/constants.spec.ts`

**Причина:** В тестах использование `any` допустимо для моков и тестовых данных

**Рекомендация:** Оставить как есть или добавить `// @ts-expect-error` с комментариями

---

### 19. Migration
**Файл:**
- `migrations/1765466016525-UpdateEmailIndex.ts`

**Причина:** TypeORM миграции работают с raw queries, типизация сложна

**Рекомендация:** Оставить как есть, миграции обычно пишутся один раз

---

## 📊 Статистика

| Категория | Файлов | Время (мин) | Приоритет |
|-----------|---------|-------------|-----------|
| ✅ Исправлено | 6 | - | Готово |
| 🔴 Сложные (API) | 4 | 110-135 | Высокий |
| 🟡 Средние (Controllers/Services) | 9 | 120-150 | Средний |
| 🟢 Простые (DTOs) | 3 | 15 | Высокий |
| 🔵 Тесты/Migrations | 3 | - | Низкий |
| **Итого** | **25** | **~5-6 часов** | |

## 🎯 Рекомендуемый план действий

### Фаза 1: Быстрые победы (20 мин)
1. DTO файлы (3 файла) - 15 минут
2. projects.controller.ts - 5 минут

### Фаза 2: Средняя сложность (2-3 часа)
1. auth.controller.ts - 20 минут
2. main.ts - 10 минут
3. Guards и Interceptors - 35 минут
4. Services (ai-text, tts) - 30 минут
5. Filters и logger - 25 минут

### Фаза 3: Сложные API processors (2-3 часа)
1. image.processor.ts - 20 минут
2. background.processor.ts - 30 минут
3. video.processor.ts - 45 минут
4. env.validation.ts - 30 минут

### Фаза 4: Опционально
- Тесты и migrations (можно оставить)

---

## 🔧 Альтернативное решение

Вместо исправления всего кода, можно настроить ESLint:

**eslint.config.mjs:**
```javascript
rules: {
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
}
```

**Плюсы:**
- 15 минут работы
- Видны предупреждения вместо ошибок
- Можно постепенно исправлять

**Минусы:**
- Снижение строгости типизации
- Потенциальные runtime ошибки

---

## 📝 Заметки

1. **Приоритет:** Начать с DTO и простых сервисов, затем контроллеры, последними - процессоры
2. **Паттерны:** Создать переиспользуемые типы для API responses
3. **Type Guards:** Везде где possible использовать `instanceof Error` и подобные проверки
4. **Тестирование:** После каждой категории запускать `npm run lint` и проверять работу

---

**Последнее обновление:** 13.12.2025  
**Автор:** Generated by AI Assistant
