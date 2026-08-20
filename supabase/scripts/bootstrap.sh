#!/bin/sh

set -eu

echo "Waiting for local Supabase database..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
DECLARE
  extension_schema text;
BEGIN
  SELECT namespace.nspname
  INTO extension_schema
  FROM pg_extension AS extension
  JOIN pg_namespace AS namespace
    ON namespace.oid = extension.extnamespace
  WHERE extension.extname = 'pgcrypto';

  IF extension_schema IS NULL THEN
    CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
  ELSIF extension_schema <> 'extensions' THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END;
$$;

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

echo "Local database migrations are up to date."
