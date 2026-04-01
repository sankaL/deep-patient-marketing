#!/bin/sh

set -eu

require_non_negative_integer() {
  value=$1
  name=$2

  case "$value" in
    ''|*[!0-9]*)
      echo "Error: $name must be a non-negative integer." >&2
      exit 1
      ;;
  esac
}

echo "Waiting for local Supabase database..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
SQL

for file in $(find /workspace/supabase/migrations -maxdepth 1 -name '*.sql' | sort); do
  name=$(basename "$file")
  applied=$(psql -Atqc "SELECT 1 FROM public.schema_migrations WHERE name = '$name' LIMIT 1;")
  if [ "$applied" = "1" ]; then
    continue
  fi

  echo "Applying migration $name"
  psql -v ON_ERROR_STOP=1 -f "$file"
  psql -v ON_ERROR_STOP=1 -c "INSERT INTO public.schema_migrations (name) VALUES ('$name') ON CONFLICT (name) DO NOTHING;"
done

bootstrap_api_key=${TAVUS_BOOTSTRAP_API_KEY:-${TAVUS_API_KEY:-}}
bootstrap_persona_id=${TAVUS_BOOTSTRAP_PERSONA_ID:-${TAVUS_PERSONA_ID:-}}
bootstrap_replica_id=${TAVUS_BOOTSTRAP_REPLICA_ID:-${TAVUS_REPLICA_ID:-}}
bootstrap_encryption_key=${TAVUS_API_KEY_ENCRYPTION_KEY:-}

if [ -z "${bootstrap_api_key:-}" ] || [ -z "${bootstrap_persona_id:-}" ] || [ -z "${bootstrap_replica_id:-}" ]; then
  echo "Skipping Tavus bootstrap seed because bootstrap env values are incomplete."
  exit 0
fi

if [ -z "${bootstrap_encryption_key:-}" ]; then
  echo "Error: TAVUS_API_KEY_ENCRYPTION_KEY must be set when bootstrapping a Tavus API key." >&2
  exit 1
fi

bootstrap_label=${TAVUS_BOOTSTRAP_KEY_LABEL:-Local preview key}
total_minutes=${TAVUS_BOOTSTRAP_TOTAL_MINUTES:-25}
low_quota_threshold_minutes=${TAVUS_BOOTSTRAP_LOW_QUOTA_THRESHOLD_MINUTES:-5}

require_non_negative_integer "$total_minutes" "TAVUS_BOOTSTRAP_TOTAL_MINUTES"
require_non_negative_integer "$low_quota_threshold_minutes" "TAVUS_BOOTSTRAP_LOW_QUOTA_THRESHOLD_MINUTES"

psql \
  -v ON_ERROR_STOP=1 \
  -v bootstrap_api_key="$bootstrap_api_key" \
  -v bootstrap_encryption_key="$bootstrap_encryption_key" \
  -v bootstrap_persona_id="$bootstrap_persona_id" \
  -v bootstrap_replica_id="$bootstrap_replica_id" \
  -v bootstrap_key_label="$bootstrap_label" \
  -v bootstrap_total_seconds="$((total_minutes * 60))" \
  -v bootstrap_low_quota_threshold_seconds="$((low_quota_threshold_minutes * 60))" \
  <<'SQL'
WITH existing_active_key AS (
    SELECT id
    FROM public.tavus_api_keys
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
),
inserted_key AS (
    INSERT INTO public.tavus_api_keys (
        api_key_secret,
        label,
        status,
        minutes_total_seconds,
        seconds_consumed_estimate,
        seconds_remaining_estimate,
        low_quota_threshold_seconds,
        activated_at
    )
    SELECT 'enc:' || armor(
               pgp_sym_encrypt(
                   :'bootstrap_api_key',
                   :'bootstrap_encryption_key',
                   'cipher-algo=aes256'
               )
           ),
           :'bootstrap_key_label',
           'active',
           :'bootstrap_total_seconds'::integer,
           0,
           :'bootstrap_total_seconds'::integer,
           :'bootstrap_low_quota_threshold_seconds'::integer,
           timezone('utc', now())
    WHERE NOT EXISTS (SELECT 1 FROM existing_active_key)
    RETURNING id
),
active_key AS (
    SELECT id FROM existing_active_key
    UNION ALL
    SELECT id FROM inserted_key
    LIMIT 1
)
INSERT INTO public.tavus_preview_scenarios (
    tavus_api_key_id,
    persona_id,
    replica_id,
    status,
    is_active
)
SELECT active_key.id,
       :'bootstrap_persona_id',
       :'bootstrap_replica_id',
       'active',
       true
FROM active_key
WHERE NOT EXISTS (
    SELECT 1
    FROM public.tavus_preview_scenarios
    WHERE is_active = true
);
SQL

echo "Local Supabase bootstrap finished."
