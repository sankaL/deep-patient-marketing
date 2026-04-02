CREATE OR REPLACE FUNCTION public.get_preview_session_cleanup_context(
    p_preview_session_id uuid,
    p_encryption_key text
)
RETURNS TABLE (
    preview_session_id uuid,
    conversation_id text,
    api_key_secret text,
    already_completed boolean
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        ps.id,
        ps.conversation_id,
        CASE
            WHEN k.api_key_secret LIKE 'enc:%'
                THEN extensions.pgp_sym_decrypt(
                    extensions.dearmor(substr(k.api_key_secret, 5)),
                    btrim(p_encryption_key)
                )
            ELSE k.api_key_secret
        END,
        ps.ended_at IS NOT NULL
    FROM public.tavus_preview_sessions AS ps
    JOIN public.tavus_api_keys AS k
      ON k.id = ps.tavus_api_key_id
    WHERE ps.id = p_preview_session_id
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_preview_session_cleanup_context(uuid, text) TO service_role;
