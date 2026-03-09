"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PackageRow } from "@/lib/packages";

type Props = Readonly<{ packages: PackageRow[]; prefillPackageSlug?: string }>;

export default function AssessmentForm({ packages, prefillPackageSlug = "" }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const currentUrl = new URL(window.location.href);
    const utm = (key: string) => {
      const value = currentUrl.searchParams.get(key)?.trim();
      return value ? value : undefined;
    };
    const referrer = document.referrer.trim();
    const body = {
      first_name: fd.get("first_name") ?? "",
      last_name: fd.get("last_name") ?? "",
      email: fd.get("email") ?? "",
      phone: (fd.get("phone") as string) || undefined,
      country: (fd.get("country") as string) || undefined,
      package_slug: (fd.get("package_slug") as string) || undefined,
      message: (fd.get("message") as string) || undefined,
      travel_companions: (fd.get("travel_companions") as string) || undefined,
      budget_range: (fd.get("budget_range") as string) || undefined,
      utm_source: utm("utm_source"),
      utm_medium: utm("utm_medium"),
      utm_campaign: utm("utm_campaign"),
      utm_term: utm("utm_term"),
      utm_content: utm("utm_content"),
      landing_path: `${currentUrl.pathname}${currentUrl.search}`,
      referrer_url: referrer.length > 0 ? referrer : undefined,
      company_website: (fd.get("company_website") as string) || undefined,
    };

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage((data.error as string) || "Something went wrong. Please try again.");
        return;
      }
      const leadId = typeof data.lead_id === "string" ? data.lead_id : null;
      const recommendedSlug = typeof data.recommended_package_slug === "string" ? data.recommended_package_slug : "";
      if (leadId) {
        const params = new URLSearchParams({ lead_id: leadId });
        if (recommendedSlug) params.set("recommended_package_slug", recommendedSlug);
        router.push(`/assessment/proposal?${params.toString()}`);
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  const inputClass = "w-full rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-2";

  return (
    <>
      {status === "success" && (
        <div className="mb-8 rounded-xl border border-emerald-500/50 bg-emerald-950/50 p-5 text-emerald-200 text-sm" role="status">
          Thank you. We&apos;ve received your request and will be in touch soon.
        </div>
      )}

      {status === "error" && (
        <div className="mb-8 rounded-xl border border-red-500/50 bg-red-950/30 p-5 text-red-300 text-sm" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5" aria-labelledby="section-contact">
          <h2 id="section-contact" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Your details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClass}>First name *</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                maxLength={200}
                className={inputClass}
                placeholder="Jane"
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClass}>Last name *</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                maxLength={200}
                className={inputClass}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone <span className="text-zinc-500 font-normal">(optional)</span></label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={50}
              className={inputClass}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>Country <span className="text-zinc-500 font-normal">(optional)</span></label>
            <input
              id="country"
              name="country"
              type="text"
              maxLength={100}
              className={inputClass}
              placeholder="e.g. United States"
            />
          </div>
        </section>

        <section className="space-y-5 border-t border-zinc-800 pt-8" aria-labelledby="section-travel">
          <h2 id="section-travel" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Travel &amp; preferences</h2>
          <div>
            <label htmlFor="travel_companions" className={labelClass}>Who are you traveling with?</label>
            <select
              id="travel_companions"
              name="travel_companions"
              className={`${inputClass} min-h-[48px]`}
              aria-label="Travel companions"
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
            <label htmlFor="budget_range" className={labelClass}>Budget range (USD)</label>
            <select
              id="budget_range"
              name="budget_range"
              className={`${inputClass} min-h-[48px]`}
              aria-label="Budget range"
            >
              <option value="">Select (optional)</option>
              <option value="Under $3,000">Under $3,000</option>
              <option value="$3,000 – $5,000">$3,000 – $5,000</option>
              <option value="$5,000 – $10,000">$5,000 – $10,000</option>
              <option value="$10,000+">$10,000+</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="package_slug" className={labelClass}>Package interest</label>
            {packages.length > 0 ? (
              <select
                id="package_slug"
                name="package_slug"
                defaultValue={prefillPackageSlug}
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
                id="package_slug"
                name="package_slug"
                type="text"
                maxLength={100}
                defaultValue={prefillPackageSlug}
                placeholder="e.g. essential-care-journey"
                className={inputClass}
              />
            )}
          </div>
        </section>

        <section className="space-y-5 border-t border-zinc-800 pt-8" aria-labelledby="section-message">
          <h2 id="section-message" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Anything else?</h2>
          <div>
            <label htmlFor="message" className={labelClass}>Message <span className="text-zinc-500 font-normal">(optional)</span></label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={2000}
              className={`${inputClass} resize-y min-h-[120px]`}
              placeholder="Tell us about your goals, questions, or preferred dates…"
            />
          </div>
        </section>

        {/* Honeypot: hidden from users; bots fill it */}
        <div className="absolute -left-[9999px] top-0" aria-hidden="true">
          <label htmlFor="company_website">Company website</label>
          <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full min-h-[52px] rounded-full bg-white px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-60 disabled:pointer-events-none"
          >
            {status === "loading" ? "Sending…" : "Submit my evaluation"}
          </button>
          <p className="mt-3 text-center text-xs text-zinc-500">We respond within 24 hours. No commitment.</p>
        </div>
      </form>
    </>
  );
}
