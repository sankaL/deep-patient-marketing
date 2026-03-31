# Backend — Agent Guidance

## Scope
- `backend/` is the FastAPI service for the DeepPatient marketing website.
- The backend owns all privileged operations, external provider orchestration, admin-only actions, and durable operational state.
- The backend is the enforcement layer for the site's limited Tavus preview experience.

## Backend Responsibilities
- Serve public APIs needed by the marketing site.
- Handle newsletter/demo/admin notification flows through Resend.
- Orchestrate Tavus session creation and any related scenario/account setup needed for the site preview.
- Enforce Supabase-backed admin authentication and authorization for internal operations.
- Track Tavus usage/minutes and alert state in persistence.
- Support admin workflows for rotating Tavus trial credentials and recreating the single site scenario.

## Privileged Operations Rule
- Any operation involving Tavus secrets, Supabase service credentials, admin authorization checks, usage accounting, or alert dispatch belongs on the backend.
- The frontend may request these operations, but must never perform them directly.

## Tavus Integration Expectations
- Assume the site operates with **one active scenario** unless requirements explicitly expand.
- Encapsulate Tavus API access behind dedicated client/service modules rather than scattering direct calls across routes.
- Treat key rotation and scenario recreation as first-class operational workflows, not ad hoc scripts hidden from the application.
- If Tavus resources must be recreated when a key changes, model that state explicitly and return clear operator-facing outcomes.
- Bound public access so the preview remains short-lived and cannot silently consume the entire trial allocation.

## Supabase Expectations
- Use Supabase as the durable store for admin-facing operational records such as:
  - active Tavus key metadata references
  - usage snapshots or remaining-minute estimates
  - scenario status
  - reminder-email state
  - admin audit records
- Admin auth uses Supabase email-based authentication.
- Backend authorization checks must remain authoritative even when the frontend protects admin routes.

## Resend Expectations
- Use Resend for operational notifications such as low-remaining-minute alerts or rotation reminders.
- Alerting flows should be idempotent enough to avoid sending repetitive reminders for the same condition.
- Keep emails concise and action-oriented.

## API and Error-Handling Guardrails
- **Fail closed** when required provider configuration is missing or invalid.
- **Never log secrets** or full sensitive payloads from Tavus, Supabase, or auth flows.
- **Return sanitized errors** to clients; keep provider-specific details in structured server logs only when needed.
- **No silent third-party failures**: catch, classify, and surface operationally useful outcomes.
- **Rate-limit or gate preview-launch endpoints** so trial resources are protected.

## Data and Audit Guidance
- Prefer explicit persisted state over inferred state from logs when operators need to understand system health.
- Record high-impact admin actions such as key rotation, scenario recreation, disable/enable actions, and reminder dispatches.
- Design records so an operator can answer: what key set is active, how much usage remains, what changed last, and what needs attention now.

## Background and Scheduled Work
- If remaining minutes or usage thresholds require periodic checking, keep jobs bounded, observable, and idempotent.
- Avoid hidden forever-loops or unmanaged background tasks in request handlers.
- Make reminder thresholds and alert suppression logic easy to inspect and test.

## Code Organization Guidance
- Keep route modules thin; move provider calls, auth helpers, persistence logic, and alerting into dedicated modules.
- Separate Tavus integration code from email logic and from auth/authorization logic.
- Prefer typed request/response models for every public and admin endpoint.
- If `main.py` grows beyond a thin composition layer, extract routes/services early.

## When Changing Backend Behavior
- Check whether the change affects Tavus lifecycle, admin auth, persistence, email reminders, or public marketing APIs.
- Preserve the single-scenario, short-preview assumption unless the product requirements explicitly change.
- If adding new persistence for usage, rotation, or audits, keep the schema understandable to operators and future maintainers.
- Add or update regression coverage for any bug fix or behavior change around auth, key rotation, reminder dispatch, or public preview limits.
