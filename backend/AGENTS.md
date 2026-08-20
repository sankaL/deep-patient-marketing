# Backend — Agent Guidance

## Scope

- FastAPI serves health, demo-request, and pricing-inquiry endpoints.
- Supabase is the durable store for public leads.
- Resend sends sales notifications and customer confirmations.

## Responsibilities

- Validate public form payloads with typed models.
- Persist a lead before attempting email notifications.
- Return sanitized client errors and log operational failures without secrets or sensitive payloads.
- Keep provider access in small services behind dependency injection.

## Boundaries

- Do not add live-session, avatar-provider, admin-auth, or key-management routes without an explicit requirement.
- Do not expose service-role credentials to the frontend.
- Keep route modules thin and update tests for contract, persistence, and notification changes.
- Add new database changes as forward migrations; preserve existing migration history.
