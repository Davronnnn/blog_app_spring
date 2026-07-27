# Blog App — Spring Boot + Next.js

Full-stack blog: Java Spring Boot 4 API (`backend/`) + Next.js frontend (`frontend/`),
PostgreSQL, JWT auth.

## One-time setup

```bash
# 1. Create the database (needs sudo)
sudo -u postgres psql -c "CREATE ROLE blog WITH LOGIN PASSWORD 'blog'; CREATE DATABASE blog OWNER blog;"
```

## Run

```bash
# Backend → http://localhost:8080
cd backend
JAVA_HOME=$HOME/.jdks/jdk-21.0.12+8 ./mvnw spring-boot:run

# Frontend → http://localhost:3000
cd frontend
npm run dev
```

## Learn

The complete backend walkthrough (every layer explained) is in
[`backend/LEARNING.md`](backend/LEARNING.md).

## API overview

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | create account, returns tokens |
| POST | `/api/auth/login` | — | login, returns tokens |
| POST | `/api/auth/refresh` | — | new tokens from a refresh token |
| GET | `/api/auth/me` | Bearer | current user |
| GET | `/api/posts?page&size&search&author` | — | paginated post list |
| GET | `/api/posts/{slug}` | — | one post |
| POST | `/api/posts` | Bearer | create post |
| PUT | `/api/posts/{slug}` | Bearer (owner) | update post |
| DELETE | `/api/posts/{slug}` | Bearer (owner) | delete post |
| GET | `/api/posts/{slug}/comments` | — | comments for a post |
| POST | `/api/posts/{slug}/comments` | Bearer | add comment |
| GET | `/api/admin/stats` | Admin | dashboard counts |
| GET | `/api/admin/users?page&size&search` | Admin | user list |
| PATCH | `/api/admin/users/{id}/role` | Admin | promote/demote |
| DELETE | `/api/admin/users/{id}` | Admin | delete user |
| GET | `/api/posts/{slug}/comments` | — | comments for a post |
| POST | `/api/posts/{slug}/comments` | Bearer | add comment |
| DELETE | `/api/comments/{id}` | Bearer (owner/post author/admin) | delete comment |

## Admin access

The first registered user is auto-promoted to `ADMIN` (Flyway `V2` migration).
Or manually: `UPDATE users SET role = 'ADMIN' WHERE username = 'yourname';`

Admin panel: http://localhost:3000/admin
