ALTER TABLE public.tavus_api_keys
ADD COLUMN IF NOT EXISTS exhausted_attempt_alert_sent_at timestamptz;

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
    remaining_seconds integer;
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

    remaining_seconds := GREATEST(total_seconds - consumed_seconds, 0);

    RETURN QUERY
    UPDATE public.tavus_api_keys
    SET seconds_consumed_estimate = consumed_seconds,
        seconds_remaining_estimate = remaining_seconds,
        status = CASE
            WHEN remaining_seconds <= 0
                AND status IN ('active', 'expiring', 'exhausted')
                THEN 'exhausted'
            WHEN remaining_seconds > 0
                AND status = 'exhausted'
                THEN 'active'
            ELSE status
        END,
        activated_at = CASE
            WHEN status = 'active' AND activated_at IS NULL THEN timezone('utc', now())
            ELSE activated_at
        END,
        exhausted_attempt_alert_sent_at = CASE
            WHEN remaining_seconds > 0 THEN NULL
            ELSE exhausted_attempt_alert_sent_at
        END
    WHERE id = p_tavus_api_key_id
    RETURNING id, status, seconds_remaining_estimate, low_quota_threshold_seconds, low_quota_alert_sent_at;
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
    SELECT exhausted_attempt_alert_sent_at IS NULL
    INTO send_sales_email
    FROM public.tavus_api_keys
    WHERE id = p_tavus_api_key_id
    FOR UPDATE;

    IF send_sales_email IS NULL THEN
        send_sales_email := false;
    END IF;

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
        false
    )
    RETURNING id, attempted_at, demo_request_id, send_sales_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_tavus_exhausted_denial_alert_sent(
    p_denial_id uuid,
    p_tavus_api_key_id uuid,
    p_sent_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tavus_preview_denials
    SET sales_alert_sent = true
    WHERE id = p_denial_id;

    UPDATE public.tavus_api_keys
    SET exhausted_attempt_alert_sent_at = p_sent_at
    WHERE id = p_tavus_api_key_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_tavus_api_key_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_tavus_preview_denial(
    uuid,
    uuid,
    uuid,
    public.tavus_preview_denial_reason
) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_tavus_exhausted_denial_alert_sent(
    uuid,
    uuid,
    timestamptz
) TO service_role;
