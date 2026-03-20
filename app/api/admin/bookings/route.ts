import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getBookings, createBooking } from "@/lib/bookings";
import { BookingCreateSchema } from "@/lib/validation/booking";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const data = await getBookings();
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin bookings GET failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body", request_id: requestId },
        { status: 400 }
      );
    }
    const parsed = BookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const { data, error } = await createBooking({
      lead_id: payload.lead_id,
      package_id: payload.package_id,
      provider_id: payload.provider_id ?? null,
      status: payload.status ?? "draft",
      total_price_usd: payload.total_price_usd ?? null,
      deposit_paid: payload.deposit_paid ?? false,
      deposit_cents: payload.deposit_cents ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      notes: payload.notes ?? null,
    });
    if (error) {
      log.warn("Booking create failed", { error });
      return NextResponse.json(
        { error: error || "Create failed", request_id: requestId },
        { status: 422 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Admin bookings POST failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
