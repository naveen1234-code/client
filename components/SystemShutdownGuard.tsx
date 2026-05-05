"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SystemShutdownOverlay from "./SystemShutdownOverlay";

type SystemStatus = {
  success?: boolean;
  maintenanceMode?: boolean;
  title?: string;
  headline?: string;
  message?: string;
};

const CONTROL_PATHS = ["/system-control"];

export default function SystemShutdownGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const apiBase = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://gym-ravana-backend.onrender.com"
    ).replace(/\/$/, "");
  }, []);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus | null>(null);

  const isControlPath = CONTROL_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

  useEffect(() => {
    let mounted = true;

    const fetchSystemStatus = async () => {
      try {
        const res = await fetch(`${apiBase}/api/system/status`, {
          cache: "no-store",
        });

        const data: SystemStatus = await res.json();

        if (mounted) {
          setStatus(data);
        }
      } catch {
        if (mounted) {
          setStatus(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSystemStatus();

    const interval = window.setInterval(fetchSystemStatus, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [apiBase]);

  if (loading) {
    return <>{children}</>;
  }

  if (status?.maintenanceMode && !isControlPath) {
    return (
      <SystemShutdownOverlay
        title={status.title || "GYM RAVANA DIGITAL SYSTEM"}
        headline={status.headline || "SYSTEM TEMPORARILY SHUT DOWN"}
        message={
          status.message ||
          "We are currently upgrading the Gym Ravana digital system. Please check back soon."
        }
      />
    );
  }

  return <>{children}</>;
}