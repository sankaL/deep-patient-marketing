export interface AdminSession {
  email: string;
}

export interface TavusDashboardResponse {
  active_key: {
    tavus_api_key_id: string;
    api_key_label: string;
    tavus_api_key_status: string;
    live_seconds_remaining_estimate: number;
    low_quota_threshold_seconds: number;
    low_quota_alert_sent_at: string | null;
  } | null;
  active_scenario: {
    tavus_preview_scenario_id: string;
    persona_id: string;
    replica_id: string;
    scenario_status: string;
  } | null;
  usage: {
    total_sessions: number;
    unique_known_users: number;
    exhausted_denial_count: number;
  };
  rotations: Array<{
    rotation_id: string;
    status: string;
    actor_email: string;
    requested_label: string | null;
    requested_replica_id: string | null;
    previous_tavus_api_key_id: string | null;
    previous_tavus_preview_scenario_id: string | null;
    new_tavus_api_key_id: string | null;
    new_tavus_preview_scenario_id: string | null;
    created_persona_id: string | null;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
  }>;
  recent_users: Array<{
    preview_session_id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds_estimate: number | null;
    request_source: string | null;
    name: string | null;
    email: string | null;
    institution: string | null;
  }>;
  recent_denials: Array<{
    denial_id: string;
    reason: string;
    attempted_at: string;
    sales_alert_sent: boolean;
    demo_request_id: string | null;
    name: string | null;
    email: string | null;
  }>;
}

interface ApiErrorPayload {
  detail?: string;
}

async function readJson<T>(response: Response): Promise<T | ApiErrorPayload | null> {
  return (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
}

function getErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (payload && typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  return fallback;
}

export async function fetchAdminSession(): Promise<AdminSession> {
  const response = await fetch("/api/admin/auth/session", {
    credentials: "same-origin",
  });
  const payload = await readJson<AdminSession>(response);
  if (!response.ok || !payload || !("email" in payload)) {
    throw new Error(
      getErrorMessage(
        payload as ApiErrorPayload | null,
        "Please sign in to continue.",
      ),
    );
  }
  return payload;
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const response = await fetch("/api/admin/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readJson<AdminSession>(response);
  if (!response.ok || !payload || !("email" in payload)) {
    throw new Error(
      getErrorMessage(
        payload as ApiErrorPayload | null,
        "Admin sign-in failed.",
      ),
    );
  }
  return payload;
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function fetchTavusDashboard(): Promise<TavusDashboardResponse> {
  const response = await fetch("/api/admin/tavus/dashboard", {
    credentials: "same-origin",
  });
  const payload = await readJson<TavusDashboardResponse>(response);
  if (!response.ok || !payload || !("usage" in payload)) {
    throw new Error(
      getErrorMessage(
        payload as ApiErrorPayload | null,
        "The admin dashboard is unavailable right now.",
      ),
    );
  }
  return payload;
}

export async function rotateTavusKey(
  apiKey: string,
  label: string,
): Promise<void> {
  const response = await fetch("/api/admin/tavus/rotate", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, label }),
  });
  const payload = await readJson<Record<string, unknown>>(response);
  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        payload as ApiErrorPayload | null,
        "The Tavus key rotation failed.",
      ),
    );
  }
}
