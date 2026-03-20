export type AnalyticsEventName =
  | "landing_view"
  | "package_view"
  | "assessment_started"
  | "assessment_submitted"
  | "checkout_started"
  | "payment_succeeded"
  | "login_success"
  | "signup_success"
  | "feedback_submitted";

export interface AnalyticsEventPayload {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function trackEvent(_name: AnalyticsEventName, _payload?: AnalyticsEventPayload) {
  if (typeof window === "undefined") {
    // For now, no-op on the server; future: pipe into logger or APM.
    return;
  }
}

