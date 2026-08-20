# Railway Deployment Runbook

The repository deploys as two Railway services:

- `frontend`, rooted at `frontend/`, is public.
- `backend`, rooted at `backend/`, is private and reachable by the frontend.

## Service Configuration

Set the frontend config path to `/frontend/railway.json` and provide:

- `BACKEND_UPSTREAM_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000`

Set the backend config path to `/backend/railway.json` and provide:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REQUEST_TIMEOUT_SECONDS`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SALES_EMAIL`
- `PRODUCT_VIDEO_URL`
- `BACKEND_CORS_ORIGINS` when additional browser origins are required

## Deploy Application Changes

Railway deploys the current checkout. Sync and verify it before deployment:

```bash
git checkout main
git pull --ff-only origin main
git status
railway up -s backend --ci
railway up -s frontend --ci
```

Verify `/health` on the frontend, `/api/health` through the frontend proxy, and both public form flows.

## Apply Supabase Migrations

Railway does not apply files in `supabase/migrations`. Apply pending migrations separately with the Supabase CLI or SQL editor.

For additive migrations, apply the migration before deploying dependent code. For a destructive cleanup migration that removes an unused feature, deploy the application cleanup first, verify the removed feature is no longer called, then apply the migration.

For migration `009_remove_tavus_preview.sql` specifically:

1. Deploy the frontend and backend cleanup.
2. Verify demo and pricing requests still persist.
3. Record current counts for `demo_requests` and `pricing_requests`.
4. Apply migration `009` to the hosted Supabase project.
5. Confirm the lead counts are unchanged and submit both forms again.

Typical CLI flow:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Only apply migrations that are not already recorded in the target environment.
