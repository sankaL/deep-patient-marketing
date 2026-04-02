DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tavus_key_rotation_status') THEN
        CREATE TYPE public.tavus_key_rotation_status AS ENUM (
            'started',
            'succeeded',
            'failed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tavus_preview_denial_reason') THEN
        CREATE TYPE public.tavus_preview_denial_reason AS ENUM ('exhausted');
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.tavus_key_rotations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email text NOT NULL CHECK (btrim(actor_email) <> ''),
    requested_label text,
    requested_replica_id text,
    status public.tavus_key_rotation_status NOT NULL DEFAULT 'started',
    previous_tavus_api_key_id uuid REFERENCES public.tavus_api_keys(id) ON DELETE SET NULL,
    previous_tavus_preview_scenario_id uuid REFERENCES public.tavus_preview_scenarios(id) ON DELETE SET NULL,
    new_tavus_api_key_id uuid REFERENCES public.tavus_api_keys(id) ON DELETE SET NULL,
    new_tavus_preview_scenario_id uuid REFERENCES public.tavus_preview_scenarios(id) ON DELETE SET NULL,
    created_persona_id text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.tavus_preview_denials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tavus_api_key_id uuid NOT NULL REFERENCES public.tavus_api_keys(id) ON DELETE RESTRICT,
    tavus_preview_scenario_id uuid NOT NULL REFERENCES public.tavus_preview_scenarios(id) ON DELETE RESTRICT,
    demo_request_id uuid REFERENCES public.demo_requests(id) ON DELETE SET NULL,
    reason public.tavus_preview_denial_reason NOT NULL,
    attempted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    sales_alert_sent boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS tavus_key_rotations_created_at_idx
    ON public.tavus_key_rotations (created_at DESC);

CREATE INDEX IF NOT EXISTS tavus_preview_denials_attempted_at_idx
    ON public.tavus_preview_denials (attempted_at DESC);

DROP TRIGGER IF EXISTS tavus_key_rotations_set_updated_at ON public.tavus_key_rotations;
CREATE TRIGGER tavus_key_rotations_set_updated_at
BEFORE UPDATE ON public.tavus_key_rotations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tavus_preview_denials_set_updated_at ON public.tavus_preview_denials;
CREATE TRIGGER tavus_preview_denials_set_updated_at
BEFORE UPDATE ON public.tavus_preview_denials
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.begin_tavus_key_rotation(
    p_actor_email text,
    p_requested_label text,
    p_requested_replica_id text
)
RETURNS TABLE (
    rotation_id uuid,
    previous_tavus_api_key_id uuid,
    previous_tavus_preview_scenario_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_key public.tavus_api_keys%ROWTYPE;
    active_scenario public.tavus_preview_scenarios%ROWTYPE;
    new_rotation_id uuid;
BEGIN
    SELECT *
    INTO active_scenario
    FROM public.tavus_preview_scenarios
    WHERE is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ACTIVE_SCENARIO_NOT_FOUND';
    END IF;

    SELECT *
    INTO active_key
    FROM public.tavus_api_keys
    WHERE id = active_scenario.tavus_api_key_id
    FOR UPDATE;

    IF EXISTS (
        SELECT 1
        FROM public.tavus_preview_sessions
        WHERE tavus_api_key_id = active_key.id
          AND ended_at IS NULL
    ) THEN
        RAISE EXCEPTION 'OPEN_PREVIEW_SESSIONS';
    END IF;

    UPDATE public.tavus_api_keys
    SET status = 'rotating'
    WHERE id = active_key.id;

    UPDATE public.tavus_preview_scenarios
    SET status = 'rotating'
    WHERE id = active_scenario.id;

    INSERT INTO public.tavus_key_rotations (
        actor_email,
        requested_label,
        requested_replica_id,
        status,
        previous_tavus_api_key_id,
        previous_tavus_preview_scenario_id
    )
    VALUES (
        lower(btrim(p_actor_email)),
        NULLIF(btrim(p_requested_label), ''),
        NULLIF(btrim(p_requested_replica_id), ''),
        'started',
        active_key.id,
        active_scenario.id
    )
    RETURNING id INTO new_rotation_id;

    RETURN QUERY
    SELECT new_rotation_id, active_key.id, active_scenario.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_tavus_key_rotation(
    p_rotation_id uuid,
    p_new_api_key_secret text,
    p_encryption_key text,
    p_new_label text,
    p_new_persona_id text,
    p_new_replica_id text,
    p_minutes_total_seconds integer,
    p_low_quota_threshold_seconds integer
)
RETURNS TABLE (
    tavus_api_key_id uuid,
    tavus_preview_scenario_id uuid,
    persona_id text,
    replica_id text,
    live_seconds_remaining_estimate integer,
    tavus_api_key_status public.tavus_api_key_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rotation_row public.tavus_key_rotations%ROWTYPE;
    new_key_id uuid;
    new_scenario_id uuid;
BEGIN
    SELECT *
    INTO rotation_row
    FROM public.tavus_key_rotations
    WHERE id = p_rotation_id
      AND status = 'started'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ROTATION_NOT_FOUND';
    END IF;

    UPDATE public.tavus_preview_scenarios
    SET is_active = false,
        status = 'disabled'
    WHERE id = rotation_row.previous_tavus_preview_scenario_id;

    UPDATE public.tavus_api_keys
    SET status = 'disabled',
        deactivated_at = timezone('utc', now())
    WHERE id = rotation_row.previous_tavus_api_key_id;

    INSERT INTO public.tavus_api_keys (
        api_key_secret,
        label,
        status,
        minutes_total_seconds,
        seconds_consumed_estimate,
        seconds_remaining_estimate,
        low_quota_threshold_seconds,
        low_quota_alert_sent_at,
        activated_at
    )
    VALUES (
        'enc:' || extensions.armor(
            extensions.pgp_sym_encrypt(
                btrim(p_new_api_key_secret),
                btrim(p_encryption_key),
                'cipher-algo=aes256'
            )
        ),
        COALESCE(NULLIF(btrim(p_new_label), ''), 'Rotated Tavus key'),
        'active',
        p_minutes_total_seconds,
        0,
        p_minutes_total_seconds,
        p_low_quota_threshold_seconds,
        NULL,
        timezone('utc', now())
    )
    RETURNING id INTO new_key_id;

    INSERT INTO public.tavus_preview_scenarios (
        tavus_api_key_id,
        persona_id,
        replica_id,
        status,
        is_active
    )
    VALUES (
        new_key_id,
        btrim(p_new_persona_id),
        btrim(p_new_replica_id),
        'active',
        true
    )
    RETURNING id INTO new_scenario_id;

    UPDATE public.tavus_key_rotations
    SET status = 'succeeded',
        new_tavus_api_key_id = new_key_id,
        new_tavus_preview_scenario_id = new_scenario_id,
        created_persona_id = btrim(p_new_persona_id),
        completed_at = timezone('utc', now())
    WHERE id = p_rotation_id;

    RETURN QUERY
    SELECT new_key_id,
           new_scenario_id,
           btrim(p_new_persona_id),
           btrim(p_new_replica_id),
           p_minutes_total_seconds,
           'active'::public.tavus_api_key_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_tavus_key_rotation(
    p_rotation_id uuid,
    p_error_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rotation_row public.tavus_key_rotations%ROWTYPE;
BEGIN
    SELECT *
    INTO rotation_row
    FROM public.tavus_key_rotations
    WHERE id = p_rotation_id
      AND status = 'started'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    UPDATE public.tavus_api_keys
    SET status = 'active'
    WHERE id = rotation_row.previous_tavus_api_key_id
      AND status = 'rotating';

    UPDATE public.tavus_preview_scenarios
    SET status = 'active',
        is_active = true
    WHERE id = rotation_row.previous_tavus_preview_scenario_id
      AND status = 'rotating';

    UPDATE public.tavus_key_rotations
    SET status = 'failed',
        error_message = NULLIF(left(p_error_message, 400), ''),
        completed_at = timezone('utc', now())
    WHERE id = p_rotation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_tavus_preview_denial(
    p_tavus_api_key_id uuid,
    p_tavus_preview_scenario_id uuid,
    p_demo_request_id uuid,
    p_reason public.tavus_preview_denial_reason
)
RETURNS TABLE (
    denial_id uuid,
    attempted_at timestamptz,
    demo_request_id uuid,
    should_send_sales_email boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    send_sales_email boolean;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.tavus_preview_denials
        WHERE tavus_api_key_id = p_tavus_api_key_id
          AND reason = p_reason
          AND sales_alert_sent = true
    )
    INTO send_sales_email;

    RETURN QUERY
    INSERT INTO public.tavus_preview_denials (
        tavus_api_key_id,
        tavus_preview_scenario_id,
        demo_request_id,
        reason,
        attempted_at,
        sales_alert_sent
    )
    VALUES (
        p_tavus_api_key_id,
        p_tavus_preview_scenario_id,
        p_demo_request_id,
        p_reason,
        timezone('utc', now()),
        send_sales_email
    )
    RETURNING id, attempted_at, demo_request_id, send_sales_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tavus_usage_metrics()
RETURNS TABLE (
    total_sessions bigint,
    unique_known_users bigint,
    exhausted_denial_count bigint
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        (SELECT COUNT(*) FROM public.tavus_preview_sessions),
        (
            SELECT COUNT(DISTINCT lower(dr.email))
            FROM public.tavus_preview_sessions ps
            JOIN public.demo_requests dr
              ON dr.id = ps.demo_request_id
            WHERE btrim(dr.email) <> ''
        ),
        (
            SELECT COUNT(*)
            FROM public.tavus_preview_denials
            WHERE reason = 'exhausted'
        );
$$;

GRANT EXECUTE ON FUNCTION public.begin_tavus_key_rotation(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_tavus_key_rotation(
    uuid,
    text,
    text,
    text,
    text,
    text,
    integer,
    integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_tavus_key_rotation(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_tavus_preview_denial(
    uuid,
    uuid,
    uuid,
    public.tavus_preview_denial_reason
) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tavus_usage_metrics() TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

DROP POLICY IF EXISTS tavus_key_rotations_service_role_all ON public.tavus_key_rotations;
CREATE POLICY tavus_key_rotations_service_role_all
ON public.tavus_key_rotations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS tavus_preview_denials_service_role_all ON public.tavus_preview_denials;
CREATE POLICY tavus_preview_denials_service_role_all
ON public.tavus_preview_denials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

ALTER TABLE public.tavus_key_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_preview_denials ENABLE ROW LEVEL SECURITY;
