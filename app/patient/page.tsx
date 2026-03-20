import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePatient } from "@/lib/auth";
import { branding } from "@/lib/branding";
import { createLogger } from "@/lib/logger";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import { getPublishedPackages, getPackageWithRelations } from "@/lib/packages";
import { getSpecialistById } from "@/lib/specialists";
import PatientDepositButton from "./PatientDepositButton";
import TreatmentPlanSection from "@/app/components/dashboard/TreatmentPlanSection";
import TravelPlanSection from "@/app/components/dashboard/TravelPlanSection";
import TreatmentTimelineSection from "@/app/components/dashboard/TreatmentTimelineSection";
import CareCoordinatorSection from "@/app/components/dashboard/CareCoordinatorSection";
import AftercareSection from "@/app/components/dashboard/AftercareSection";
import TreatmentProgressTimeline from "@/app/components/dashboard/TreatmentProgressTimeline";
import PatientNextStepCard from "@/app/components/dashboard/PatientNextStepCard";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import { getProgressForPatient } from "@/lib/clinical/progress";
import type { PackageWithRelations } from "@/lib/packages";

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
  const leads = data.leads as { id: string; first_name: string; last_name: string; email: string; status: string; package_slug: string | null; recommended_package_slug: string | null; created_at: string }[];
  const bookings = data.bookings as { id: string; lead_id: string; package_id: string | null; status: string; total_price_usd: number | null; deposit_paid: boolean; deposit_cents: number | null; start_date: string | null; end_date: string | null }[];
  const consultations = data.consultations as { id: string; lead_id: string; specialist_id: string; status: string; requested_at: string | null; scheduled_at: string | null }[];
  const payments = data.payments as { id: string; lead_id: string; status: string; amount_cents: number | null; created_at: string }[];

  const packageBySlug = new Map(packages.map((p) => [p.slug, p]));
  const packageById = new Map(packages.map((p) => [p.id, p]));
  const leadWithRecommendation = leads.find((l) => (l.recommended_package_slug ?? l.package_slug)?.trim());
  const travelPackage = leadWithRecommendation
    ? packageBySlug.get((leadWithRecommendation.recommended_package_slug ?? leadWithRecommendation.package_slug)!.trim())
    : null;
  const activeBooking = leadWithRecommendation
    ? bookings.find((b) => b.lead_id === leadWithRecommendation.id)
    : null;
  const activePackageId = activeBooking?.package_id ?? travelPackage?.id ?? null;
  let packageWithRelations: PackageWithRelations | null = null;
  let primarySpecialistName: string | null = null;
  if (activePackageId) {
    packageWithRelations = await getPackageWithRelations(activePackageId);
    const primaryLink = packageWithRelations?.package_specialists?.find((ps) => ps.is_primary)
      ?? packageWithRelations?.package_specialists?.[0];
    if (primaryLink) {
      const spec = await getSpecialistById(primaryLink.specialist_id);
      primarySpecialistName = spec?.name ?? null;
    }
  }
  const pkgForJourney = travelPackage ?? (activeBooking?.package_id ? packageById.get(activeBooking.package_id) : null);
  const consultationForLead = leadWithRecommendation
    ? consultations.filter((c) => c.lead_id === leadWithRecommendation.id).sort((a, b) => {
        const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return db - da;
      })[0]
    : null;
  const hasDepositPaid = leadWithRecommendation?.status === "deposit_paid" || activeBooking?.deposit_paid === true;
  const showJourneyPortal = pkgForJourney != null;

  const now = new Date();
  const consultationDate = consultationForLead?.scheduled_at ? new Date(consultationForLead.scheduled_at) : null;
  const travelStart = activeBooking?.start_date ? new Date(activeBooking.start_date) : null;
  const travelEnd = activeBooking?.end_date ? new Date(activeBooking.end_date) : null;
  let currentStepIndex = 0;
  if (consultationDate && now < consultationDate) currentStepIndex = 0;
  else if (travelStart && now < travelStart) currentStepIndex = 1;
  else if (travelEnd && now <= travelEnd) currentStepIndex = 2;
  else if (travelEnd && now > travelEnd) currentStepIndex = 3;
  else currentStepIndex = 4;
  const stepStatus = (i: number): "completed" | "current" | "upcoming" =>
    i < currentStepIndex ? "completed" : i === currentStepIndex ? "current" : "upcoming";
  const timelineSteps = [
    { id: "consultation", label: "Consultation", status: stepStatus(0), detail: consultationDate ? consultationDate.toLocaleDateString(undefined, { dateStyle: "medium" }) : (hasDepositPaid ? "To be scheduled" : "After assessment") },
    { id: "travel", label: "Travel", status: stepStatus(1), detail: travelStart && travelEnd ? `${travelStart.toLocaleDateString()} – ${travelEnd.toLocaleDateString()}` : (activeBooking ? "Dates to be confirmed" : null) },
    { id: "procedure", label: "Procedure", status: stepStatus(2), detail: travelStart ? "At clinic" : null },
    { id: "recovery", label: "Recovery", status: stepStatus(3), detail: travelEnd ? `From ${travelEnd.toLocaleDateString()}` : null },
    { id: "follow-up", label: "Follow-up", status: stepStatus(4), detail: "Post-recovery check" },
  ];

  const includedList = Array.isArray(pkgForJourney?.included) ? pkgForJourney.included as string[] : (pkgForJourney?.includes ?? []) as string[] | undefined;
  const includedText = Array.isArray(includedList) ? includedList.join(" ") : "";
  const hasTransfer = /transfer|airport|transport/i.test(includedText);
  const hasHotel = /hotel|lodging|accommodation|stay/i.test(includedText);

  const progressByNewest = [...progressList].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestProgress = progressByNewest[0]
    ? { stage_key: progressByNewest[0].stage_key, stage_label: progressByNewest[0].stage_label, status: progressByNewest[0].status, notes: progressByNewest[0].notes }
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Patient dashboard"
        homeHref="/"
        homeLabel={branding.productName}
        navItems={[
          { href: "/patient", label: "My journey", active: true },
          { href: "/assessment", label: "New assessment" },
        ]}
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <DashboardLayout
          title="My journey"
          description="Your treatment plan, travel details, and clinical progress in one place."
        >
          <DashboardSection title="Profile">
            <div className="mb-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Profile</p>
              <p className="mt-1 text-xs text-zinc-300">Your account and contact details.</p>
              <p className="mt-2 font-semibold text-zinc-50">
                {profile.full_name || profile.email || "—"}
              </p>
              <p className="mt-0.5 text-sm text-zinc-300">{profile.email}</p>
            </div>
          </DashboardSection>

          {showJourneyPortal && pkgForJourney && (
            <DashboardSection
              title="Your journey"
              description="Treatment plan, travel, and high-level timeline."
            >
              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <TreatmentPlanSection
                  procedureType={pkgForJourney.name}
                  estimatedDuration={
                    pkgForJourney.duration_days != null
                      ? `${pkgForJourney.duration_days} days`
                      : null
                  }
                  clinic={packageWithRelations?.provider_name ?? null}
                  doctor={primarySpecialistName}
                />
                <TravelPlanSection
                  city={pkgForJourney.location ?? null}
                  recommendedDates={
                    activeBooking?.start_date && activeBooking?.end_date
                      ? `${new Date(activeBooking.start_date).toLocaleDateString()} – ${new Date(
                          activeBooking.end_date,
                        ).toLocaleDateString()}`
                      : activeBooking
                        ? "Dates to be confirmed"
                        : null
                  }
                  airportTransfer={
                    hasTransfer
                      ? "Included in package"
                      : includedText
                        ? "See package details"
                        : null
                  }
                  hotelSuggestion={
                    hasHotel
                      ? "Included in package"
                      : includedText
                        ? "See package details"
                        : null
                  }
                />
              </div>
              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <TreatmentTimelineSection steps={timelineSteps} />
                <CareCoordinatorSection coordinatorName={null} />
              </div>
              <div className="mb-2">
                <AftercareSection instructions={null} />
              </div>
            </DashboardSection>
          )}

          <DashboardSection
            title="Clinical progress"
            description="Updates from your care team and where you are in your journey."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <TreatmentProgressTimeline items={progressList} />
              <PatientNextStepCard latest={latestProgress} />
            </div>
          </DashboardSection>
        </DashboardLayout>

        {travelPackage && (
          <div className="mb-8 rounded-2xl border-2 border-emerald-800 bg-emerald-950/20 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Your recommended journey</p>
            <p className="mt-1 text-xs text-zinc-300">The package we suggested for you; pay the deposit when you&apos;re ready to secure your booking.</p>
            <p className="mt-2 text-lg font-semibold text-zinc-50">{travelPackage.name}</p>
            {hasDepositPaid ? (
              <p className="mt-2 rounded-lg bg-emerald-900/40 px-3 py-2 text-sm font-medium text-emerald-200">
                Deposit received — your coordinator will contact you to confirm next steps.
              </p>
            ) : (
              <>
                {travelPackage.deposit_cents != null && travelPackage.deposit_cents > 0 && (
                  <p className="mt-1 text-sm font-medium text-emerald-200">
                    Deposit: ${(travelPackage.deposit_cents / 100).toFixed(2)} USD
                  </p>
                )}
                <p className="mt-2 text-sm text-zinc-300">
                  Includes partner dental clinic, accommodation, airport transfer, and curated experiences in Colombia. Your care coordinator will confirm details after your deposit.
                </p>
                <Link
                  href={`/packages/${travelPackage.slug}`}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
                >
                  View full package details
                </Link>
              </>
            )}
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Overview</h2>
        <p className="mb-1 text-sm text-zinc-300">Counts of your assessments, bookings, consultations, and payments.</p>
        <p className="mb-6 text-lg font-semibold text-zinc-50">Your submissions and status</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Assessments</p>
            <p className="mt-2 text-2xl font-bold text-zinc-50">{leads.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Bookings</p>
            <p className="mt-2 text-2xl font-bold text-zinc-50">{bookings.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Consultations</p>
            <p className="mt-2 text-2xl font-bold text-zinc-50">{consultations.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Payments</p>
            <p className="mt-2 text-2xl font-bold text-zinc-50">{payments.length}</p>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Your assessments</h3>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
            {leads.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-zinc-300">No submissions yet.</p>
                <Link href="/assessment" className="mt-3 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  Start free assessment →
                </Link>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Recommended package</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Submitted</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const booking = bookings.find((b) => b.lead_id === l.id);
                    const depositCents = booking?.deposit_cents ?? null;
                    const canPayDeposit = l.status !== "deposit_paid";
                    const slug = l.recommended_package_slug ?? l.package_slug;
                    const pkg = slug ? packageBySlug.get(slug.trim()) : null;
                    return (
                      <tr key={l.id} className="border-b border-zinc-800">
                        <td className="px-4 py-3">{l.first_name} {l.last_name}</td>
                        <td className="px-4 py-3">{l.status}</td>
                        <td className="px-4 py-3">
                          {pkg ? (
                            <Link href={`/packages/${pkg.slug}`} className="text-emerald-400 hover:underline font-medium">
                              {pkg.name}
                            </Link>
                          ) : (
                            slug ?? "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {canPayDeposit ? (
                            <PatientDepositButton leadId={l.id} amountCents={depositCents} />
                          ) : (
                            <span className="font-medium text-emerald-200">Deposit received — your coordinator will contact you.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {(bookings.length > 0 || payments.length > 0) && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {bookings.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Booking status</h3>
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-zinc-800 bg-zinc-950/50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Deposit</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-zinc-800">
                          <td className="px-4 py-3">{b.status}</td>
                          <td className="px-4 py-3">{b.deposit_paid ? "Paid" : "—"}</td>
                          <td className="px-4 py-3 text-zinc-300">
                            {b.start_date && b.end_date
                              ? `${new Date(b.start_date).toLocaleDateString()} – ${new Date(b.end_date).toLocaleDateString()}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {payments.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Payment status</h3>
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-zinc-800 bg-zinc-950/50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Amount</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-zinc-800">
                          <td className="px-4 py-3">{p.status}</td>
                          <td className="px-4 py-3">{p.amount_cents != null ? `$${(p.amount_cents / 100).toFixed(2)}` : "—"}</td>
                          <td className="px-4 py-3 text-zinc-300">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-zinc-300">
                  Want more detail about how deposits and payouts work?{" "}
                  <Link href="/how-payments-work" className="text-emerald-400 hover:text-emerald-300">
                    Read how payments work →
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <FeedbackButton page="/patient" />
    </div>
  );
}
