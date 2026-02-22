type AnalyticsValue = string | number | boolean;
type AnalyticsPayload = Record<string, AnalyticsValue | undefined>;

interface AnalyticsBridge {
  track?: (eventName: string, payload?: Record<string, AnalyticsValue>) => void;
  logEvent?: (eventName: string, payload?: Record<string, AnalyticsValue>) => void;
}

function getWindowAny(): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as unknown as Record<string, unknown>;
}

function pickAnalyticsBridge(): AnalyticsBridge | null {
  const target = getWindowAny();
  if (!target) {
    return null;
  }

  const candidates: unknown[] = [target.Analytics, target.analytics, target.TossAnalytics];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const bridge = candidate as AnalyticsBridge;
    if (typeof bridge.track === "function" || typeof bridge.logEvent === "function") {
      return bridge;
    }
  }

  return null;
}

function compactPayload(payload: AnalyticsPayload): Record<string, AnalyticsValue> {
  const next: Record<string, AnalyticsValue> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    next[key] = value;
  });
  return next;
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}): void {
  const compact = compactPayload(payload);
  const bridge = pickAnalyticsBridge();

  try {
    if (bridge && typeof bridge.track === "function") {
      bridge.track(eventName, compact);
      return;
    }

    if (bridge && typeof bridge.logEvent === "function") {
      bridge.logEvent(eventName, compact);
      return;
    }
  } catch (error) {
    console.error("[analytics] failed", error);
  }

  if (import.meta.env.DEV) {
    console.info("[analytics]", eventName, compact);
  }
}
