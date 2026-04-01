import { type FormEvent, useState } from "react";

import { loginAdmin } from "@/admin/api";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await loginAdmin(email.trim(), password);
      window.location.replace("/admin");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Admin sign-in failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0c1114_0%,#152126_100%)] px-6 py-12 text-brand-cream">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.8)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sage">
            DeepPatient Admin
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Sign in to manage Tavus rotation
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/68">
            This internal page shows the current Tavus preview state, remaining minutes,
            key rotation history, and recent live-preview usage.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sage/60"
                placeholder="team@deeppatient.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sage/60"
                placeholder="Password"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-brand-sage px-5 py-3 text-sm font-semibold text-brand-forest-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
