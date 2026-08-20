# DeepPatient Marketing Website

The public DeepPatient marketing site explains the clinical training platform and captures demo and pricing interest.

## Architecture

- React 19, Vite, TypeScript, Tailwind CSS, and Motion for the public site
- FastAPI for public form APIs
- Supabase for demo and pricing lead persistence
- Resend for sales notifications and customer confirmations
- Docker Compose for local development

## Local Development

Requirements are Docker Desktop and GNU Make. Copy `backend/.env.example` to `backend/.env`, add the required Resend values, then run:

```bash
make dev
```

The frontend runs at `http://localhost:5173`, FastAPI at `http://localhost:8000`, and the local Supabase gateway at `http://localhost:55431`.

Useful commands:

```bash
make frontend-build
make logs
make ps
make down
```

## Production

Railway runs separate frontend and backend services. The frontend serves static assets through Nginx and proxies `/api` to the private backend. See `docs/railway-deployment.md` for configuration and deployment order.
