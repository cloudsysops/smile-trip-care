import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePatient } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import { getPublishedPackageBySlug, getPublishedPackages, type PackageRow } from "@/lib/packages";
import { getProgressForPatient } from "@/lib/clinical/progress";
import DashboardShellHeader from "@/app/components/dashboard/DashboardShellHeader";
import { DashboardStatsRow, type DashboardStatCard } from "@/app/components/dashboard/DashboardStatsRow";
import JourneyTimeline from "@/app/components/ui/JourneyTimeline";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";

const CARD =
  "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60";
const SECTION_TITLE = "text-xs font-semibold uppercase tracking-wider text-zinc-400";

function stepStatus(index: number, active: number): "completed" | "active" | "pending" {
  if (index < active) return "completed";
  if (index === active) return "active";
  return "pending";
}

function packageDestinationLabel(p: PackageRow): string | null {
  const loc = p.location?.trim();
  if (loc) return loc;
  const dest = p.destination_city?.trim();
  if (dest) return dest;
  const rec = p.recovery_city?.trim();
  if (rec) return rec;
  return null;
}

function packageDurationLabel(p: PackageRow): string | null {
  if (p.duration_days != null && p.duration_days > 0) return `${p.duration_days} days`;
  return null;
}

function pct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

function sparkFromCount(n: number): { day: string; value: number }[] {
  const len = Math.min(14, Math.max(1, n || 1));
  return Array.from({ length: len }, (_, i) => ({
    day: String(i + 1),
    value: n > 0 ? 1 + (i % 3) : 0,
  }));
}

export default async function PatientDashboardPage() {
  let profile;
  try {
    const ctx = await requirePatient();
    profile = ctx.profile;
  } catch {
    const log = createLogger(crypto.randomUUID());
    log.info("patient: requirePatient threw, redirecting to login");
    redirect("/login?next=/patient");
  }

  const email = profile.email ?? "";
  const [data, packages, progressList] = await Promise.all([
    getPatientDashboardData(email),
    getPublishedPackages(),
    getProgressForPatient(profile.id),
  ]);

  const leads = data.leads as Array<{
    id: string;
    first_name: string;
    last_name: string;
    status: string;
    package_slug: string | null;
    recommended_package_slug: string | null;
    created_at: string;
  }>;
  const bookings = data.bookings as Array<{
    id: string;
    lead_id: string;
    package_id: string | null;
    status: string;
    deposit_paid: boolean;
    deposit_cents: number | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  const consultations = data.consultations as Array<{
    id: string;
    lead_id: string;
    status: string;
    scheduled_at: string | null;
    requested_at: string | null;
  }>;
  const payments = data.payments as Array<{
    id: string;
    lead_id: string;
    status: string;
    amount_cents: number | null;
    created_at: string;
  }>;

  const packageByExact = new Map(packages.map((p) => [p.slug, p]));
  const packageBySlugLower = new Map(packages.map((p) => [p.slug.toLowerCase(), p]));
  const lead = leads[0] ?? null;
  const patientName = (profile.full_name ?? `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`).trim() || "there";
  const rawSlug =
    lead?.recommended_package_slug?.trim() || lead?.package_slug?.trim() || null;
  let selectedPackage: PackageRow | null = null;
  if (rawSlug) {
    selectedPackage =
      packageByExact.get(rawSlug) ?? packageBySlugLower.get(rawSlug.toLowerCase()) ?? null;
    if (!selectedPackage) {
      selectedPackage = await getPublishedPackageBySlug(rawSlug);
    }
  }
  const booking = lead ? bookings.find((b) => b.lead_id === lead.id) : null;
  const consult = lead
    ? consultations
        .filter((c) => c.lead_id === lead.id)
        .sort(
          (a, b) =>
            new Date(b.scheduled_at ?? b.requested_at ?? 0).getTime() -
            new Date(a.scheduled_at ?? a.requested_at ?? 0).getTime(),
        )[0]
    : null;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const depositPaid = lead?.status === "deposit_paid" || booking?.deposit_paid === true;
  const nextAppointment = consult?.scheduled_at ? new Date(consult.scheduled_at).toLocaleString() : "To be scheduled";

  const durationLine = selectedPackage ? packageDurationLabel(selectedPackage) : null;
  const destinationLine = selectedPackage ? packageDestinationLabel(selectedPackage) : null;
  const planDetailParts = [durationLine, destinationLine].filter(Boolean) as string[];

  const progressIndex = depositPaid ? 2 : selectedPackage ? 1 : 0;
  const steps = [
    { label: "Assessment", icon: "📝" },
    { label: "Deposit", icon: "💳" },
    { label: "Coordination", icon: "🧭" },
    { label: "Treatment", icon: "🦷" },
    { label: "Recovery", icon: "🌿" },
  ];

  const journeyTimeline = [
    {
      id: "consult",
      title: "Consultation scheduled",
      subtitle: "Your initial consultation",
      status: stepStatus(0, progressIndex),
      icon: "✅",
      date: consult?.scheduled_at ? new Date(consult.scheduled_at).toLocaleDateString() : null,
    },
    {
      id: "travel",
      title: "Travel plan",
      subtitle: "Flights and stay planning",
      status: stepStatus(1, progressIndex),
      icon: "✈️",
      date: booking?.start_date ?? null,
    },
    {
      id: "procedure",
      title: "Procedure",
      subtitle: "Clinical treatment day",
      status: stepStatus(2, progressIndex),
      icon: "🦷",
      date: booking?.start_date ?? null,
    },
    {
      id: "recovery",
      title: "Recovery",
      subtitle: "Post-treatment recovery",
      status: stepStatus(3, progressIndex),
      icon: "🛌",
      date: booking?.end_date ?? null,
    },
    {
      id: "follow",
      title: "Follow-up",
      subtitle: "Final check and support",
      status: stepStatus(4, progressIndex),
      icon: "💬",
      date: null,
    },
  ] as const;

  const sl = leads.length;
  const sb = bookings.length;
  const sc = consultations.length;
  const sp = payments.length;
  const statCards: DashboardStatCard[] = [
    {
      label: "Assessments",
      value: sl,
      trend: pct(sl, Math.max(1, sl - 1)),
      spark: sparkFromCount(sl),
      accent: "#22d3ee",
    },
    {
      label: "Bookings",
      value: sb,
      trend: pct(sb, Math.max(1, sb - 1)),
      spark: sparkFromCount(sb),
      accent: "#f59e0b",
    },
    {
      label: "Consultations",
      value: sc,
      trend: pct(sc, Math.max(1, sc - 1)),
      spark: sparkFromCount(sc),
      accent: "#10b981",
    },
    {
      label: "Payments",
      value: sp,
      trend: pct(sp, Math.max(1, sp - 1)),
      spark: sparkFromCount(sp),
      accent: "#a78bfa",
    },
  ];

  const mobileNav = [
    { href: "/patient", icon: "▣", label: "Dashboard", active: true },
    { href: "/patient#journey", icon: "🗺️", label: "Journey" },
    { href: "/patient#appointments", icon: "📅", label: "Appointments" },
    { href: "/patient#payments", icon: "💳", label: "Payments" },
  ] as const;
  const desktopNav = [
    { href: "/patient", label: "Dashboard", active: true },
    { href: "/patient#journey", label: "Journey" },
    { href: "/patient#appointments", label: "Appointments" },
    { href: "/patient#payments", label: "Payments" },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardShellHeader subtitle={patientName} mobileNav={mobileNav} desktopNav={desktopNav} />

      <main className="mx-auto max-w-6xl space-y-4 px-3 py-6 sm:px-6 sm:py-8">
        <DashboardStatsRow cards={statCards} />

        <section className={CARD}>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Welcome back, {patientName} 👋</h1>
          <p className="mt-1 text-sm text-emerald-400">You&apos;re on track ✓</p>
          <p className="mt-2 text-sm text-zinc-300" id="appointments">
            Next appointment: {nextAppointment}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            {steps.map((s, idx) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    idx <= progressIndex ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {s.icon}
                </span>
                <span className={idx <= progressIndex ? "text-emerald-300" : "text-zinc-500"}>{s.label}</span>
                {idx < steps.length - 1 ? <span className="text-zinc-600">→</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" id="payments">
          <article className={CARD}>
            <p className={SECTION_TITLE}>Treatment plan 🦷</p>
            {selectedPackage ? (
              <>
                <p className="mt-2 text-sm text-white">{selectedPackage.name}</p>
                <p className="text-xs text-zinc-400">
                  {planDetailParts.length > 0 ? planDetailParts.join(" · ") : "Details in your confirmation"}
                </p>
                <Link
                  href={rawSlug ? `/packages/${encodeURIComponent(rawSlug)}` : "/packages"}
                  className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:underline"
                >
                  View details →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-white">
                  {rawSlug ? "Your treatment package" : "Preparing your personalized plan"}
                </p>
                <p className="text-xs text-zinc-400">Your coordinator will confirm details soon</p>
                <Link href="/packages" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:underline">
                  Browse packages →
                </Link>
              </>
            )}
          </article>

          <article className={CARD}>
            <p className={SECTION_TITLE}>Your deposit 💳</p>
            <p className="mt-2 text-2xl font-semibold text-white">${(totalPaid / 100).toFixed(2)}</p>
            <p
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${
                depositPaid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {depositPaid ? "Paid ✓" : "Pending"}
            </p>
            <p className="text-xs text-zinc-500">
              {payments[0]?.created_at ? new Date(payments[0].created_at).toLocaleDateString() : "No payment date yet"}
            </p>
          </article>

          <article className={CARD}>
            <p className={SECTION_TITLE}>Care coordinator 👤</p>
            <p className="mt-2 text-sm text-zinc-300">Being assigned...</p>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              WhatsApp
            </a>
          </article>
        </section>

        <section className={CARD} id="journey">
          <h2 className={SECTION_TITLE}>My journey timeline</h2>
          <div className="mt-4">
            <JourneyTimeline
              steps={
                journeyTimeline as unknown as Array<{
                  id: string;
                  title: string;
                  subtitle: string;
                  date?: string | null;
                  status: "completed" | "active" | "pending";
                  icon: string;
                }>
              }
            />
          </div>
        </section>

        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Your progress updates</h2>
          {progressList.length === 0 ? (
            <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-3 text-sm text-zinc-400">
              Your specialist will share updates here after your first consultation 🦷
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {progressList.map((p) => (
                <article key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:bg-zinc-800/40">
                  <p className="text-sm font-semibold text-white">{p.stage_label}</p>
                  <p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-zinc-300">{p.notes?.trim() || "Update added by specialist."}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <FeedbackButton page="/patient" />
    </div>
  );
}
