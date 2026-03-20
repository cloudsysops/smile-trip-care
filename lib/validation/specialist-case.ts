import { z } from "zod";

export const SpecialistCasePatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("decline") }),
  z.object({ action: z.literal("schedule"), scheduled_at: z.string().min(1) }),
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("request_info"), message: z.string().min(1).max(2000) }),
]);

export type SpecialistCasePatchBody = z.infer<typeof SpecialistCasePatchSchema>;
