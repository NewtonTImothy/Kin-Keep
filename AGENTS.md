# AGENTS.md — KinaKeep Base44 Setup

## What this is

KinaKeep is a PNG small-business cashbook app. pnpm monorepo with a Vite+React frontend and an Express 5 API server backed by PostgreSQL (Drizzle ORM).

## Architecture

- **Frontend** (`artifacts/kinakeep`): Vite dev server on port 3000. Requires `PORT` and `BASE_PATH` env vars. Calls `/api/*` as relative URLs — the Vite dev server proxies these to the API server when `VITE_API_PROXY_TARGET` is set.
- **Backend** (`artifacts/api-server`): Express 5 on port 5000. Bundles with esbuild then runs (`pnpm run dev` = build + start, no watch mode). Requires `DATABASE_URL` and `PORT`.
- **DB** (`lib/db`): Drizzle ORM + PostgreSQL. Schema pushed via `drizzle-kit push`.
- **Auth**: Replit OIDC (`replit.com/oidc`). Requires `REPL_ID` for login flows. The app boots without it (landing page renders, `/api/auth/user` returns null), but login won't work. Replit OIDC is designed for Replit-hosted apps and may not work outside Replit.

## Running

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Services: `db` (Postgres 16) → `install` (pnpm install) → `db-push` (drizzle schema push) → `api` (Express) → `web` (Vite).

## Key env vars

| Var | Where | Notes |
|-----|-------|-------|
| `DATABASE_URL` | compose `environment` | Local Postgres, generated in compose |
| `PORT` | compose `environment` | 5000 for API, 3000 for web |
| `BASE_PATH` | compose `environment` | `/` for web |
| `VITE_API_PROXY_TARGET` | compose `environment` | `http://api:5000` — enables Vite proxy for `/api` |
| `REPL_ID` | `/run/base44/app.env` | Replit OIDC client ID, not required at boot |

## Gotchas

- The API server has no live-reload — after backend changes, restart the `api` service and call `reload_preview`.
- `vite.config.ts` requires `PORT` and `BASE_PATH` or it throws at startup.
- The `preinstall` script in the root `package.json` rejects non-pnpm package managers.
- `pnpm-workspace.yaml` enforces a 1-day minimum release age for npm packages.
- Object storage (`lib/objectStorage.ts`) uses Replit's sidecar at `127.0.0.1:1106` — file uploads won't work outside Replit.
