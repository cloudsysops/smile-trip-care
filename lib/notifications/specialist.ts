/**
 * Specialist notification hooks (structured log until email/push is wired).
 */
import { createLogger } from "@/lib/logger";

const log = createLogger("specialist-notifications");

export function notifyNewCase(specialistId: string, leadId: string): void {
  log.info("specialist_notify_new_case", { specialist_id: specialistId, lead_id: leadId });
}

export function notifyDepositReceived(specialistId: string, leadId: string): void {
  log.info("specialist_notify_deposit_received", { specialist_id: specialistId, lead_id: leadId });
}
