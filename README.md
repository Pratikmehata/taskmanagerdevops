# 📋 TaskManager

A fullstack task-management application built as a portfolio project.

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML/CSS/JS served by Nginx |
| Backend | Node.js · Express · JWT auth |
| Database | MongoDB (via Mongoose) |
| Notifications | Python · Flask · SMTP email |
| Infra | Docker Compose |
| CI | GitHub Actions |

---

## Architecture

```
Browser (port 3000)
    │
    ▼
[Nginx]  ──/api/──►  [Backend :4000]  ──►  [MongoDB :27017]
                            │
                            └──►  [Notification Service :5001]
```

---

## Quick start

### Prerequisites
- Docker + Docker Compose v2
- (optional) Node 20 for local backend dev
- (optional) Python 3.12 for local notification dev

### 1. Clone & configure

```bash
git clone https://github.com/yourname/taskmanager.git
cd taskmanager
cp .env.example .env
# Edit .env — set SMTP credentials and change secret keys
```

### 2. Start everything

```bash
make up
# or: docker compose up -d --build
```

| URL | Service |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:4000/health | Backend health check |
| http://localhost:5001/health | Notification service health |

### 3. Demo login

A seed user is created automatically:

- **Email:** `demo@taskmanager.dev`
- **Password:** `demo1234`

---

## API Reference

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Login → JWT |
| GET  | `/api/auth/me` | — | Current user (auth required) |

### Tasks (all require `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| GET    | `/api/tasks` | List tasks (filter: `?status=`, `?priority=`) |
| POST   | `/api/tasks` | Create task |
| GET    | `/api/tasks/:id` | Get single task |
| PATCH  | `/api/tasks/:id` | Update task fields |
| DELETE | `/api/tasks/:id` | Delete task |

---

## Email notifications

The Python notification service sends emails when:
- A task is marked **done** (triggered by the backend automatically)
- (extendable) A task is **due soon** via a scheduled cron

Configure your SMTP credentials in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password   # Gmail: create an App Password
FROM_EMAIL=TaskManager <your@gmail.com>
```

---

## Development

```bash
make logs            # tail all logs
make shell-backend   # shell into backend container
make shell-mongo     # mongosh inside the DB container
make test            # run Jest tests
make down            # stop everything
make clean           # remove containers + volumes
```

---

## Project structure

```
taskmanager/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── backend/
│   ├── models/                # Mongoose schemas (User, Task)
│   ├── routes/                # Express routers (auth, tasks)
│   ├── middleware/            # JWT auth, error handler
│   ├── server.js
│   └── Dockerfile
├── notification-service/
│   ├── notifier.py            # Flask email service
│   └── Dockerfile
├── frontend/
│   ├── index.html             # SPA (auth + task board)
│   ├── nginx.conf             # Reverse-proxy /api → backend
│   └── Dockerfile
├── database/
│   └── init.js                # MongoDB seed & indexes
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## License

MIT
