CREATE OR REPLACE FUNCTION public.get_tavus_preview_runtime(
    p_now timestamptz,
    p_cap_duration_seconds integer,
    p_encryption_key text
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
           CASE
               WHEN k.api_key_secret LIKE 'enc:%'
                   THEN extensions.pgp_sym_decrypt(
                       extensions.dearmor(substr(k.api_key_secret, 5)),
                       btrim(p_encryption_key)
                   )
               ELSE k.api_key_secret
           END,
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

GRANT EXECUTE ON FUNCTION public.get_tavus_preview_runtime(timestamptz, integer, text) TO service_role;
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
