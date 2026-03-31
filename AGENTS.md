# DeepPatient Marketing — Agent Guidance

This repository keeps **agent instructions lean** and focused on **durable ways of working**:
- No setup/run/test commands, ports, or troubleshooting playbooks
- No environment variable lists
- No long folder maps or embedded specs that drift over time

Service-specific guidance lives in:
- `frontend/AGENTS.md`
- `backend/AGENTS.md`

## Product Context
- This repo is the **marketing website** for DeepPatient, not the full application.
- The site has two product responsibilities:
  - explain the value of DeepPatient clearly to prospective users and buyers
  - provide a **limited live patient interaction** experience using a Tavus avatar
- The live interaction is intentionally constrained:
  - one scenario at a time for the site
  - short sessions only, typically around **2 to 5 minutes max**
  - trial-style access rather than the full DeepPatient product workflow
- The site also includes a **non-public admin experience** for operators to manage Tavus trial usage.

## Repo Map
- `frontend/` — Vite + React + TypeScript marketing site and protected admin UI
- `backend/` — FastAPI API for forms, Tavus orchestration, admin actions, and notifications
- `docs/` — product copy, visual references, and supporting assets for the marketing site

## Core Architecture
- **Frontend:** Vite + React + TypeScript with the existing UI stack in `frontend/package.json`
- **Backend:** FastAPI for all privileged operations and external service orchestration
- **Database:** Supabase is the persistence layer and operational source of truth for site data that must survive restarts
- **Admin auth:** Supabase email-based authentication protects admin-only actions
- **Avatar provider:** Tavus powers the patient interaction experience
- **Operational email:** Resend sends admin notifications such as key-rotation reminders

## Sources of Truth
- Marketing copy and messaging drafts: `docs/copy/`
- Brand/color direction: `docs/colours.md`
- Tavus avatar reference assets: `docs/public/avatars/tavus/`
- Root repo guidance: `AGENTS.md`
- Frontend implementation guidance: `frontend/AGENTS.md`
- Backend implementation guidance: `backend/AGENTS.md`

## Global Guardrails (non-negotiables)
- **Fail closed** on missing or invalid Tavus, Supabase, or Resend configuration.
- **No secrets in code** and no logging of API keys, tokens, raw auth headers, or sensitive user data.
- **Never put Tavus API keys or privileged Supabase credentials in the frontend.**
- **Server authority only:** any call creation, key rotation, scenario recreation, usage accounting, and admin authorization checks must happen on the backend.
- **Protect admin surfaces by default:** admin pages are not part of public navigation, and admin-only backend endpoints must enforce auth/authorization server-side.
- **No silent failures:** do not swallow third-party API failures; log enough context for operators and return sanitized user-safe errors.
- **Abuse resistance:** rate-limit or otherwise constrain public trial-call entry points so the limited Tavus allocation cannot be exhausted trivially.
- **Bound the live experience:** do not expand this site into the full product; keep the public avatar interaction scoped to a short, single-scenario preview.
- **Track usage centrally:** remaining minutes, usage snapshots, alert state, and key-rotation state belong in backend-controlled persistence.
- **Cleanup resources:** sessions, timers, background checks, and webhook/state listeners must be cleaned up or bounded.

## Implementation Principles
- Prefer simple, inspectable flows over hidden automation because Tavus trial capacity is limited and operationally sensitive.
- Keep one clear separation of concerns:
  - frontend renders public marketing pages and admin interfaces
  - backend owns privileged workflows and external API calls
  - Supabase stores operational records and admin-facing state
- Use explicit states for Tavus trial operations: active, expiring, exhausted, rotating, failed, disabled.
- Design admin tooling so an operator can understand the current Tavus state quickly without reading logs.

## Tavus Trial Workflow Expectations
- Treat the website as using **one active Tavus scenario** at a time unless requirements change explicitly.
- When rotating to a new Tavus API key, the backend should recreate or reinitialize whatever Tavus resources are required for the same site scenario.
- Public users should only receive the minimum data needed to start or join the limited interaction.
- The system should track how much usage remains on the currently active Tavus setup well enough for operators to know when rotation is needed.
- If remaining minutes or quota drop below the chosen threshold, the backend should trigger an admin reminder through Resend.

## Admin Experience Expectations
- Admin functionality is internal-facing and should stay hidden from public site navigation and marketing flows.
- Admins authenticate with Supabase email-based auth.
- Admin workflows should support at least:
  - supplying a replacement Tavus API key
  - triggering recreation/rebinding of the single site scenario
  - viewing current Tavus status and remaining usage information
  - reviewing whether reminder emails were sent or are pending
- Admin actions that change external-service state should be auditable in persistence.

## Code Size & Decomposition Limits
- **Hard cap:** 500 lines per source file (`.ts`, `.tsx`, `.py`).
- **Targets:** frontend pages/components/hooks <= 300 lines; backend route/service modules <= 400 lines.
- If a touched file is already over cap, **extract first** before adding net-new logic.
- Decompose early: prefer small modules with explicit boundaries for Tavus clients, auth checks, usage tracking, email alerts, and admin UI sections.

## Change Checklists

### Tavus Integration Changes
- Keep Tavus credentials and privileged operations on the backend only.
- Review whether the public experience is still limited to the intended short, single-scenario interaction.
- Preserve or update usage tracking and rotation/audit behavior when changing Tavus call-launch logic.
- Revisit admin reminder behavior if quota/minutes semantics or Tavus account structure change.

### Supabase Changes
- Keep admin authentication and authorization rules aligned between frontend expectations and backend enforcement.
- If schema changes are introduced for keys, usage snapshots, alerts, or audits, update the relevant source-of-truth docs in `docs/` if they exist for that area.
- Prefer explicit tables/records for operator-visible state rather than deriving critical admin data only from logs.

### Admin Workflow Changes
- Preserve the hidden/internal nature of admin routes.
- Require server-side auth checks for every admin action, even if the frontend already protects the route.
- Make state transitions visible to operators: rotating, succeeded, failed, exhausted, reminder sent.

### Email / Alerting Changes
- Resend emails should be operationally useful and concise.
- Avoid duplicate reminder floods; use persisted state or idempotency checks for recurring alerts.
- Never include secrets in emails.

### Marketing Experience Changes
- Keep the public site focused on explanation, conversion, and a narrow product preview.
- Do not let preview-call UI overwhelm the marketing narrative or turn into the full application.
- Maintain a clear distinction between public CTA flows and internal admin tooling.
