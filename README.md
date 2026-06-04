<p align="center">
  <img src="frontend/public/brand/deeppatient-logo-black.svg" alt="DeepPatient logo" width="180" />
</p>

<h1 align="center">DeepPatient Marketing Platform</h1>

<p align="center">
  <strong>The commercial landing page and interactive product preview portal for DeepPatient.</strong>
</p>

<p align="center">
  <a href="https://www.deeppatient.io"><img src="https://img.shields.io/badge/Website-deeppatient.io-blue?style=flat-square" alt="Website" /></a>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Supabase-success?style=flat-square" alt="Stack" />
</p>

---

## Product Value Proposition

DeepPatient provides safe, repeatable, and interactive patient encounters for clinical training. This repository contains the commercial platform, built to demonstrate core product capabilities, drive lead generation, and capture partner interest:

* **Interactive Patient Preview:** Visitors engage in a live, 3-minute video conversation with an AI patient avatar.
* **On-Demand Demos:** Immediate product walk-throughs showcasing rubric-based scoring.
* **Secure Governance:** Fully managed admin portal for access keys, scenarios, and lead logging.

---

## Key Modules

### Frontend (React & Vite)
A responsive landing page showcasing the DeepPatient value proposition. It features:
* **Conversational Video Sandbox:** Direct WebRTC connection to a live AI patient replica.
* **Admin Dashboard:** Access-controlled interface to rotate Tavus keys, update configurations, and audit leads.

### Backend (FastAPI)
An asynchronous API service handling system integrations:
* **Tavus Integration:** Session token generation, scenario validation, and webhook processing.
* **Lead Capture & Alerts:** Automated notifications via Resend API and logging.
* **Admin Auth:** Supabase Auth-backed portal operations.

---

## Local Development

### Requirements
* Docker Desktop with `docker compose`
* GNU Make
* A configured `backend/.env` file (copied from `backend/.env.example`)

### Start the Stack
Initialize local containers:
```bash
make dev
```
This runs the Vite frontend (port 5173), FastAPI backend (port 8000), and a local Supabase instance (port 55431) for testing auth and database queries locally.

### Utilities
```bash
make build       # Rebuild containers
make logs        # View runtime logs
make down        # Stop the local stack
```

---

## Production Deployment

This repository is optimized for deployment on Railway:
* **Frontend Service:** React application built and served via Nginx. Nginx proxies all `/api` calls to the backend service.
* **Backend Service:** FastAPI server communicating with the database.
* **Data Layer:** Remote hosted Supabase instance.

For the step-by-step setup checklist, refer to the [Railway Deployment Guide](docs/railway-deployment.md).

---

## Technology Stack

### Frontend
* React 19
* Vite
* Tailwind CSS v4
* Motion (Framer Motion v12)
* Hono (Edge/Node middleware server)
* Better Auth
* Kysely & Jotai

### Backend
* FastAPI & Uvicorn
* Resend API Python SDK
* AsyncPG & Pydantic
* HTTPX

### Infrastructure
* Supabase (PostgreSQL, Auth, Migrations)
* Tavus Conversational Video AI
* Railway Cloud Hosting
