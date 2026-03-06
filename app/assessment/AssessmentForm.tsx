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
      if (leadId) {
        router.push(`/thank-you?lead_id=${encodeURIComponent(leadId)}`);
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <>
      {status === "success" && (
        <div className="mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
          Thank you. We&apos;ve received your request and will be in touch soon.
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1">
              First name *
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              maxLength={200}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1">
              Last name *
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              maxLength={200}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={50}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            maxLength={100}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="package_slug" className="block text-sm font-medium mb-1">
            Package interest
          </label>
          {packages.length > 0 ? (
            <select
              id="package_slug"
              name="package_slug"
              defaultValue={prefillPackageSlug}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">Select a package</option>
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
              placeholder="e.g. smile-medellin"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            />
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Honeypot: hidden from users; bots fill it */}
        <div className="absolute -left-[9999px] top-0" aria-hidden="true">
          <label htmlFor="company_website">Company website</label>
          <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Sending…" : "Submit"}
        </button>
      </form>
    </>
  );
}
