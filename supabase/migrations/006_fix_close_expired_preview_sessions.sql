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
            RETURNING public.tavus_preview_sessions.tavus_api_key_id
        )
        SELECT DISTINCT closed.tavus_api_key_id
        FROM closed
    LOOP
        RETURN QUERY
        SELECT *
        FROM public.refresh_tavus_api_key_usage(affected_key_id);
    END LOOP;
END;
$$;
