# DeepPatient Marketing Local Docker Workflow

This repository now includes a containerized development stack for the frontend, backend, and an optional local Supabase-compatible data stack.

## Requirements

- Docker Desktop with the `docker compose` plugin
- GNU Make
- A populated `backend/.env` file

Create the backend env file before starting the stack:

```bash
cp backend/.env.example backend/.env
```

For local development, the committed example points the backend at the local PostgREST gateway on `http://localhost:54321` and seeds one active Tavus key/scenario from the bootstrap variables.

## Start The Stack

```bash
make dev
```

This starts:

- the Vite frontend on `http://localhost:5173`
- the FastAPI backend on `http://localhost:8000`
- the local Supabase-compatible REST gateway on `http://localhost:55431` when `SUPABASE_MODE=local`
- the local Postgres database on `localhost:55432` when `SUPABASE_MODE=local`

The frontend proxies `/api` requests to the backend container, so browser requests stay same-origin during development.

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
