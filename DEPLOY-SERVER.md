# Запуск Tea CRM на сервере 93.125.82.249

## Сохранность данных БД

PostgreSQL хранит данные в **именованном Docker volume** `tea_crm_postgres_data` на диске сервера.

| Команда | Данные БД |
|---------|-----------|
| `docker compose stop` | ✅ сохраняются |
| `docker compose down` | ✅ сохраняются |
| `git pull` + `docker compose up -d --build` | ✅ сохраняются |
| `docker compose down -v` | ❌ **УДАЛЯЮТСЯ** |
| `docker volume rm tea_crm_postgres_data` | ❌ **УДАЛЯЮТСЯ** |

---

## Первый запуск

```bash
ssh root@93.125.82.249

# Docker (если ещё нет)
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Клонировать проект
cd ~
git clone https://github.com/vsniadd2/crm-tea-reales.git crm-tea
cd crm-tea

# Настроить окружение
cp .env.example .env
nano .env
```

В `.env` обязательно задайте:

- `POSTGRES_PASSWORD` — сильный пароль для БД
- `JWT_SECRET` — `openssl rand -hex 32`

```bash
docker compose up -d --build
```

Сайт: **http://93.125.82.249**

Порт в firewall (если ufw):

```bash
ufw allow 80/tcp
ufw reload
```

---

## Обновление кода (данные БД сохраняются)

```bash
cd ~/crm-tea
docker compose down          # без -v!
git pull
docker compose up -d --build
```

---

## Полезные команды

```bash
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose stop
docker compose start

# Бэкап БД
docker compose exec -T postgres pg_dump -U admin tea_crm > backup.sql

# Проверить volume
docker volume ls | grep tea_crm
```

---

## Первые пользователи (создаются автоматически при пустой БД)

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | 7511 | admin |
| chervenskiy | 4506 | user (точка 1) |
| valeryanova | 4506 | user (точка 2) |

---

## Импорт клиентов из CSV

```bash
docker compose exec backend node seed-prod.js
```

---

## ⚠️ На проде не использовать

```bash
docker compose down -v
docker volume prune
docker volume rm tea_crm_postgres_data
```
