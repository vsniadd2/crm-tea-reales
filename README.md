# Tea CRM

CRM для Tea — учёт клиентов, заказов и аналитика.

## Локально

- Backend: http://localhost:3001
- Frontend: http://localhost:8080
- БД: `tea_crm`

```bash
cp .env.example .env
# Для локали: FRONTEND_PORT=8080 в .env
docker compose up -d --build
```

## Сервер

```bash
cp .env.example .env
nano .env
docker compose up -d --build
```

Данные PostgreSQL в volume `tea_crm_postgres_data` **не удаляются** при `docker compose down`. Удаляются только при `docker compose down -v`.
