# 🚀 Маркет-Ролик (MVP)

**Статус:** 🚧 Phase 2.3 Completed (Photoroom Integration & S3 Storage)
**Прогресс:** [Посмотреть Roadmap](roadmap.html)

**Маркет-Ролик** — это SaaS-платформа для автоматической генерации **видео-обложек** для маркетплейсов (**Wildberries**, **Ozon**) с помощью:

* AI (Kling, Photoroom, YandexGPT)
* программного рендеринга (Remotion)
* микросервисной архитектуры (NestJS + Next.js)

Проект построен как двухсервисная система с общей локальной инфраструктурой.

---

## ✅ Реализованный функционал

*   **Инфраструктура**: Docker Compose (PostgreSQL + Redis).
*   **База данных**: TypeORM сущности (User, Project, Asset, Transaction).
*   **Очереди задач**: BullMQ (Redis) для асинхронной обработки.
*   **Proxy Service**: Проксирование запросов через зарубежные серверы (для обхода блокировок AI-сервисов).
*   **Storage Service**: Интеграция с S3 (Timeweb) для хранения медиа-файлов.
*   **Image Processor**: Воркер для удаления фона с изображений (Photoroom API + Mock режим).
*   **Projects Module**: API для создания проектов и сохранения результатов генерации.

---

## 📂 Структура проекта

```
market-rolik-root/
├── docker-compose.yml      # Локальная БД (Postgres) и Очереди (Redis)
├── README.md               # Этот файл
├── backend/                # NestJS (API, Workers, DB)
└── frontend/               # Next.js (UI, Dashboard, Wizard)
```

---

## 🛠 Требования

Для работы необходимы:

* **Docker & Docker Compose**
* **Node.js 20+**
* npm или yarn
* Nest CLI:

  ```bash
  npm i -g @nestjs/cli
  ```

---

## 🚦 Быстрый старт (локальное окружение)

### **1. Запуск инфраструктуры**

В корневой директории выполните:

```bash
docker-compose up -d
```

Будут запущены:

* 🐘 **PostgreSQL 16** — `localhost:5432`
* 🔺 **Redis 7** — `localhost:6379`
* 💼 **pgAdmin** — `http://localhost:5050`
  Логин: `admin@admin.com`
  Пароль: `root`

---

## 🧱 Бэкенд (NestJS)

### Инициализация

```bash
# Создать проект (если отсутствует)
nest new backend --package-manager npm

cd backend
```

### Установка зависимостей

```bash
npm install @nestjs/typeorm typeorm pg \
  @nestjs/config @nestjs/bull bull ioredis
```

### .env

Создайте `backend/.env` (не добавляйте этот файл в git, если он содержит реальные ключи):

```env
PORT=4000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=root
DATABASE_NAME=market_rolik

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# S3 Storage (Timeweb / Minio / AWS)
# Внимание: Никогда не коммитьте реальные ключи доступа!
S3_REGION=ru-1
S3_ENDPOINT=https://s3.timeweb.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=market-rolik-media

# Proxy (Optional - for AI services)
PROXY_HOST=
PROXY_PORT=
PROXY_USER=
PROXY_PASSWORD=

# AI Keys
PHOTOROOM_API_KEY=mock  # Используйте 'mock' для тестирования без затрат
```

### Запуск dev-сервера

```bash
npm run start:dev
```

Бэкенд:
👉 [http://localhost:4000](http://localhost:4000)

---

## 🎨 Фронтенд (Next.js + Shadcn)

### Создание проекта

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint
cd frontend
```

### Shadcn UI

```bash
npx shadcn-ui@latest init
# Style: Default
# Color: Slate
# CSS Variables: Yes
```

### Установка зависимостей

```bash
npm install lucide-react axios
```

### Запуск

```bash
npm run dev
```

Фронтенд:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🗄 Данные для подключения (local defaults)

| Сервис   | Хост      | Порт | Логин                                     | Пароль | База         |
| -------- | --------- | ---- | ----------------------------------------- | ------ | ------------ |
| Postgres | localhost | 5432 | admin                                     | root   | market_rolik |
| Redis    | localhost | 6379 | —                                         | —      | —            |
| pgAdmin  | localhost | 5050 | [admin@admin.com](mailto:admin@admin.com) | root   | —            |

---

## 📝 Полезные команды

```bash
# Остановить инфраструктуру
docker-compose down

# Перезапуск Postgres
docker-compose restart postgres

# Логи БД
docker-compose logs -f postgres
```

---

## 🗺 Roadmap

* [ ] **Этап 1.2:** Настроить TypeORM в NestJS и создать сущности `User` и `Project`
* [ ] **Этап 1.3:** Создать миграции и проверить подключение через pgAdmin
* [ ] **Этап 2.1:** Подключить BullMQ и очередь `video-generation`

---

Если хочешь — могу дополнить README красивыми бейджами (Node, Docker, Redis, Postgres, Next.js, NestJS) или сделать логотип проекта.
