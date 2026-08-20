DO $$
DECLARE
    function_record record;
BEGIN
    FOR function_record IN
        SELECT
            namespace.nspname AS schema_name,
            procedure.proname AS function_name,
            pg_get_function_identity_arguments(procedure.oid) AS arguments
        FROM pg_proc AS procedure
        JOIN pg_namespace AS namespace
          ON namespace.oid = procedure.pronamespace
        WHERE namespace.nspname = 'public'
          AND procedure.proname = ANY (
              ARRAY[
                  'begin_tavus_key_rotation',
                  'capped_session_duration_seconds',
                  'close_expired_preview_sessions',
                  'complete_preview_session',
                  'complete_tavus_key_rotation',
                  'fail_tavus_key_rotation',
                  'get_preview_session_cleanup_context',
                  'get_tavus_preview_dashboard_runtime',
                  'get_tavus_preview_runtime',
                  'get_tavus_usage_metrics',
                  'mark_tavus_exhausted_denial_alert_sent',
                  'record_tavus_preview_denial',
                  'refresh_tavus_api_key_usage'
              ]
          )
    LOOP
        EXECUTE format(
            'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            function_record.schema_name,
            function_record.function_name,
            function_record.arguments
        );
    END LOOP;
END;
$$;

DROP TABLE IF EXISTS public.tavus_preview_denials CASCADE;
DROP TABLE IF EXISTS public.tavus_preview_sessions CASCADE;
DROP TABLE IF EXISTS public.tavus_key_rotations CASCADE;
DROP TABLE IF EXISTS public.tavus_preview_scenarios CASCADE;
DROP TABLE IF EXISTS public.tavus_api_keys CASCADE;

DROP TYPE IF EXISTS public.tavus_preview_denial_reason CASCADE;
DROP TYPE IF EXISTS public.tavus_key_rotation_status CASCADE;
DROP TYPE IF EXISTS public.tavus_preview_session_end_reason CASCADE;
DROP TYPE IF EXISTS public.tavus_preview_scenario_status CASCADE;
DROP TYPE IF EXISTS public.tavus_api_key_status CASCADE;
