# Railway Deployment Runbook

This repo is deployed to Railway as two services:

- `frontend` for the public site, rooted at `frontend/`
- `backend` for the FastAPI API, rooted at `backend/`

Both services are intended to auto-deploy from `main` after GitHub merges land.

## One-Time Railway Setup

### Backend service

- Connect the GitHub repo to a Railway service.
- Set the root directory to `backend`.
- Set the custom config path to `/backend/railway.json`.
- Keep the service private-only.
- Set the trigger branch to `main`.

### Frontend service

- Connect the same GitHub repo to a second Railway service.
- Set the root directory to `frontend`.
- Set the custom config path to `/frontend/railway.json`.
- Expose this service publicly.
- Set the trigger branch to `main`.

### Required frontend variable

- `BACKEND_UPSTREAM_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000`

The frontend nginx config proxies `/api/...` to the private backend service, so browser traffic stays same-origin on the public site.

### Required backend variables

- `SUPABASE_MODE=remote`
- `SUPABASE_URL`
- `SUPABASE_AUTH_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SALES_EMAIL`
- `PRODUCT_VIDEO_URL`
- `TAVUS_API_KEY_ENCRYPTION_KEY`
- `ADMIN_EMAIL`
- `ADMIN_EMAILS`
- `MARKETING_SITE_URL`

Recommended production cookie settings:

- `ADMIN_AUTH_COOKIE_SECURE=true`
- `ADMIN_AUTH_COOKIE_SAME_SITE=lax`

If you attach a custom domain to the frontend service, update `MARKETING_SITE_URL` to that exact public URL.

## Deploy After Merge To `main` Without Supabase Migrations

Use this path when the PR changes only app code, copy, styling, or any backend logic that does not require a schema change in the hosted Supabase project.

1. Merge the PR to `main`.
2. Railway auto-builds and auto-deploys both `backend` and `frontend`.
3. Wait for both services to report healthy.
4. Verify the deploy:
   - frontend health: `/health`
   - backend health: `/api/health`
   - public site loads normally
   - frontend can reach backend through `/api/...`
   - admin login still works
   - Tavus preview still behaves like a short single-scenario trial

That is the normal day-to-day deploy path.

## Deploy After Merge To `main` With Supabase Migrations

Use this path when the PR adds or changes SQL files in [`supabase/migrations/`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/supabase/migrations).

Important: Railway deploys the app containers only. It does not automatically apply Supabase migrations from this repo. Production schema changes are a separate step.

### Recommended order

1. Review the new migration files in [`supabase/migrations/`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/supabase/migrations).
2. Decide whether the migration is additive/backward-compatible or breaking.
3. Apply the migration to the hosted Supabase project.
4. Merge the PR to `main`.
5. Confirm Railway finishes deploying both services.
6. Re-check the app flows that depend on the new schema.

### If the migration is additive

Examples: adding a nullable column, adding a new table, adding a new index.

You can usually do either of these safely:

- apply the migration shortly before merging, then merge to `main`
- merge first, then apply the migration immediately after, if the deployed code still works against the old schema during that short window

The first option is safer.

### If the migration is breaking or required immediately by the new code

Examples: renaming a column the new backend now expects, removing an old field, changing a constraint the new code depends on.

Do not rely on Railway to sort this out after merge. Use one of these approaches:

- apply the production migration before merging to `main`
- or temporarily disable/pause the `main` auto-deploy until the migration is applied, then re-enable deploys

If the new code reaches Railway before the schema is ready, the backend may fail requests or fail closed.

## How To Apply Supabase Migrations

Choose one approach.

### Option A: Supabase CLI

Recommended when you already manage the production project through the CLI.

1. Authenticate with Supabase locally.
2. Link the repo to the correct hosted project.
3. Push the pending migrations to production.

Typical flow:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Use this from the repo root so the CLI picks up the committed migration files under `supabase/migrations/`.

### Option B: Supabase dashboard / SQL editor

Use this when you are not using the CLI for production changes.

1. Open the production Supabase project.
2. Open the SQL editor.
3. Run the new migration files from [`supabase/migrations/`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/supabase/migrations) in filename order.
4. Confirm each script succeeds before running the next one.

Only apply the new migrations that are not already present in production.

## If Code Already Merged Before The Migration Ran

If `main` has already deployed and the new code needs schema changes that are not live yet:

1. Apply the missing production migration immediately.
2. Trigger a redeploy of the `backend` service.
3. Redeploy `frontend` too if the browser contract changed.
4. Re-run the verification checklist below.

## Post-Deploy Verification Checklist

Run this after every production deploy, with or without migrations:

- confirm the frontend Railway service is healthy at `/health`
- confirm the backend is healthy at `/api/health`
- submit a public lead/demo/pricing form and confirm it succeeds
- confirm admin sign-in works through Supabase auth
- confirm the Tavus admin dashboard loads
- confirm the live preview is still bounded and starts only through the backend
- confirm operational emails and reminder state still look correct if the deploy touched alerts or Tavus usage tracking

## Rollback Notes

- App-only problem: roll back by redeploying the last known good Railway release
- Schema problem: prefer a forward fix migration over hand-editing production tables
- App plus schema problem: restore app service first if possible, then apply the smallest safe schema correction

## Repository Paths Used By Railway

- frontend config: [`frontend/railway.json`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/frontend/railway.json)
- backend config: [`backend/railway.json`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/backend/railway.json)
- frontend Dockerfile: [`frontend/Dockerfile.railway`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/frontend/Dockerfile.railway)
- backend Dockerfile: [`backend/Dockerfile.railway`](/Users/sankal/Documents/professional/deep-patient-marketing/deep-patient-marketing/backend/Dockerfile.railway)
