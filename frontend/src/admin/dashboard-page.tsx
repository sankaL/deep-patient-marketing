import { type FormEvent, useEffect, useState, useRef } from "react";
import {
  Key,
  RotateCw,
  LogOut,
  ChevronDown,
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  X,
  Clock,
} from "lucide-react";

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
  const upperLabel = label.toUpperCase();
  const isFailed = ["FAILED", "ERROR", "EXHAUSTED"].includes(upperLabel);
  const isPending = ["PENDING", "PROCESSING", "WARNING"].includes(upperLabel);

  let colorClasses = "border-brand-sage/20 bg-brand-sage/10 text-brand-sage";
  if (isFailed) {
    colorClasses = "border-red-500/20 bg-red-500/10 text-red-600";
  } else if (isPending) {
    colorClasses = "border-amber-500/20 bg-amber-500/10 text-amber-600";
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClasses}`}>
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

  // New UI states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"rotations" | "activity">("rotations");

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      // Keep success message visible inside modal so user knows it completed
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f0_0%,#eddcc6_100%)] text-brand-forest">
      {/* Header section with wider max width */}
      <header className="sticky top-0 z-40 border-b border-black/[0.04] bg-white/60 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-sage/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-sage border border-brand-sage/20 shadow-sm">
              Admin Portal
            </span>
            <h1 className="text-xl font-bold tracking-tight text-brand-forest sm:text-2xl">
              Tavus Operations
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Primary Action to pop out modal */}
            <button
              type="button"
              onClick={() => {
                setRotateError(null);
                setRotateSuccess(null);
                setIsRotateModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-brand-sage px-4 py-2.5 text-xs font-semibold text-brand-forest-dark shadow-[0_4px_12px_rgba(139,158,133,0.2)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:shadow-sm"
            >
              <RotateCw className="size-3.5" />
              <span>Rotate active key</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-full border border-black/8 bg-white/80 p-1.5 pr-3 text-sm font-semibold transition hover:bg-white active:scale-98 shadow-sm"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-brand-forest text-white text-xs font-bold uppercase">
                  {email.charAt(0)}
                </div>
                <span className="hidden text-xs text-brand-forest/80 max-w-[120px] truncate md:inline">
                  {email}
                </span>
                <ChevronDown className={`size-3 text-brand-forest/50 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-black/8 bg-white/95 p-2 shadow-xl backdrop-blur-md animate-fade-in">
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/45">
                      Signed in as
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-brand-forest/90">
                      {email}
                    </p>
                  </div>
                  <div className="my-1 border-t border-black/6" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-700 shadow-sm flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-black/8 bg-white/50 text-sm text-brand-forest/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <RotateCw className="size-8 animate-spin text-brand-sage" />
              <span>Loading Tavus admin state...</span>
            </div>
          </div>
        ) : null}

        {dashboard && !isLoading ? (
          <>
            {/* Exactly 3 KPI Cards with proper visual hierarchy */}
            <section className="grid gap-6 md:grid-cols-3">
              {/* Card 1: Active Key */}
              <div className="group relative overflow-hidden rounded-3xl border border-black/6 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/45">
                      Active API Key
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight text-brand-forest group-hover:text-brand-sage transition duration-200">
                      {dashboard.active_key?.api_key_label ?? "No active key"}
                    </h2>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-sage/10 text-brand-sage border border-brand-sage/20 group-hover:bg-brand-sage group-hover:text-white transition-all duration-300">
                    <Key className="size-5" />
                  </div>
                </div>

                {dashboard.active_key ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                      <span className="text-xs text-brand-forest/60">Status</span>
                      <StatusPill label={dashboard.active_key.tavus_api_key_status} />
                    </div>
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                      <span className="text-xs text-brand-forest/60">Remaining Estimate</span>
                      <span className="text-xs font-bold text-brand-forest">
                        {formatMinutes(dashboard.active_key.live_seconds_remaining_estimate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                      <span className="text-xs text-brand-forest/60">Low-quota Alert Threshold</span>
                      <span className="text-xs text-brand-forest/80">
                        {formatMinutes(dashboard.active_key.low_quota_threshold_seconds)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-forest/60">Alert Sent Time</span>
                      <span className="text-xs text-brand-forest/80">
                        {formatDate(dashboard.active_key.low_quota_alert_sent_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-brand-forest/50">No API key parameters loaded.</p>
                )}
              </div>

              {/* Card 2: Active Scenario */}
              <div className="group relative overflow-hidden rounded-3xl border border-black/6 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/45">
                      Active Scenario
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight text-brand-forest">
                      {dashboard.active_scenario?.scenario_status ? (
                        <span className="capitalize">{dashboard.active_scenario.scenario_status}</span>
                      ) : (
                        "Not configured"
                      )}
                    </h2>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-sage/10 text-brand-sage border border-brand-sage/20 group-hover:bg-brand-sage group-hover:text-white transition-all duration-300">
                    <Activity className="size-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {dashboard.active_scenario ? (
                    <>
                      <div className="flex flex-col border-b border-black/[0.04] pb-2 gap-0.5">
                        <span className="text-[10px] text-brand-forest/50 uppercase tracking-wider">Persona ID</span>
                        <span className="text-xs font-mono font-medium text-brand-forest truncate select-all" title={dashboard.active_scenario.persona_id}>
                          {dashboard.active_scenario.persona_id}
                        </span>
                      </div>
                      <div className="flex flex-col border-b border-black/[0.04] pb-2 gap-0.5">
                        <span className="text-[10px] text-brand-forest/50 uppercase tracking-wider">Replica ID</span>
                        <span className="text-xs font-mono font-medium text-brand-forest truncate select-all" title={dashboard.active_scenario.replica_id}>
                          {dashboard.active_scenario.replica_id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-brand-forest/60">Tavus Config Scenario ID</span>
                        <span className="text-xs font-mono font-medium text-brand-forest/80 truncate max-w-[140px]" title={dashboard.active_scenario.tavus_preview_scenario_id}>
                          {dashboard.active_scenario.tavus_preview_scenario_id.slice(0, 8)}...
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-brand-forest/50">Active scenario config is missing.</p>
                  )}
                </div>
              </div>

              {/* Card 3: Usage Summary */}
              <div className="group relative overflow-hidden rounded-3xl border border-black/6 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/45">
                      Usage Summary
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight text-brand-forest">
                      {dashboard.usage.total_sessions} <span className="text-xs font-medium text-brand-forest/50">total sessions</span>
                    </h2>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-sage/10 text-brand-sage border border-brand-sage/20 group-hover:bg-brand-sage group-hover:text-white transition-all duration-300">
                    <Users className="size-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-black/[0.04] pb-4">
                    <div className="rounded-2xl bg-black/[0.02] p-3 text-center border border-black/[0.03]">
                      <span className="block text-lg font-bold text-brand-forest">
                        {dashboard.usage.unique_known_users}
                      </span>
                      <span className="text-[10px] text-brand-forest/50 uppercase font-semibold">Known Users</span>
                    </div>
                    <div className="rounded-2xl bg-black/[0.02] p-3 text-center border border-black/[0.03]">
                      <span className="block text-lg font-bold text-red-600">
                        {dashboard.usage.exhausted_denial_count}
                      </span>
                      <span className="text-[10px] text-brand-forest/50 uppercase font-semibold">Exhausted Denials</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-forest/60">Platform Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Logs Section with beautiful Segmented Tab Switching */}
            <section className="rounded-3xl border border-black/6 bg-white/70 p-6 shadow-sm backdrop-blur-md space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-brand-forest">
                    Operations & User Logs
                  </h2>
                  <p className="text-xs text-brand-forest/50">
                    Audit trail for key rotations, active learner interactions, and denied access records.
                  </p>
                </div>

                {/* Segmented control buttons */}
                <div className="inline-flex rounded-full border border-black/6 bg-black/[0.03] p-1 shadow-inner self-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab("rotations")}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeTab === "rotations"
                        ? "bg-white text-brand-forest shadow"
                        : "text-brand-forest/60 hover:text-brand-forest"
                    }`}
                  >
                    <Calendar className="size-3.5" />
                    <span>Rotation History</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("activity")}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeTab === "activity"
                        ? "bg-white text-brand-forest shadow"
                        : "text-brand-forest/60 hover:text-brand-forest"
                    }`}
                  >
                    <Activity className="size-3.5" />
                    <span>User Activity</span>
                  </button>
                </div>
              </div>

              {/* Toggle Content - Rotation History Table */}
              {activeTab === "rotations" && (
                <div className="overflow-x-auto rounded-2xl border border-black/6 bg-white/90">
                  {dashboard.rotations.length === 0 ? (
                    <div className="py-12 text-center text-sm text-brand-forest/50">
                      No key rotations recorded yet.
                    </div>
                  ) : (
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.06] bg-black/[0.01] text-brand-forest/50 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-4 px-6">Label / Purpose</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Actor</th>
                          <th className="py-4 px-6">Created At</th>
                          <th className="py-4 px-6">Created Persona</th>
                          <th className="py-4 px-6">Replica ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04] text-brand-forest/80">
                        {dashboard.rotations.map((rotation) => (
                          <tr key={rotation.rotation_id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="py-4 px-6 font-semibold text-brand-forest">
                              {rotation.requested_label ?? "Rotated Tavus key"}
                            </td>
                            <td className="py-4 px-6">
                              <StatusPill label={rotation.status} />
                            </td>
                            <td className="py-4 px-6 font-mono text-xs">{rotation.actor_email}</td>
                            <td className="py-4 px-6 text-xs">{formatDate(rotation.created_at)}</td>
                            <td className="py-4 px-6">
                              {rotation.created_persona_id ? (
                                <span className="font-mono text-xs text-brand-forest bg-black/[0.03] px-2 py-1 rounded select-all" title={rotation.created_persona_id}>
                                  {rotation.created_persona_id}
                                </span>
                              ) : (
                                <span className="text-brand-forest/30">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-mono text-xs">
                              {rotation.requested_replica_id ?? "r4ba1277e4fb"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Toggle Content - User Activity Log (Two side-by-side tables) */}
              {activeTab === "activity" && (
                <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
                  {/* Table A: Recent Preview Users */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-brand-forest uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>Recent Users ({dashboard.recent_users.length})</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-black/6 bg-white/90">
                      <table className="w-full min-w-[550px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/[0.06] bg-black/[0.01] text-brand-forest/50 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4">User</th>
                            <th className="py-3.5 px-4">Source</th>
                            <th className="py-3.5 px-4">Duration</th>
                            <th className="py-3.5 px-4">Started At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04] text-brand-forest/80">
                          {dashboard.recent_users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-brand-forest/40">
                                No active preview users recorded.
                              </td>
                            </tr>
                          ) : (
                            dashboard.recent_users.map((user) => (
                              <tr key={user.preview_session_id} className="hover:bg-black/[0.01] transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-brand-forest">
                                    {user.name ?? "Anonymous preview user"}
                                  </div>
                                  <div className="text-[10px] text-brand-forest/50 font-mono">
                                    {user.email ?? "No email captured"}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-xs bg-black/[0.03] text-brand-forest/70 px-2 py-0.5 rounded-full border border-black/[0.04]">
                                    {user.request_source ?? "Unknown"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs font-mono font-semibold flex items-center gap-1.5 mt-2">
                                  <Clock className="size-3 text-brand-forest/40" />
                                  <span>
                                    {user.duration_seconds_estimate !== null
                                      ? `${user.duration_seconds_estimate}s`
                                      : "Active session"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs text-brand-forest/60">
                                  {formatDate(user.started_at)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table B: Exhausted Access attempts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                        <span>Exhausted Access Denials ({dashboard.recent_denials.length})</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-black/6 bg-white/90">
                      <table className="w-full min-w-[550px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/[0.06] bg-black/[0.01] text-brand-forest/50 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4">Email / User</th>
                            <th className="py-3.5 px-4">Reason</th>
                            <th className="py-3.5 px-4">Sales Alert</th>
                            <th className="py-3.5 px-4">Attempted At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04] text-brand-forest/80">
                          {dashboard.recent_denials.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-brand-forest/40">
                                No exhausted preview denials recorded.
                              </td>
                            </tr>
                          ) : (
                            dashboard.recent_denials.map((denial) => (
                              <tr key={denial.denial_id} className="hover:bg-black/[0.01] transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-brand-forest">
                                    {denial.name ?? "Anonymous attempt"}
                                  </div>
                                  <div className="text-[10px] text-brand-forest/50 font-mono">
                                    {denial.email ?? "No email"}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <StatusPill label={denial.reason} />
                                </td>
                                <td className="py-3 px-4">
                                  {denial.sales_alert_sent ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-800 border border-red-200">
                                      Alerted
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-brand-forest/40">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-xs text-brand-forest/60">
                                  {formatDate(denial.attempted_at)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      {/* Pop-Out Backdrop Modal for Key Rotation */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-black/8 bg-[#10181c] p-6 text-white shadow-2xl transition-all scale-100 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setIsRotateModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-sage/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-sage border border-brand-sage/20">
                Action Required
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Rotate Active API Key
            </h2>

            <p className="mt-2.5 text-xs leading-5 text-white/60">
              The backend will create a new persona from the scenario config, keep
              replica <span className="font-semibold text-white">r4ba1277e4fb</span>,
              reset remaining time to 25 minutes, and switch the active preview to the
              new key.
            </p>

            <form onSubmit={handleRotate} className="mt-6 space-y-5">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    New Tavus API key
                  </span>
                  <input
                    type="password"
                    required
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs text-white outline-none transition focus:border-brand-sage/60 focus:bg-white/[0.07]"
                    placeholder="Paste the replacement Tavus API key"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Label / Purpose
                  </span>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs text-white outline-none transition focus:border-brand-sage/60 focus:bg-white/[0.07]"
                    placeholder="e.g., April rotation, Spring Update"
                  />
                </label>
              </div>

              {rotateError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-red-400" />
                  <span>{rotateError}</span>
                </div>
              ) : null}

              {rotateSuccess ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
                  <Activity className="size-4 shrink-0 text-emerald-400" />
                  <span>{rotateSuccess}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRotateModalOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRotating}
                  className="flex items-center gap-2 rounded-full bg-brand-sage px-6 py-3 text-xs font-bold text-brand-forest-dark transition hover:brightness-105 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRotating ? (
                    <>
                      <RotateCw className="size-3.5 animate-spin" />
                      <span>Rotating key...</span>
                    </>
                  ) : (
                    <span>Rotate Key</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
