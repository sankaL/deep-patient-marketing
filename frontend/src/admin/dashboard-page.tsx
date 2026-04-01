import { type FormEvent, useEffect, useState } from "react";

import {
  fetchTavusDashboard,
  logoutAdmin,
  rotateTavusKey,
  type TavusDashboardResponse,
} from "@/admin/api";

function formatMinutes(seconds: number): string {
  return `${(Math.max(seconds, 0) / 60).toFixed(1)} min`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }
  return new Date(value).toLocaleString();
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-brand-sage/20 bg-brand-sage/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-sage">
      {label}
    </span>
  );
}

interface AdminDashboardPageProps {
  email: string;
}

export function AdminDashboardPage({ email }: AdminDashboardPageProps) {
  const [dashboard, setDashboard] = useState<TavusDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [rotateSuccess, setRotateSuccess] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDashboard(await fetchTavusDashboard());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The admin dashboard is unavailable right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleRotate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRotateError(null);
    setRotateSuccess(null);
    setIsRotating(true);

    try {
      await rotateTavusKey(apiKey.trim(), label.trim());
      setApiKey("");
      setLabel("");
      setRotateSuccess("The Tavus key was rotated and the new persona is now active.");
      await loadDashboard();
    } catch (submitError) {
      setRotateError(
        submitError instanceof Error
          ? submitError.message
          : "The Tavus key rotation failed.",
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4efe5_0%,#e6dccd_100%)] px-6 py-10 text-brand-forest">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] border border-black/8 bg-white/70 p-8 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.45)] backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sage">
              Hidden admin portal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Tavus rotation and preview operations
            </h1>
            <p className="mt-3 text-sm leading-6 text-brand-forest/70">
              Signed in as {email}. This page tracks the active preview key, remaining
              minutes, recent usage, and exhausted access attempts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-brand-forest/12 px-5 py-3 text-sm font-semibold text-brand-forest transition hover:bg-brand-forest/5"
          >
            Sign out
          </button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-black/8 bg-white/70 px-5 py-10 text-sm text-brand-forest/60">
            Loading Tavus admin state...
          </div>
        ) : null}

        {dashboard ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-forest/45">
                  Active key
                </p>
                <h2 className="mt-3 text-xl font-semibold">
                  {dashboard.active_key?.api_key_label ?? "No active key"}
                </h2>
                {dashboard.active_key ? (
                  <div className="mt-4 space-y-3 text-sm text-brand-forest/70">
                    <StatusPill label={dashboard.active_key.tavus_api_key_status} />
                    <p>Remaining: {formatMinutes(dashboard.active_key.live_seconds_remaining_estimate)}</p>
                    <p>Low-quota threshold: {formatMinutes(dashboard.active_key.low_quota_threshold_seconds)}</p>
                    <p>Alert sent: {formatDate(dashboard.active_key.low_quota_alert_sent_at)}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-forest/45">
                  Active scenario
                </p>
                <div className="mt-4 space-y-3 text-sm text-brand-forest/70">
                  <p>Persona ID: {dashboard.active_scenario?.persona_id ?? "Not configured"}</p>
                  <p>Replica ID: {dashboard.active_scenario?.replica_id ?? "Not configured"}</p>
                  {dashboard.active_scenario ? (
                    <StatusPill label={dashboard.active_scenario.scenario_status} />
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-forest/45">
                  Usage summary
                </p>
                <div className="mt-4 space-y-3 text-sm text-brand-forest/70">
                  <p>Total sessions: {dashboard.usage.total_sessions}</p>
                  <p>Unique known users: {dashboard.usage.unique_known_users}</p>
                  <p>Exhausted denials: {dashboard.usage.exhausted_denial_count}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <form
                onSubmit={handleRotate}
                className="rounded-3xl border border-black/8 bg-[#10181c] p-6 text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.7)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                  Rotate active key
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Create a new Tavus persona and activate it
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  The backend will create a new persona from the scenario config, keep
                  replica <span className="font-semibold text-white">r4ba1277e4fb</span>,
                  reset remaining time to 25 minutes, and switch the active preview to the
                  new key.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      New Tavus API key
                    </span>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sage/60"
                      placeholder="Paste the replacement Tavus API key"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      Label
                    </span>
                    <input
                      type="text"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sage/60"
                      placeholder="April rotation"
                    />
                  </label>
                </div>

                {rotateError ? (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {rotateError}
                  </div>
                ) : null}

                {rotateSuccess ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {rotateSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isRotating}
                  className="mt-6 rounded-full bg-brand-sage px-5 py-3 text-sm font-semibold text-brand-forest-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRotating ? "Rotating key..." : "Rotate key"}
                </button>
              </form>

              <section className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-forest/45">
                  Rotation history
                </p>
                <div className="mt-5 space-y-3">
                  {dashboard.rotations.length === 0 ? (
                    <p className="text-sm text-brand-forest/60">No key rotations recorded yet.</p>
                  ) : (
                    dashboard.rotations.map((rotation) => (
                      <div
                        key={rotation.rotation_id}
                        className="rounded-2xl border border-black/6 bg-white px-4 py-4 text-sm text-brand-forest/72"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="font-semibold text-brand-forest">
                            {rotation.requested_label ?? "Rotated Tavus key"}
                          </div>
                          <StatusPill label={rotation.status} />
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <p>Actor: {rotation.actor_email}</p>
                          <p>Created: {formatDate(rotation.created_at)}</p>
                          <p>Persona: {rotation.created_persona_id ?? "Pending"}</p>
                          <p>Replica: {rotation.requested_replica_id ?? "r4ba1277e4fb"}</p>
                        </div>
                        {rotation.error_message ? (
                          <p className="mt-3 text-red-700">{rotation.error_message}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-forest/45">
                  Recent users
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-brand-forest/45">
                      <tr>
                        <th className="pb-3 pr-4 font-semibold">User</th>
                        <th className="pb-3 pr-4 font-semibold">Source</th>
                        <th className="pb-3 pr-4 font-semibold">Duration</th>
                        <th className="pb-3 font-semibold">Started</th>
                      </tr>
                    </thead>
                    <tbody className="align-top text-brand-forest/72">
                      {dashboard.recent_users.map((user) => (
                        <tr key={user.preview_session_id} className="border-t border-black/6">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-brand-forest">
                              {user.name ?? "Anonymous preview user"}
                            </div>
                            <div className="text-xs text-brand-forest/55">
                              {user.email ?? "No email captured"}
                            </div>
                          </td>
                          <td className="py-3 pr-4">{user.request_source ?? "Unknown"}</td>
                          <td className="py-3 pr-4">
                            {user.duration_seconds_estimate !== null
                              ? `${user.duration_seconds_estimate}s`
                              : "In progress"}
                          </td>
                          <td className="py-3">{formatDate(user.started_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-3xl border border-black/8 bg-white/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-forest/45">
                  Exhausted access attempts
                </p>
                <div className="mt-5 space-y-3">
                  {dashboard.recent_denials.length === 0 ? (
                    <p className="text-sm text-brand-forest/60">
                      No exhausted preview denials recorded.
                    </p>
                  ) : (
                    dashboard.recent_denials.map((denial) => (
                      <div
                        key={denial.denial_id}
                        className="rounded-2xl border border-black/6 bg-white px-4 py-4 text-sm text-brand-forest/72"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="font-semibold text-brand-forest">
                            {denial.email ?? denial.name ?? "Anonymous attempt"}
                          </div>
                          <StatusPill label={denial.reason} />
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <p>Attempted: {formatDate(denial.attempted_at)}</p>
                          <p>Sales alert sent: {denial.sales_alert_sent ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
