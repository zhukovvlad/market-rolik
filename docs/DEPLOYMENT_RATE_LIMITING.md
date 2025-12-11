# Инструкция по деплою с Rate Limiting

## Быстрый старт для разных окружений

### 1. Development (локально)

**`.env`:**
```bash
TRUST_PROXY=loopback
TRUST_PROXY_IPS=
```

✅ Подходит для разработки на localhost  
✅ Безопасно - доверяет только локальным запросам

---

### 2. Docker (Docker Compose / Kubernetes)

**`.env`:**
```bash
TRUST_PROXY=loopback
TRUST_PROXY_IPS=172.17.0.0/16
```

✅ Доверяет Docker bridge network  
✅ Работает с docker-compose и стандартными Docker setups

**Для Kubernetes:**
```bash
TRUST_PROXY=loopback
TRUST_PROXY_IPS=10.0.0.0/8
```

---

### 3. За nginx или Apache

**`.env`:**
```bash
TRUST_PROXY=true
TRUST_PROXY_IPS=
```

Или если знаете IP вашего прокси:
```bash
TRUST_PROXY=loopback
TRUST_PROXY_IPS=10.0.0.1
```

**nginx конфигурация:**
```nginx
location / {
    proxy_pass http://backend:4000;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

### 4. AWS (за ALB/ELB)

**`.env`:**
```bash
TRUST_PROXY=true
TRUST_PROXY_IPS=
```

Или укажите VPC CIDR:
```bash
TRUST_PROXY=loopback
TRUST_PROXY_IPS=10.0.0.0/16
```

---

### 5. Cloudflare

**`.env`:**
```bash
TRUST_PROXY=cloudflare
TRUST_PROXY_IPS=
```

✅ Автоматически доверяет всем Cloudflare IP ranges  
✅ Безопасно если используете Cloudflare CDN

---

### 6. VPS с прямым доступом (без прокси)

**`.env`:**
```bash
TRUST_PROXY=false
TRUST_PROXY_IPS=
```

⚠️ Используйте если приложение открыто напрямую в интернет  
⚠️ Не рекомендуется - лучше поставить nginx

---

## Как проверить что всё работает

### Шаг 1: Запустите приложение

```bash
cd backend
npm run start:prod
```

### Шаг 2: Проверьте IP в логах

Добавьте временно в любой endpoint:
```typescript
console.log('Client IP:', req.ip);
```

### Шаг 3: Сделайте запрос

```bash
curl http://your-domain.com/api/projects
```

Проверьте лог - должен показать ваш **реальный IP**, а не:
- ❌ `::1` или `127.0.0.1` (если за прокси)
- ❌ IP прокси-сервера
- ❌ `unknown`

### Шаг 4: Проверьте защиту от спуфинга

Попробуйте подделать IP:
```bash
curl http://your-domain.com/api/projects \
  -H "X-Forwarded-For: 1.2.3.4"
```

В логах **не должно** быть `1.2.3.4` - должен быть ваш реальный IP.  
Если видите `1.2.3.4` → конфигурация небезопасна! ⚠️

### Шаг 5: Проверьте rate limiting

```bash
# Отправьте 12 запросов подряд
for i in {1..12}; do 
  curl http://your-domain.com/api/projects
done
```

**Ожидаемый результат:**
- Первые 10 запросов: HTTP 200 ✅
- Запросы 11-12: HTTP 429 (Too Many Requests) ✅

---

## Частые проблемы

### ❌ Все видят один и тот же IP

**Симптом:** Rate limiting блокирует всех пользователей одновременно

**Причина:** `req.ip` возвращает IP прокси-сервера

**Решение:**
1. Проверьте что nginx/Apache передаёт `X-Forwarded-For`
2. Настройте `TRUST_PROXY_IPS` с IP вашего прокси
3. Перезапустите приложение

---

### ❌ Rate limiting не работает

**Симптом:** Можно отправлять бесконечно запросов

**Причина 1:** Guard не зарегистрирован
```typescript
// Проверьте в app.module.ts
{
  provide: APP_GUARD,
  useClass: IpThrottlerGuard,
}
```

**Причина 2:** Redis не запущен (если используете Redis storage)

---

### ❌ IP = "unknown"

**Симптом:** В логах `req.ip = 'unknown'`

**Причина:** Прокси не передаёт заголовки или trust proxy не настроен

**Решение:**
1. Проверьте nginx конфигурацию (должен быть `proxy_set_header`)
2. Проверьте `TRUST_PROXY` переменную
3. Добавьте `console.log(req.headers)` - должен быть `x-forwarded-for`

---

## Production Checklist

Перед деплоем в production:

- [ ] ✅ Настроен `TRUST_PROXY` для вашей инфраструктуры
- [ ] ✅ Проверен реальный IP в логах (не localhost, не proxy IP)
- [ ] ✅ Протестирована защита от IP спуфинга
- [ ] ✅ Протестирован rate limiting (429 после лимита)
- [ ] ✅ Установлены адекватные лимиты (`THROTTLE_LIMIT`)
- [ ] ✅ nginx/Apache настроен на передачу `X-Forwarded-For`
- [ ] ✅ Добавлен мониторинг 429 ошибок

---

## Примеры конфигураций для популярных хостингов

### Railway.app / Render.com

```bash
TRUST_PROXY=true
```

### Heroku

```bash
TRUST_PROXY=true
```

### DigitalOcean App Platform

```bash
TRUST_PROXY=true
```

### Vercel (для serverless)

```bash
TRUST_PROXY=true
```

### VPS с nginx

```bash
TRUST_PROXY_IPS=YOUR_NGINX_SERVER_IP
```

---

## Нужна помощь?

Если что-то не работает:

1. Проверьте логи приложения
2. Проверьте `req.ip` и `req.headers['x-forwarded-for']`
3. Убедитесь что прокси передаёт заголовки
4. Откройте issue в GitHub с информацией:
   - Где деплоите (AWS, Docker, VPS, и т.д.)
   - Конфигурация `TRUST_PROXY`
   - Что показывает `req.ip`
   - Есть ли прокси/load balancer

---

## Безопасность

⚠️ **Важно:** Неправильная конфигурация может позволить атакующим:
- Обходить rate limiting
- Подделывать свой IP
- Проводить DDoS атаки

✅ **Всегда тестируйте** конфигурацию перед production!
