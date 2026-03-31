# Frontend — Agent Guidance

## Scope
- `frontend/` is the public-facing marketing website built with **Vite + React + TypeScript**.
- It also contains the **protected admin UI** for internal operators.
- This frontend is **not** the full DeepPatient application; it is a marketing site with a constrained product preview.

## Frontend Responsibilities
- Communicate product value clearly, credibly, and quickly.
- Provide polished public CTAs for demo interest, newsletter capture, and trial interaction entry.
- Render the limited patient-avatar interaction entry experience using backend-provided Tavus session data.
- Provide a hidden admin interface for Tavus trial operations and status visibility.

## UI Boundaries
- Public pages must stay focused on marketing, education, and conversion.
- The Tavus interaction experience on this site is a **preview**, not the full training product.
- Admin routes/components must remain separate from public marketing flows and should not appear in normal site navigation.
- Do not implement privileged logic in the browser; the frontend should request backend actions, not perform them directly.

## Integration Guardrails
- **Never expose Tavus API keys** or any privileged provider credentials in client code, network payloads, or build-time public env usage.
- **Never trust the client** for admin authorization; frontend guards improve UX only, while backend checks remain authoritative.
- **Use backend-issued state** as the source of truth for remaining minutes, active scenario status, rotation state, and alert state.
- **Handle failure states explicitly** for call launch, expired capacity, disabled preview mode, auth expiration, and admin mutations.

## Tavus Preview UX Expectations
- Keep the interaction entry flow short and obvious.
- Reflect the constrained nature of the experience honestly: one scenario, short duration, trial-style access.
- Prefer lightweight preflight messaging over complex onboarding.
- Make loading, unavailable, exhausted, and retry states understandable to a non-technical visitor.
- If the live experience cannot start, fall back gracefully to a marketing CTA rather than leaving the user in a dead end.

## Admin UX Expectations
- Admin UI should optimize for operational clarity, not marketing polish.
- An admin should be able to quickly see:
  - whether the current Tavus setup is usable
  - how much usage or time remains
  - whether a reminder threshold is approaching
  - whether the last rotation/recreation succeeded or failed
- Admin actions such as key rotation or scenario recreation should show explicit pending, success, and failure states.
- Dangerous or high-impact actions should be intentional and clearly labeled.

## Implementation Guidance
- Prefer small sections/components over one large page component.
- Keep route-level code thin and move logic into focused hooks or modules.
- Separate public copy/content sections from operational/admin components.
- When embedding provider-specific UI or session-launch flows, isolate them behind clear interfaces so the rest of the marketing site stays simple.
- Preserve responsive behavior; the public marketing site and the preview-call entry experience must both work on mobile and desktop.

## State Management Guidance
- Keep server state and local UI state clearly separated.
- Avoid optimistic updates for high-impact admin actions unless rollback/error behavior is explicit.
- Persist as little sensitive state in the browser as possible.
- Do not store auth tokens in `localStorage`.

## Styling Guidance
- Follow the established visual language of the marketing site rather than introducing an app-dashboard aesthetic everywhere.
- Public-facing sections should feel editorial and product-focused.
- Admin UI can be simpler visually, but should remain clear, structured, and readable.
- Avoid hiding important Tavus/admin state behind subtle visual treatment; operational information should be obvious.

## When Changing Frontend Behavior
- Check whether the change affects public marketing, Tavus preview flow, admin workflow, or more than one area.
- Keep public and admin concerns separated in navigation, route protection, and component structure.
- If a change adds new backend dependencies, keep the frontend contract minimal and typed.
- If preview-call behavior changes, verify the UI still communicates the limited nature of the experience accurately.
