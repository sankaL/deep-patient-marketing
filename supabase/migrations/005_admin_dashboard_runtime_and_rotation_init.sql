CREATE OR REPLACE FUNCTION public.get_tavus_preview_dashboard_runtime(
    p_now timestamptz,
    p_cap_duration_seconds integer
)
RETURNS TABLE (
    tavus_api_key_id uuid,
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

    IF FOUND THEN
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
    END IF;

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

GRANT EXECUTE ON FUNCTION public.get_tavus_preview_dashboard_runtime(
    timestamptz,
    integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_tavus_key_rotation(text, text, text) TO service_role;
