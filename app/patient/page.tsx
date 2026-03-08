import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePatient } from "@/lib/auth";
import { branding } from "@/lib/branding";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import { getPublishedPackages, getPackageWithRelations } from "@/lib/packages";
import { getSpecialistById } from "@/lib/specialists";
import PatientDepositButton from "./PatientDepositButton";
import TreatmentPlanSection from "@/app/components/dashboard/TreatmentPlanSection";
import TravelPlanSection from "@/app/components/dashboard/TravelPlanSection";
import TreatmentTimelineSection from "@/app/components/dashboard/TreatmentTimelineSection";
import CareCoordinatorSection from "@/app/components/dashboard/CareCoordinatorSection";
import AftercareSection from "@/app/components/dashboard/AftercareSection";
import type { PackageWithRelations } from "@/lib/packages";

export default async function PatientDashboardPage() {
  let profile;
  try {
    const ctx = await requirePatient();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/patient");
  }
  const email = profile.email ?? "";
  const [data, packages] = await Promise.all([
    getPatientDashboardData(email),
    getPublishedPackages(),
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

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              {branding.productName}
            </Link>
            <nav className="flex items-center gap-3">
              <Link href="/patient" className="text-sm font-semibold text-zinc-900">
                My journey
              </Link>
              <Link href="/assessment" className="text-sm text-zinc-600 hover:text-zinc-900">
                New assessment
              </Link>
            </nav>
          </div>
          <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">Patient dashboard</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile</p>
          <p className="mt-2 font-semibold text-zinc-900">{profile.full_name || profile.email || "—"}</p>
          <p className="mt-0.5 text-sm text-zinc-600">{profile.email}</p>
        </div>

        {showJourneyPortal && pkgForJourney && (
          <>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Your journey</h2>
            <p className="mb-6 text-lg font-semibold text-zinc-900">Treatment plan, travel, and timeline</p>
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <TreatmentPlanSection
                procedureType={pkgForJourney.name}
                estimatedDuration={pkgForJourney.duration_days != null ? `${pkgForJourney.duration_days} days` : null}
                clinic={packageWithRelations?.provider_name ?? null}
                doctor={primarySpecialistName}
              />
              <TravelPlanSection
                city={pkgForJourney.location ?? null}
                recommendedDates={activeBooking?.start_date && activeBooking?.end_date ? `${new Date(activeBooking.start_date).toLocaleDateString()} – ${new Date(activeBooking.end_date).toLocaleDateString()}` : null}
                airportTransfer={hasTransfer ? "Included in package" : (includedText ? "See package details" : null)}
                hotelSuggestion={hasHotel ? "Included in package" : (includedText ? "See package details" : null)}
              />
            </div>
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <TreatmentTimelineSection steps={timelineSteps} />
              <CareCoordinatorSection coordinatorName={null} />
            </div>
            <div className="mb-8">
              <AftercareSection instructions={null} />
            </div>
          </>
        )}

        {travelPackage && (
          <div className="mb-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Your recommended journey</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900">{travelPackage.name}</p>
            {travelPackage.deposit_cents != null && travelPackage.deposit_cents > 0 && (
              <p className="mt-1 text-sm font-medium text-emerald-800">
                Deposit: ${(travelPackage.deposit_cents / 100).toFixed(2)} USD
              </p>
            )}
            <p className="mt-2 text-sm text-zinc-600">
              Includes partner dental clinic, accommodation, airport transfer, and curated experiences in Colombia. Your care coordinator will confirm details after your deposit.
            </p>
            <Link
              href={`/packages/${travelPackage.slug}`}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View full package details
            </Link>
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Overview</h2>
        <p className="mb-6 text-lg font-semibold text-zinc-900">Your submissions and status</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Assessments</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{leads.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Bookings</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{bookings.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Consultations</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{consultations.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Payments</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{payments.length}</p>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Your assessments</h3>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {leads.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-zinc-600">No submissions yet.</p>
                <Link href="/assessment" className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Start free assessment →
                </Link>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Recommended package</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Submitted</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Next action</th>
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
                      <tr key={l.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3">{l.first_name} {l.last_name}</td>
                        <td className="px-4 py-3">{l.status}</td>
                        <td className="px-4 py-3">
                          {pkg ? (
                            <Link href={`/packages/${pkg.slug}`} className="text-emerald-600 hover:underline font-medium">
                              {pkg.name}
                            </Link>
                          ) : (
                            slug ?? "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {canPayDeposit ? (
                            <PatientDepositButton leadId={l.id} amountCents={depositCents} />
                          ) : (
                            "Deposit paid"
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
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Deposit</th>
                        <th className="px-4 py-3 font-medium">Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-zinc-100">
                          <td className="px-4 py-3">{b.status}</td>
                          <td className="px-4 py-3">{b.deposit_paid ? "Paid" : "—"}</td>
                          <td className="px-4 py-3 text-zinc-600">
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
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-zinc-100">
                          <td className="px-4 py-3">{p.status}</td>
                          <td className="px-4 py-3">{p.amount_cents != null ? `$${(p.amount_cents / 100).toFixed(2)}` : "—"}</td>
                          <td className="px-4 py-3 text-zinc-600">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
