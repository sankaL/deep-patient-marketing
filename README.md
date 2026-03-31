# DeepPatient Marketing Local Docker Workflow

This repository now includes a containerized development stack for the frontend and backend.

## Requirements

- Docker Desktop with the `docker compose` plugin
- GNU Make
- A populated `backend/.env` file with valid Tavus credentials for the live preview flow

Create the backend env file before starting the stack:

```bash
cp backend/.env.example backend/.env
```

Then update `backend/.env` with your real Tavus values.

## Start The Stack

```bash
make dev
```

This starts:

- the Vite frontend on `http://localhost:5173`
- the FastAPI backend on `http://localhost:8000`

The frontend proxies `/api` requests to the backend container, so browser requests stay same-origin during development.

## Other Commands

```bash
make build
make logs
make ps
make down
```

## Notes

- Frontend source changes reload through Vite HMR.
- Backend source changes reload through Uvicorn.
- Resend can remain unset for local work; the backend falls back to a development acknowledgment path for those endpoints.