"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PackageRow } from "@/lib/packages";

const STORAGE_KEY = "assessment-wizard-draft";
const STEPS = ["Treatment", "Smile history", "Timeline", "Contact"];

type WizardData = {
  package_slug: string;
  treatment_focus: string;
  smile_history: string;
  message: string;
  travel_companions: string;
  budget_range: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
};

const defaultData: WizardData = {
  package_slug: "",
  treatment_focus: "",
  smile_history: "",
  message: "",
  travel_companions: "",
  budget_range: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country: "",
};

type Props = Readonly<{ packages: PackageRow[]; prefillPackageSlug?: string }>;

export default function AssessmentWizard({ packages, prefillPackageSlug = "" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => {
    if (typeof window === "undefined") return { ...defaultData, package_slug: prefillPackageSlug };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardData>;
        return { ...defaultData, ...parsed, package_slug: parsed.package_slug ?? prefillPackageSlug };
      }
    } catch {
      /* ignore */
    }
    return { ...defaultData, package_slug: prefillPackageSlug };
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const persist = useCallback((next: WizardData) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const update = (updates: Partial<WizardData>) => {
    const next = { ...data, ...updates };
    persist(next);
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-2";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const currentUrl = new URL(window.location.href);
    const utm = (k: string) => currentUrl.searchParams.get(k)?.trim() || undefined;
    const rawReferrer = document.referrer?.trim() || "";
    let referrer_url: string | undefined;
    if (rawReferrer) {
      try {
        new URL(rawReferrer);
        referrer_url = rawReferrer.length <= 2000 ? rawReferrer : undefined;
      } catch {
        referrer_url = undefined;
      }
    } else {
      referrer_url = undefined;
    }
    const body = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || undefined,
      country: data.country || undefined,
      package_slug: data.package_slug || undefined,
      message: [data.smile_history, data.message].filter(Boolean).join("\n\n") || undefined,
      travel_companions: data.travel_companions || undefined,
      budget_range: data.budget_range || undefined,
      selected_specialties: data.treatment_focus ? [data.treatment_focus] : undefined,
      utm_source: utm("utm_source"),
      utm_medium: utm("utm_medium"),
      utm_campaign: utm("utm_campaign"),
      utm_term: utm("utm_term"),
      utm_content: utm("utm_content"),
      landing_path: `${currentUrl.pathname}${currentUrl.search}`,
      referrer_url,
      company_website: "",
    };

    setStatus("loading");
    setErrorMessage("");
    const requestUrl = `${currentUrl.origin}/api/leads`;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resData = await res.json().catch(() => ({}));
      if (process.env.NODE_ENV === "development") {
        console.warn("[Assessment submit]", {
          requestUrl,
          responseStatus: res.status,
          responseBody: resData,
          redirectUrl: res.ok && typeof resData.lead_id === "string"
            ? `/assessment/proposal?${new URLSearchParams({ lead_id: resData.lead_id, ...(resData.recommended_package_slug && { recommended_package_slug: resData.recommended_package_slug }) }).toString()}`
            : null,
        });
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMessage((resData.error as string) || "Something went wrong. Please try again.");
        return;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      const leadId = typeof resData.lead_id === "string" ? resData.lead_id : null;
      const recommendedSlug = typeof resData.recommended_package_slug === "string" ? resData.recommended_package_slug : "";
      if (leadId) {
        const params = new URLSearchParams({ lead_id: leadId });
        if (recommendedSlug) params.set("recommended_package_slug", recommendedSlug);
        router.push(`/assessment/proposal?${params.toString()}`);
        return;
      }
      // Fallback: if the API returned 2xx but no lead_id (e.g. honeypot or atypical success),
      // still show a clear success state instead of leaving the user on the form.
      router.push("/thank-you");
      setStatus("idle");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Assessment submit error]", { requestUrl, error: err });
      }
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Progress bar only — no global nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
            >
              ← Home
            </Link>
            <div className="flex flex-1 max-w-xs mx-4 gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500 tabular-nums">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-300">{STEPS[step]}</p>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
        {status === "error" && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/30 p-4 text-red-300 text-sm" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Step 0: Treatment Selection */}
        {step === 0 && (
          <section className="space-y-6" aria-labelledby="step-treatment">
            <h2 id="step-treatment" className="text-xl font-serif font-normal text-white">
              Treatment selection
            </h2>
            <p className="text-sm text-zinc-400">
              What are you looking for? We&apos;ll tailor your evaluation.
            </p>
            <fieldset className="space-y-3">
              <legend className="sr-only">Primary focus</legend>
              {[
                { value: "Dental Implants", label: "Implant" },
                { value: "Veneers", label: "Veneers" },
                { value: "Hollywood Smile", label: "Hollywood smile" },
                { value: "General", label: "Consultation" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-600 bg-zinc-900/60 px-4 py-3 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-950/30"
                >
                  <input
                    type="radio"
                    name="treatment_focus"
                    value={opt.value}
                    checked={data.treatment_focus === opt.value}
                    onChange={() => update({ treatment_focus: opt.value })}
                    className="h-4 w-4 border-zinc-500 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-white">{opt.label}</span>
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor="wizard-package_slug" className={labelClass}>
                Package interest
              </label>
              {packages.length > 0 ? (
                <select
                  id="wizard-package_slug"
                  value={data.package_slug}
                  onChange={(e) => update({ package_slug: e.target.value })}
                  className={`${inputClass} min-h-[48px]`}
                >
                  <option value="">Select a package (optional)</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="wizard-package_slug"
                  type="text"
                  value={data.package_slug}
                  onChange={(e) => update({ package_slug: e.target.value })}
                  placeholder="e.g. comfort-recovery-journey"
                  className={inputClass}
                  maxLength={100}
                />
              )}
            </div>
          </section>
        )}

        {/* Step 1: Smile History */}
        {step === 1 && (
          <section className="space-y-6" aria-labelledby="step-history">
            <h2 id="step-history" className="text-xl font-serif font-normal text-white">
              Smile history
            </h2>
            <p className="text-sm text-zinc-400">
              Helps us personalize your plan.
            </p>
            <fieldset className="space-y-3">
              <legend className="sr-only">Your smile history</legend>
              {[
                "First time exploring options",
                "I\u2019ve had some work done",
                "Looking to replace or upgrade",
                "Not sure yet",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-600 bg-zinc-900/60 px-4 py-3 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-950/30"
                >
                  <input
                    type="radio"
                    name="smile_history"
                    value={opt}
                    checked={data.smile_history === opt}
                    onChange={() => update({ smile_history: opt })}
                    className="h-4 w-4 border-zinc-500 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-white">{opt}</span>
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor="wizard-message" className={labelClass}>
                Anything else? (optional)
              </label>
              <textarea
                id="wizard-message"
                value={data.message}
                onChange={(e) => update({ message: e.target.value })}
                rows={3}
                maxLength={2000}
                className={`${inputClass} resize-y min-h-[80px]`}
                placeholder="Goals, current situation, or questions…"
              />
            </div>
          </section>
        )}

        {/* Step 2: Timeline */}
        {step === 2 && (
          <section className="space-y-6" aria-labelledby="step-timeline">
            <h2 id="step-timeline" className="text-xl font-serif font-normal text-white">
              Timeline
            </h2>
            <p className="text-sm text-zinc-400">
              Helps us suggest the right package and timing.
            </p>
            <div>
              <label htmlFor="wizard-travel_companions" className={labelClass}>
                Who are you traveling with?
              </label>
              <select
                id="wizard-travel_companions"
                value={data.travel_companions}
                onChange={(e) => update({ travel_companions: e.target.value })}
                className={`${inputClass} min-h-[48px]`}
              >
                <option value="">Select (optional)</option>
                <option value="Solo">Solo</option>
                <option value="Partner">Partner</option>
                <option value="Family">Family</option>
                <option value="Group">Group</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label htmlFor="wizard-budget_range" className={labelClass}>
                Budget range (USD)
              </label>
              <select
                id="wizard-budget_range"
                value={data.budget_range}
                onChange={(e) => update({ budget_range: e.target.value })}
                className={`${inputClass} min-h-[48px]`}
              >
                <option value="">Select (optional)</option>
                <option value="Under $3,000">Under $3,000</option>
                <option value="$3,000 – $5,000">$3,000 – $5,000</option>
                <option value="$5,000 – $10,000">$5,000 – $10,000</option>
                <option value="$10,000+">$10,000+</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </section>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6" id="wizard-form">
            <section className="space-y-6" aria-labelledby="step-contact">
<h2 id="step-contact" className="text-xl font-serif font-normal text-white">
              Contact info
            </h2>
              <p className="text-sm text-zinc-400">
                We’ll only need the basics to send your personalized plan—no commitment. Response typically within 24 hours.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="wizard-first_name" className={labelClass}>
                    First name *
                  </label>
                  <input
                    id="wizard-first_name"
                    type="text"
                    required
                    maxLength={200}
                    value={data.first_name}
                    onChange={(e) => update({ first_name: e.target.value })}
                    className={inputClass}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label htmlFor="wizard-last_name" className={labelClass}>
                    Last name *
                  </label>
                  <input
                    id="wizard-last_name"
                    type="text"
                    required
                    maxLength={200}
                    value={data.last_name}
                    onChange={(e) => update({ last_name: e.target.value })}
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="wizard-email" className={labelClass}>
                  Email *
                </label>
                <input
                  id="wizard-email"
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="wizard-phone" className={labelClass}>
                  Phone <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  id="wizard-phone"
                  type="tel"
                  maxLength={50}
                  value={data.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className={inputClass}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label htmlFor="wizard-country" className={labelClass}>
                  Country <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  id="wizard-country"
                  type="text"
                  maxLength={100}
                  value={data.country}
                  onChange={(e) => update({ country: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. United States"
                />
              </div>
            </section>
            <p className="text-xs text-zinc-500">
              We only use this for coordination. We don’t collect sensitive medical data here.
            </p>
            <div className="pt-4">
              <button
                type="submit"
                form="wizard-form"
                disabled={status === "loading"}
                className="w-full min-h-[52px] rounded-full bg-white px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-60 disabled:pointer-events-none"
              >
                {status === "loading" ? "Sending…" : "Submit my evaluation"}
              </button>
              <p className="mt-3 text-center text-xs text-zinc-500">We respond within 24 hours. No commitment.</p>
            </div>
          </form>
        )}

        {/* Nav: Next / Back (not on step 3 submit form) */}
        {step < 3 && (
          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-full border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
