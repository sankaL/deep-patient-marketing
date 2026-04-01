CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demo_request_source') THEN
        CREATE TYPE public.demo_request_source AS ENUM ('book_demo', 'live_preview');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tavus_api_key_status') THEN
        CREATE TYPE public.tavus_api_key_status AS ENUM (
            'active',
            'expiring',
            'exhausted',
            'rotating',
            'failed',
            'disabled'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tavus_preview_scenario_status') THEN
        CREATE TYPE public.tavus_preview_scenario_status AS ENUM (
            'active',
            'rotating',
            'failed',
            'disabled'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'tavus_preview_session_end_reason'
    ) THEN
        CREATE TYPE public.tavus_preview_session_end_reason AS ENUM (
            'client_closed',
            'window_unload',
            'timeout',
            'error',
            'abandoned'
        );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.demo_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (btrim(name) <> ''),
    email text NOT NULL CHECK (btrim(email) <> ''),
    team_size_text text,
    institution text,
    request_source public.demo_request_source NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pricing_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL CHECK (btrim(first_name) <> ''),
    last_name text NOT NULL CHECK (btrim(last_name) <> ''),
    email text NOT NULL CHECK (btrim(email) <> ''),
    institution text NOT NULL CHECK (btrim(institution) <> ''),
    org_size_bucket text NOT NULL CHECK (
        org_size_bucket IN (
            '1–50',
            '51–150',
            '151–250',
            '251–500',
            '501–1,000',
            '1,001–2,500',
            '2,500+'
        )
    ),
    source text,
    message text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.tavus_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_secret text NOT NULL CHECK (btrim(api_key_secret) <> ''),
    label text NOT NULL CHECK (btrim(label) <> ''),
    status public.tavus_api_key_status NOT NULL DEFAULT 'disabled',
    minutes_total_seconds integer NOT NULL CHECK (minutes_total_seconds >= 0),
    seconds_consumed_estimate integer NOT NULL DEFAULT 0 CHECK (seconds_consumed_estimate >= 0),
    seconds_remaining_estimate integer NOT NULL DEFAULT 0 CHECK (seconds_remaining_estimate >= 0),
    low_quota_threshold_seconds integer NOT NULL DEFAULT 0 CHECK (low_quota_threshold_seconds >= 0),
    low_quota_alert_sent_at timestamptz,
    activated_at timestamptz,
    deactivated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.tavus_preview_scenarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tavus_api_key_id uuid NOT NULL REFERENCES public.tavus_api_keys(id) ON DELETE RESTRICT,
    persona_id text NOT NULL CHECK (btrim(persona_id) <> ''),
    replica_id text NOT NULL CHECK (btrim(replica_id) <> ''),
    status public.tavus_preview_scenario_status NOT NULL DEFAULT 'disabled',
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.tavus_preview_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tavus_api_key_id uuid NOT NULL REFERENCES public.tavus_api_keys(id) ON DELETE RESTRICT,
    tavus_preview_scenario_id uuid NOT NULL REFERENCES public.tavus_preview_scenarios(id) ON DELETE RESTRICT,
    demo_request_id uuid REFERENCES public.demo_requests(id) ON DELETE SET NULL,
    conversation_id text NOT NULL UNIQUE CHECK (btrim(conversation_id) <> ''),
    started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    ended_at timestamptz,
    duration_seconds_estimate integer CHECK (duration_seconds_estimate IS NULL OR duration_seconds_estimate >= 0),
    end_reason public.tavus_preview_session_end_reason,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CHECK (
        (ended_at IS NULL AND duration_seconds_estimate IS NULL AND end_reason IS NULL)
        OR ended_at IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS tavus_api_keys_one_active_idx
    ON public.tavus_api_keys ((status))
    WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS tavus_preview_scenarios_one_active_idx
    ON public.tavus_preview_scenarios ((is_active))
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS demo_requests_created_at_idx
    ON public.demo_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS pricing_requests_created_at_idx
    ON public.pricing_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS tavus_preview_sessions_open_idx
    ON public.tavus_preview_sessions (tavus_api_key_id, started_at)
    WHERE ended_at IS NULL;

DROP TRIGGER IF EXISTS demo_requests_set_updated_at ON public.demo_requests;
CREATE TRIGGER demo_requests_set_updated_at
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pricing_requests_set_updated_at ON public.pricing_requests;
CREATE TRIGGER pricing_requests_set_updated_at
BEFORE UPDATE ON public.pricing_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tavus_api_keys_set_updated_at ON public.tavus_api_keys;
CREATE TRIGGER tavus_api_keys_set_updated_at
BEFORE UPDATE ON public.tavus_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tavus_preview_scenarios_set_updated_at ON public.tavus_preview_scenarios;
CREATE TRIGGER tavus_preview_scenarios_set_updated_at
BEFORE UPDATE ON public.tavus_preview_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tavus_preview_sessions_set_updated_at ON public.tavus_preview_sessions;
CREATE TRIGGER tavus_preview_sessions_set_updated_at
BEFORE UPDATE ON public.tavus_preview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.capped_session_duration_seconds(
    p_started_at timestamptz,
    p_finished_at timestamptz,
    p_cap_duration_seconds integer
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
    SELECT GREATEST(
        LEAST(
            FLOOR(EXTRACT(EPOCH FROM (p_finished_at - p_started_at)))::integer,
            p_cap_duration_seconds
        ),
        0
    );
$$;

CREATE OR REPLACE FUNCTION public.refresh_tavus_api_key_usage(
    p_tavus_api_key_id uuid
)
RETURNS TABLE (
    tavus_api_key_id uuid,
    tavus_api_key_status public.tavus_api_key_status,
    seconds_remaining_estimate integer,
    low_quota_threshold_seconds integer,
    low_quota_alert_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_seconds integer;
    consumed_seconds integer;
BEGIN
    SELECT minutes_total_seconds
    INTO total_seconds
    FROM public.tavus_api_keys
    WHERE id = p_tavus_api_key_id
    FOR UPDATE;

    IF total_seconds IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(duration_seconds_estimate), 0)
    INTO consumed_seconds
    FROM public.tavus_preview_sessions
    WHERE tavus_api_key_id = p_tavus_api_key_id
      AND duration_seconds_estimate IS NOT NULL;

    RETURN QUERY
    UPDATE public.tavus_api_keys
    SET seconds_consumed_estimate = consumed_seconds,
        seconds_remaining_estimate = GREATEST(total_seconds - consumed_seconds, 0),
        status = CASE
            WHEN GREATEST(total_seconds - consumed_seconds, 0) <= 0
                AND status IN ('active', 'expiring', 'exhausted')
                THEN 'exhausted'
            WHEN GREATEST(total_seconds - consumed_seconds, 0) > 0
                AND status = 'exhausted'
                THEN 'active'
            ELSE status
        END,
        activated_at = CASE
            WHEN status = 'active' AND activated_at IS NULL THEN timezone('utc', now())
            ELSE activated_at
        END
    WHERE id = p_tavus_api_key_id
    RETURNING id, status, seconds_remaining_estimate, low_quota_threshold_seconds, low_quota_alert_sent_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tavus_preview_runtime(
    p_now timestamptz,
    p_cap_duration_seconds integer
)
RETURNS TABLE (
    tavus_api_key_id uuid,
    api_key_secret text,
    api_key_label text,
    tavus_api_key_status public.tavus_api_key_status,
    live_seconds_remaining_estimate integer,
    low_quota_threshold_seconds integer,
    low_quota_alert_sent_at timestamptz,
    tavus_preview_scenario_id uuid,
    persona_id text,
    replica_id text,
    scenario_status public.tavus_preview_scenario_status
)
LANGUAGE sql
STABLE
AS $$
    WITH active_scenario AS (
        SELECT id,
               tavus_api_key_id,
               persona_id,
               replica_id,
               status
        FROM public.tavus_preview_scenarios
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1
    ),
    live_usage AS (
        SELECT ps.tavus_api_key_id,
               COALESCE(
                   SUM(
                       CASE
                           WHEN ps.ended_at IS NOT NULL THEN ps.duration_seconds_estimate
                           ELSE public.capped_session_duration_seconds(
                               ps.started_at,
                               p_now,
                               p_cap_duration_seconds
                           )
                       END
                   ),
                   0
               ) AS live_consumed_seconds
        FROM public.tavus_preview_sessions ps
        GROUP BY ps.tavus_api_key_id
    )
    SELECT k.id,
           k.api_key_secret,
           k.label,
           k.status,
           GREATEST(k.minutes_total_seconds - COALESCE(live_usage.live_consumed_seconds, 0), 0),
           k.low_quota_threshold_seconds,
           k.low_quota_alert_sent_at,
           active_scenario.id,
           active_scenario.persona_id,
           active_scenario.replica_id,
           active_scenario.status
    FROM active_scenario
    JOIN public.tavus_api_keys k
      ON k.id = active_scenario.tavus_api_key_id
    LEFT JOIN live_usage
      ON live_usage.tavus_api_key_id = k.id;
$$;

CREATE OR REPLACE FUNCTION public.complete_preview_session(
    p_preview_session_id uuid,
    p_end_reason public.tavus_preview_session_end_reason,
    p_ended_at timestamptz,
    p_cap_duration_seconds integer
)
RETURNS TABLE (
    preview_session_id uuid,
    already_completed boolean,
    duration_seconds_estimate integer,
    end_reason public.tavus_preview_session_end_reason,
    tavus_api_key_id uuid,
    tavus_api_key_status public.tavus_api_key_status,
    seconds_remaining_estimate integer,
    low_quota_threshold_seconds integer,
    low_quota_alert_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record public.tavus_preview_sessions%ROWTYPE;
    was_completed boolean;
    effective_end_at timestamptz;
BEGIN
    SELECT *
    INTO session_record
    FROM public.tavus_preview_sessions
    WHERE id = p_preview_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    was_completed := session_record.ended_at IS NOT NULL;

    IF NOT was_completed THEN
        effective_end_at := LEAST(
            GREATEST(p_ended_at, session_record.started_at),
            session_record.started_at + make_interval(secs => p_cap_duration_seconds)
        );

        UPDATE public.tavus_preview_sessions
        SET ended_at = effective_end_at,
            duration_seconds_estimate = public.capped_session_duration_seconds(
                session_record.started_at,
                effective_end_at,
                p_cap_duration_seconds
            ),
            end_reason = p_end_reason
        WHERE id = p_preview_session_id
        RETURNING *
        INTO session_record;
    END IF;

    RETURN QUERY
    WITH rollup AS (
        SELECT *
        FROM public.refresh_tavus_api_key_usage(session_record.tavus_api_key_id)
    )
    SELECT session_record.id,
           was_completed,
           COALESCE(session_record.duration_seconds_estimate, 0),
           COALESCE(session_record.end_reason, p_end_reason),
           rollup.tavus_api_key_id,
           rollup.tavus_api_key_status,
           rollup.seconds_remaining_estimate,
           rollup.low_quota_threshold_seconds,
           rollup.low_quota_alert_sent_at
    FROM rollup;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_expired_preview_sessions(
    p_now timestamptz,
    p_cap_duration_seconds integer
)
RETURNS TABLE (
    tavus_api_key_id uuid,
    tavus_api_key_status public.tavus_api_key_status,
    seconds_remaining_estimate integer,
    low_quota_threshold_seconds integer,
    low_quota_alert_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_key_id uuid;
BEGIN
    FOR affected_key_id IN
        WITH closed AS (
            UPDATE public.tavus_preview_sessions
            SET ended_at = started_at + make_interval(secs => p_cap_duration_seconds),
                duration_seconds_estimate = p_cap_duration_seconds,
                end_reason = 'timeout'
            WHERE ended_at IS NULL
              AND started_at <= p_now - make_interval(secs => p_cap_duration_seconds)
            RETURNING tavus_api_key_id
        )
        SELECT DISTINCT tavus_api_key_id
        FROM closed
    LOOP
        RETURN QUERY
        SELECT *
        FROM public.refresh_tavus_api_key_usage(affected_key_id);
    END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tavus_preview_runtime(timestamptz, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_preview_session(
    uuid,
    public.tavus_preview_session_end_reason,
    timestamptz,
    integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.close_expired_preview_sessions(timestamptz, integer) TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO service_role;

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_preview_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_preview_sessions ENABLE ROW LEVEL SECURITY;
