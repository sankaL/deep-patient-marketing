# Frontend — Agent Guidance

## Scope

- This is a public Vite, React, and TypeScript marketing site.
- It renders product information and demo/pricing lead forms.
- It has no live patient session, admin portal, or browser-side privileged integration.

## Responsibilities

- Communicate DeepPatient’s value clearly and credibly.
- Keep Book a Demo and pricing submissions understandable on mobile and desktop.
- Send form requests through same-origin `/api` endpoints and show explicit pending, success, and failure states.

## Boundaries

- Never expose Supabase or Resend credentials in frontend code or public environment variables.
- Keep the frontend contract minimal and typed.
- Preserve the established editorial visual language instead of introducing dashboard UI.
- Keep components focused and below the repository size limits.
- Remove unreachable components, assets, and dependencies when their feature is removed.
