# DeepPatient Marketing — Agent Guidance

This repository is the public marketing website for DeepPatient. It explains the product, captures demo and pricing leads, and sends follow-up email. It does not host patient simulations or an operator admin portal.

Service-specific guidance lives in `frontend/AGENTS.md` and `backend/AGENTS.md`.

## Architecture

- `frontend/` is the Vite, React, and TypeScript marketing site.
- `backend/` is the FastAPI service for public forms and Resend notifications.
- Supabase stores demo and pricing requests.
- `supabase/` contains local database infrastructure and migration history.
- `docs/copy/` and `docs/colours.md` are the copy and brand references.

## Guardrails

- Keep Supabase service credentials and Resend keys on the backend.
- Never log secrets, raw authorization headers, or full sensitive form payloads.
- Fail closed when lead persistence is unavailable and return sanitized errors.
- A successful form submission must be persisted before notifications are attempted.
- Notification failures must be logged without changing a successfully persisted form response into a failure.
- Preserve same-origin `/api` access in local and production environments.
- Do not reintroduce live-session, avatar-provider, admin-auth, or key-management behavior without an explicit product decision.

## Code Size

- Hard cap: 500 lines per `.ts`, `.tsx`, or `.py` source file.
- Target frontend pages and components at 300 lines or fewer.
- Target backend routes and services at 400 lines or fewer.
- Extract before adding logic to a touched file that is already over the hard cap.

## Changes

- Update tests whenever a public form contract or notification flow changes.
- Add forward-only migrations. Do not rewrite migrations that may already be applied.
- Keep marketing copy focused on the full DeepPatient product without implying that the marketing site itself hosts a live simulation.
