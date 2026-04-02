# Railway Deployment

This repository is set up for a two-service Railway deployment:

- `frontend` as the public service, rooted at `frontend/`
- `backend` as the private service, rooted at `backend/`

Each service has a committed Railway config file:

- `/frontend/railway.json`
- `/backend/railway.json`

Use those files as the custom config-as-code paths in Railway so the build and deploy behavior stays versioned with the repo.

## Railway service setup

### Backend service

- Connect `sankaL/deep-patient-marketing`
- Root directory: `backend`
- Custom config file: `/backend/railway.json`
- Trigger branch: `main`
- Networking: private only

### Frontend service

- Connect `sankaL/deep-patient-marketing`
- Root directory: `frontend`
- Custom config file: `/frontend/railway.json`
- Trigger branch: `main`
- Networking: public

Once each service is linked to GitHub and tracking `main`, Railway will auto-deploy on every push to that branch.

## Required variables

### Frontend service

- `BACKEND_UPSTREAM_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000`

This keeps browser requests same-origin on the public site while nginx proxies `/api` to the private backend service.

### Backend service

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

Recommended production hardening:

- `ADMIN_AUTH_COOKIE_SECURE=true`
- `ADMIN_AUTH_COOKIE_SAME_SITE=lax`

Set `MARKETING_SITE_URL` to the public URL users actually visit. If a custom domain is used, attach it to the `frontend` service before treating production as complete.

## Validation checklist

- `frontend` deploy becomes healthy at `/health`
- `backend` deploy becomes healthy at `/api/health`
- the public frontend can reach `/api/...` through nginx proxying
- admin login works through Supabase email auth
- the Tavus preview remains limited to the short, single-scenario marketing preview

## Notes

- Railway GitHub auto-deploy branch selection is controlled in each service's settings.
- The config files in this repo control builder, Dockerfile path, healthchecks, and restart policy for each deployment.
- Railway variables should be entered in the dashboard as service variables or shared variables; do not commit secrets to the repo.
