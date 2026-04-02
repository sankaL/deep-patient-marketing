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
    SELECT k.minutes_total_seconds
    INTO total_seconds
    FROM public.tavus_api_keys AS k
    WHERE k.id = p_tavus_api_key_id
    FOR UPDATE;

    IF total_seconds IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(ps.duration_seconds_estimate), 0)
    INTO consumed_seconds
    FROM public.tavus_preview_sessions AS ps
    WHERE ps.tavus_api_key_id = p_tavus_api_key_id
      AND ps.duration_seconds_estimate IS NOT NULL;

    RETURN QUERY
    UPDATE public.tavus_api_keys AS k
    SET seconds_consumed_estimate = consumed_seconds,
        seconds_remaining_estimate = GREATEST(total_seconds - consumed_seconds, 0),
        status = CASE
            WHEN GREATEST(total_seconds - consumed_seconds, 0) <= 0
                AND k.status IN ('active', 'expiring', 'exhausted')
                THEN 'exhausted'
            WHEN GREATEST(total_seconds - consumed_seconds, 0) > 0
                AND k.status = 'exhausted'
                THEN 'active'
            ELSE k.status
        END,
        activated_at = CASE
            WHEN k.status = 'active' AND k.activated_at IS NULL THEN timezone('utc', now())
            ELSE k.activated_at
        END
    WHERE k.id = p_tavus_api_key_id
    RETURNING
        k.id,
        k.status,
        k.seconds_remaining_estimate,
        k.low_quota_threshold_seconds,
        k.low_quota_alert_sent_at;
END;
$$;
