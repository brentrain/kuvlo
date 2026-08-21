"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "kuvlo_anonymous_visitor";

function deviceCategory() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    let visitorId = window.localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, visitorId);
    }

    let referrer: string | null = null;
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname : null;
    } catch {
      referrer = null;
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, path: pathname, referrer, device: deviceCategory() }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}

