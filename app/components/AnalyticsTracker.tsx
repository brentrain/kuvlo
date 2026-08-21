"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "kuvlo_anonymous_visitor";
export const ANALYTICS_EXCLUDED_KEY = "kuvlo_analytics_excluded";

function deviceCategory() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || window.localStorage.getItem(ANALYTICS_EXCLUDED_KEY) === "true") return;

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

    const query = new URLSearchParams(window.location.search);
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        path: pathname,
        referrer,
        device: deviceCategory(),
        source: query.get("utm_source"),
        medium: query.get("utm_medium"),
        campaign: query.get("utm_campaign"),
        content: query.get("utm_content"),
      }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
