import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePatient } from "@/lib/auth";
import { branding } from "@/lib/branding";
import { createLogger } from "@/lib/logger";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import { getPublishedPackages } from "@/lib/packages";
import { getProgressForPatient } from "@/lib/clinical/progress";
import JourneyTimeline from "@/app/components/ui/JourneyTimeline";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";

function stepStatus(index: number, active: number): "completed" | "active" | "pending" {
  if (index < active) return "completed";
  if (index === active) return "active";
  return "pending";
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

  const packageBySlug = new Map(packages.map((p) => [p.slug, p]));
  const lead = leads[0] ?? null;
  const patientName = (profile.full_name ?? `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`).trim() || "there";
  const selectedSlug = lead ? (lead.recommended_package_slug ?? lead.package_slug) : null;
  const selectedPackage = selectedSlug ? packageBySlug.get(selectedSlug.trim()) : null;
  const booking = lead ? bookings.find((b) => b.lead_id === lead.id) : null;
  const consult = lead
    ? consultations
        .filter((c) => c.lead_id === lead.id)
        .sort((a, b) => new Date(b.scheduled_at ?? b.requested_at ?? 0).getTime() - new Date(a.scheduled_at ?? a.requested_at ?? 0).getTime())[0]
    : null;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const depositPaid = lead?.status === "deposit_paid" || booking?.deposit_paid === true;
  const nextAppointment = consult?.scheduled_at ? new Date(consult.scheduled_at).toLocaleString() : "To be scheduled";

  const progressIndex = depositPaid ? 2 : selectedPackage ? 1 : 0;
  const steps = [
    { label: "Assessment", icon: "📝" },
    { label: "Deposit", icon: "💳" },
    { label: "Coordination", icon: "🧭" },
    { label: "Treatment", icon: "🦷" },
    { label: "Recovery", icon: "🌿" },
  ];

  const journeyTimeline = [
    { id: "consult", title: "Consultation scheduled", subtitle: "Your initial consultation", status: stepStatus(0, progressIndex), icon: "✅", date: consult?.scheduled_at ? new Date(consult.scheduled_at).toLocaleDateString() : null },
    { id: "travel", title: "Travel plan", subtitle: "Flights and stay planning", status: stepStatus(1, progressIndex), icon: "✈️", date: booking?.start_date ?? null },
    { id: "procedure", title: "Procedure", subtitle: "Clinical treatment day", status: stepStatus(2, progressIndex), icon: "🦷", date: booking?.start_date ?? null },
    { id: "recovery", title: "Recovery", subtitle: "Post-treatment recovery", status: stepStatus(3, progressIndex), icon: "🛌", date: booking?.end_date ?? null },
    { id: "follow", title: "Follow-up", subtitle: "Final check and support", status: stepStatus(4, progressIndex), icon: "💬", date: null },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-zinc-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="text-xl font-bold text-emerald-600">{branding.productName}</Link>
        <nav className="mt-8 space-y-2 text-sm">
          <a className="block rounded-md bg-emerald-50 px-3 py-2 font-medium text-emerald-700">🏠 Dashboard</a>
          <a className="block rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100">🗺️ My Journey</a>
          <a className="block rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100">📅 Appointments</a>
          <a className="block rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100">💳 Payments</a>
          <a className="block rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100">💬 Messages</a>
        </nav>
        <div className="mt-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm font-semibold">{patientName}</p>
          <p className="text-xs text-zinc-500">Settings</p>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:ml-60 lg:px-8">
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-6">
          <h1 className="text-2xl font-semibold">Welcome back, {patientName} 👋</h1>
          <p className="mt-1 text-sm text-emerald-700">You&apos;re on track ✓</p>
          <p className="mt-2 text-sm text-zinc-600">Next appointment: {nextAppointment}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            {steps.map((s, idx) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${idx <= progressIndex ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}>
                  {s.icon}
                </span>
                <span className={idx <= progressIndex ? "text-emerald-700" : "text-zinc-500"}>{s.label}</span>
                {idx < steps.length - 1 ? <span className="text-zinc-400">→</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">Treatment plan 🦷</p>
            <p className="mt-2 text-sm text-zinc-700">{selectedPackage?.name ?? "Preparing your personalized plan"}</p>
            <p className="text-xs text-zinc-500">
              {selectedPackage?.duration_days ? `${selectedPackage.duration_days} days` : "Duration pending"} · {selectedPackage?.location ?? "Destination pending"}
            </p>
            <Link href="/packages" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">View details →</Link>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">Your deposit 💳</p>
            <p className="mt-2 text-2xl font-semibold">${(totalPaid / 100).toFixed(2)}</p>
            <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${depositPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {depositPaid ? "Paid ✓" : "Pending"}
            </p>
            <p className="text-xs text-zinc-500">{payments[0]?.created_at ? new Date(payments[0].created_at).toLocaleDateString() : "No payment date yet"}</p>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">Care coordinator 👤</p>
            <p className="mt-2 text-sm text-zinc-700">Being assigned...</p>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              WhatsApp
            </a>
          </article>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">My journey timeline</h2>
          <div className="mt-4">
            <JourneyTimeline steps={journeyTimeline as unknown as Array<{ id: string; title: string; subtitle: string; date?: string | null; status: "completed" | "active" | "pending"; icon: string }>} />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Your progress updates</h2>
          {progressList.length === 0 ? (
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
              Your specialist will share updates here after your first consultation 🦷
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {progressList.map((p) => (
                <article key={p.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-sm font-semibold text-zinc-900">{p.stage_label}</p>
                  <p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-zinc-700">{p.notes?.trim() || "Update added by specialist."}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-500">Assessments</p><p className="text-2xl font-bold">{leads.length}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-500">Bookings</p><p className="text-2xl font-bold">{bookings.length}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-500">Consultations</p><p className="text-2xl font-bold">{consultations.length}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-500">Payments</p><p className="text-2xl font-bold">{payments.length}</p></div>
        </section>
      </main>
      <FeedbackButton page="/patient" />
    </div>
  );
}
