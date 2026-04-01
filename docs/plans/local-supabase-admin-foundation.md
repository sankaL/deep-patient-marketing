## Plan: Local Supabase and Admin Foundation

Add a full local Supabase stack to the repo’s Docker workflow, move Tavus scenario lookup from backend env vars into a database-backed active-scenario record, persist public demo requests in Supabase, and scaffold a hidden admin portal authenticated with Supabase email/password via backend-set HttpOnly cookies. Keep the current Tavus API key in backend env for now; only persona/replica move into the database in this pass.

**Steps**
1. Phase 1 — Local Supabase foundation.
   Use the official self-hosted Supabase Docker setup as the base, but trim it to the services this repo actually needs now: Postgres, Auth, REST, Studio, gateway, and the supporting meta service. Leave Storage, Realtime, Functions, and Analytics out unless one of those becomes necessary during implementation. This keeps the local footprint lower while still giving you real Supabase DB + Auth locally.
2. Add a new Supabase workspace area under `supabase/` for the Docker assets, migration files, seed data, and local env templates. Use non-conflicting host ports because the app backend already occupies 8000; the Supabase API/Auth gateway should be remapped to a separate host port and Studio should use its own host port as well. Update the root Docker workflow so one developer flow brings up frontend, backend, and local Supabase together.
3. Update `docker-compose.yml`, `Makefile`, `README.md`, and `backend/.env.example` to document and wire the new local services, local secrets, and bootstrap steps. This phase blocks the later phases.
4. Phase 2 — Database schema and bootstrap data. *depends on 1-3*
   Create SQL migrations under the new Supabase folder for two application tables only:
   `public.scenarios`: UUID primary key, persona_id, replica_id, is_active boolean, created_at, updated_at. Enforce the “one active site scenario” rule with a unique partial index on `is_active = true`, so the schema matches the current single-scenario product assumption while still allowing historical rows later.
5. Create `public.demo_requests`: UUID primary key, name required, email required, organization optional, team_size_bucket optional, created_at, updated_at. Use a check constraint or enum-style constraint for the bucket values so the data stays consistent for later reporting.
6. Enable RLS on both tables and do not create anon/browser policies in this pass. The backend should continue to be the only layer that reads or writes these tables, using the Supabase service role. This preserves the repo’s “server authority only” rule.
7. Add seed data for one active scenario so local Tavus preview still works immediately after migration. Seed it from the current local Tavus persona/replica values or a documented placeholder workflow. Add a repeatable local admin bootstrap step that creates one Supabase auth user from configured local admin email/password values and authorizes it via a backend email allowlist rather than introducing a third custom table. This keeps the requested custom schema to the two user-facing tables.
8. Phase 3 — Backend Supabase integration. *depends on 4-7*
   Add backend Supabase configuration and service modules for: client construction, active-scenario lookup, demo-request inserts, and admin auth/session operations. Keep privileged keys and JWT secrets backend-only.
9. Refactor Tavus configuration so `backend/config.py` still owns stable Tavus config such as API key, preview flags, timeout, and cooldown, but no longer owns persona_id/replica_id. Replace those reads with a database fetch for the active scenario. `backend/routes/tavus.py` should keep the preview gate and call path, but fail closed with a sanitized 503 if no active scenario exists.
10. Replace the current demo-request handler so it validates the new payload shape, writes the request to Supabase first, and then performs any Resend notifications as a secondary step. This keeps lead capture durable even if email delivery fails, while still surfacing operational failures in logs and responses appropriately.
11. Split growing backend concerns out of `backend/main.py` into dedicated route/service modules before the file becomes the dumping ground for database, auth, and Tavus orchestration logic. This is especially important because the repo instructions cap source file size and want thin route modules.
12. Phase 4 — Admin auth and protected API surface. *can start in parallel with late Phase 3 extraction work once Supabase config exists*
   Implement backend login/logout/session endpoints for the admin portal using Supabase email/password auth and backend-set HttpOnly cookies. This avoids storing Supabase tokens in browser localStorage and keeps authorization enforcement on the backend.
13. Add a backend auth dependency that validates the Supabase session/JWT on every admin-only endpoint and checks the authenticated email against a configured ADMIN_EMAILS allowlist. This gives you server-side authorization without adding an extra application table beyond the two you requested.
14. Add the minimum protected admin endpoints needed now: fetch active scenario, list or page demo requests, and return current session identity. Leave Tavus key rotation, scenario recreation, and system-prompt editing as explicit future admin actions, not part of this implementation.
15. Phase 5 — Frontend integration. *depends on 10 and 12-14*
   Introduce route separation so the public landing page stays intact and a hidden admin path is available by direct URL only. Because the current frontend has no routing dependency, add the router only once there is a clear public/admin split.
16. Replace every public “Book a Demo” CTA with a shared form flow that posts to the backend’s demo-request endpoint. Cover the existing CTA surfaces in hero, live-session preview, footer CTA, and any other current demo buttons so every conversion path lands in the same table. Reuse the submission/status pattern already used by the newsletter section.
17. Add a minimal admin UI with: email/password login, session guard, active scenario display, and demo-request visibility. Keep the first version intentionally basic and internal. Do not add any public navigation entry for it.
18. Phase 6 — Verification and regression coverage. *depends on all prior phases*
   Add a small backend test harness or equivalent API-level coverage for three critical paths: active-scenario lookup and fail-closed behavior, demo-request validation/persistence, and admin auth guards. The repo has no existing test harness, so this needs to be introduced deliberately rather than assumed.
19. Validate the local stack manually end-to-end: start the app and Supabase containers together; confirm the Supabase gateway and Studio ports do not collide with the FastAPI backend; run migrations and seed/bootstrap flows; confirm Tavus preview still works with the seeded active scenario; confirm the demo form writes rows; confirm unauthenticated admin requests are rejected; confirm authenticated admin access succeeds.

**Relevant files**
- `docker-compose.yml` — current local app stack; needs Supabase services or compose layering plus port/network updates.
- `Makefile` — current dev entry point; should grow Supabase-aware startup/bootstrap commands.
- `README.md` — documents the Docker workflow and will need Supabase startup/bootstrap notes.
- `backend/.env.example` — currently contains Tavus/Resend envs only; should add backend-side Supabase settings and local admin bootstrap values.
- `backend/config.py` — `get_tavus_settings()` is the current seam for splitting static Tavus env config from DB-backed active scenario state.
- `backend/routes/tavus.py` — `start_tavus_conversation()` remains the preview gate and should keep cooldown handling while switching scenario lookup to persistence.
- `backend/services/tavus.py` — `create_conversation()` should keep its external Tavus contract but consume scenario values passed in from the new persistence-backed settings layer.
- `backend/main.py` — current `demo_request()` and `subscribe()` endpoints are the baseline patterns, but new auth/persistence routes should be extracted rather than added inline here.
- `backend/requirements.txt` — will need Supabase client and likely test/auth dependencies.
- `frontend/package.json` — currently has no router or Supabase client dependencies; routing will be added here and frontend auth can stay backend-mediated.
- `frontend/src/App.tsx` — current single-page composition point; will need a public/admin route split.
- `frontend/src/sections/newsletter-section.tsx` — reusable fetch/submission-status pattern for the new demo request form.
- `frontend/src/components/ui/hero-section.tsx` — contains multiple Book a Demo CTAs that should point at the shared form flow.
- `frontend/src/components/live-session/live-session-preview.tsx` — contains the current mailto demo CTA and the Tavus preview entry point.
- `frontend/src/sections/footer-cta-section.tsx` — public footer demo CTA that should route into the shared form.
- `frontend/src/sections/personas-section.tsx` — additional public demo CTA surface that needs to converge on the same form flow.
- `supabase/` — new local Supabase Docker, migration, and seed/bootstrap assets.
- `backend/routes/admin.py` and related new backend service modules — new protected session and admin-read endpoints.

**Verification**
1. Start the local stack through the repo’s standard workflow and confirm frontend, backend, Supabase API/Auth, and Supabase Studio all come up healthy on non-conflicting ports.
2. Apply migrations and seed/bootstrap data, then inspect the local Supabase instance to confirm exactly one active scenario row exists and the `demo_requests` table is present with RLS enabled.
3. Call the Tavus preview endpoint with and without an active scenario row to confirm success in the seeded case and a fail-closed 503 in the missing-scenario case.
4. Submit demo requests through the actual website CTA flow and confirm rows are persisted with the expected required/optional field behavior and bucket validation.
5. Attempt admin API calls without a session, with a non-allowlisted user, and with the bootstrapped admin user to confirm authorization is enforced server-side.
6. Verify the hidden admin route can log in, load the current session, show the active scenario, and render demo requests without exposing any admin link in the public marketing UI.

**Decisions**
- Full local Supabase stack should run in Docker, not just a standalone Postgres container.
- Admin authentication should use Supabase email/password.
- Admin session handling should use backend-set HttpOnly cookies rather than client-held persistent Supabase tokens.
- Scenario modeling should assume one active site scenario at a time.
- Demo requests should store organization as optional and team size as a preset bucket.
- Only two custom application tables are in scope for this pass: `scenarios` and `demo_requests`.
- Tavus API key rotation, scenario recreation tooling, system-prompt editing, usage tracking, and reminder-email workflows are out of scope for this implementation and should remain future admin work.
- Tavus API key stays in backend env for now; persona_id and replica_id move into the active scenario record.

**Further Considerations**
1. Choose and freeze the exact team-size bucket set early, because changing buckets after data lands is a schema and reporting migration rather than a simple UI tweak.
2. If you later need more than one site scenario, extend the `scenarios` table with richer lifecycle fields such as `activated_at`, `archived_at`, or `status` without changing the current “single active row” contract.