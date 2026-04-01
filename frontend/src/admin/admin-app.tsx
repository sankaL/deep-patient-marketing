import { useEffect, useState } from "react";

import { fetchAdminSession, type AdminSession } from "@/admin/api";
import { AdminDashboardPage } from "@/admin/dashboard-page";
import { AdminLoginPage } from "@/admin/login-page";

export function AdminApp() {
  const pathname = window.location.pathname;
  const isLoginPath = pathname === "/admin/login";
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(!isLoginPath);

  useEffect(() => {
    if (isLoginPath) {
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      setIsLoading(true);
      try {
        const activeSession = await fetchAdminSession();
        if (!cancelled) {
          setSession(activeSession);
        }
      } catch {
        if (!cancelled) {
          window.location.replace("/admin/login");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [isLoginPath]);

  if (isLoginPath) {
    return <AdminLoginPage />;
  }

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#0c1114_0%,#152126_100%)] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/6 px-6 py-10 text-sm text-white/70 backdrop-blur">
          Loading admin session...
        </div>
      </div>
    );
  }

  return <AdminDashboardPage email={session.email} />;
}
