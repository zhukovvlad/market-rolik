# Email/Password Authentication

## Обзор

Реализована полноценная система аутентификации по email и паролю в дополнение к существующей OAuth авторизации через Google.

## Backend

### API Эндпоинты

#### POST /auth/register
Регистрация нового пользователя по email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",      // optional
  "lastName": "Иванов"      // optional
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "credits": 10,
    "role": "USER"
  }
}
```

#### POST /auth/login
Вход пользователя по email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "credits": 10,
    "role": "USER"
  }
}
```

### Валидация

- **Email**: валидный формат email, приводится к нижнему регистру
- **Password**: минимум 6 символов, максимум 100
- **FirstName/LastName**: максимум 50 символов (опционально)

### Безопасность

- Пароли хешируются с помощью bcrypt (10 раундов salt)
- Email нормализуется (toLowerCase + trim) перед сохранением
- Уникальный индекс на LOWER(email) для case-insensitive проверки
- JWT токены в httpOnly cookies
- Refresh token rotation

## Frontend

### Компоненты

#### AuthDialog
Модальное окно с вкладками Login/Register.

**Props:**
- `open: boolean` - состояние открытия
- `onOpenChange: (open: boolean) => void` - callback при изменении
- `defaultTab?: "login" | "register"` - активная вкладка по умолчанию

#### LoginForm
Форма входа с полями email и password.

**Features:**
- Валидация на клиенте
- Опция "Войти через Google"
- Loading состояния
- Toast уведомления

#### RegisterForm
Форма регистрации с полями:
- Email (обязательно)
- Password (обязательно, минимум 6 символов)
- Confirm Password (обязательно)
- First Name (опционально)
- Last Name (опционально)

**Features:**
- Валидация совпадения паролей
- Валидация длины пароля
- Опция "Регистрация через Google"
- Loading состояния
- Toast уведомления

### Интеграция

В `Navbar` кнопки "Sign In" и "Get Started" открывают `AuthDialog` вместо перехода на отдельные страницы.

```tsx
const openAuthDialog = (tab: "login" | "register") => {
    setAuthDialogTab(tab);
    setAuthDialogOpen(true);
};
```

## Миграции

### UpdateEmailIndex (1765466016525)
Добавляет уникальный индекс на LOWER(email) для case-insensitive проверки уникальности.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USER_EMAIL_LOWER" 
ON "users" (LOWER("email"))
```

## Удаленные файлы

Старые страницы авторизации удалены:
- `/app/auth/login/page.tsx`
- `/app/auth/register/page.tsx`

## Использование

1. Пользователь нажимает "Sign In" или "Get Started" в Navbar
2. Открывается модальное окно AuthDialog
3. Пользователь выбирает вкладку Login или Register
4. Заполняет форму
5. При успешной авторизации:
   - Устанавливаются httpOnly cookies (access_token, refresh_token)
   - Обновляется состояние AuthProvider
   - Модальное окно закрывается
   - Показывается toast с успешным сообщением
   - Пользователь автоматически авторизован

## Совместимость с OAuth

Пользователи, зарегистрированные через Google, не могут войти по паролю (у них нет passwordHash). При попытке входа они получат сообщение "Invalid credentials or use Social Login".

Пользователи, зарегистрированные по email/password, могут позже привязать Google аккаунт (если email совпадает).
