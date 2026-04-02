# DeepPatient Marketing

## Production deployment

The repository now includes a dedicated production deployment path for:

- `backend/Dockerfile.railway` for the FastAPI API on Railway
- `frontend/Dockerfile.railway` for a built React app served by nginx on Railway
- `frontend/nginx/default.conf.template` to proxy `/api` to a private backend service so the public site and admin cookies stay same-origin

Recommended production topology:

- public Railway service: `frontend`
- private Railway service: `backend`
- hosted Supabase project with the existing migrations in `supabase/migrations/`

Key production variables:

- backend: `SUPABASE_MODE=remote`, `SUPABASE_URL`, `SUPABASE_AUTH_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `SALES_EMAIL`, `PRODUCT_VIDEO_URL`, `TAVUS_API_KEY_ENCRYPTION_KEY`, `ADMIN_EMAIL`, `ADMIN_EMAILS`, `MARKETING_SITE_URL`
- frontend: `BACKEND_UPSTREAM_URL` pointing at the backend Railway private URL

The frontend keeps relative `/api` calls in production; nginx proxies them to the private backend service.
Set `MARKETING_SITE_URL` to the public frontend URL users actually hit. If you attach a custom domain such as `deeppatient.io`, its DNS must point at the Railway `frontend` service or production tests and email links will hit a different site.

## Local Docker workflow

This repository now includes a containerized development stack for the frontend, backend, and an optional local Supabase-compatible data stack.

## Requirements

- Docker Desktop with the `docker compose` plugin
- GNU Make
- A populated `backend/.env` file

Create the backend env file before starting the stack:

```bash
cp backend/.env.example backend/.env
```

For local development, the committed example points the backend at the local Supabase gateway on `http://localhost:55431` and seeds one active Tavus key/scenario from the bootstrap variables.
The backend now also expects Supabase Auth settings for the hidden admin portal. Configure `SUPABASE_AUTH_URL`, `SUPABASE_ANON_KEY`, and `ADMIN_EMAILS` in `backend/.env` before using `/admin`.

## Start The Stack

```bash
make dev
```

This starts:

- the Vite frontend on `http://localhost:5173`
- the FastAPI backend on `http://localhost:8000`
- the local Supabase gateway for both REST and Auth on `http://localhost:55431` when `SUPABASE_MODE=local`
- the local Postgres database on `localhost:55432` when `SUPABASE_MODE=local`

The frontend proxies `/api` requests to the backend container, so browser requests stay same-origin during development.
The hidden admin portal is available by direct URL at `http://localhost:5173/admin`.

When `SUPABASE_MODE=remote`, `make dev` starts only the frontend and backend containers and expects `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` to target a hosted Supabase project.

## Other Commands

```bash
make build
make dev-local
make logs
make ps
make down
```

## Notes

- Frontend source changes reload through Vite HMR.
- Backend source changes reload through Uvicorn.
- Local schema migrations and Tavus bootstrap seeding run through the `supabase-bootstrap` one-shot container before the backend starts.
- Resend can remain unset for local work; public form submission still persists, and notification delivery is skipped.
- Sales notifications for exhausted Tavus capacity are controlled through `SALES_EMAIL`.
