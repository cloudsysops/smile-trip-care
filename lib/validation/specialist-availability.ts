import { z } from "zod";

export const AvailabilitySlotSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    is_available: z.boolean(),
  })
  .superRefine((slot, ctx) => {
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    if (endM <= startM) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "end_time must be after start_time" });
    }
  });

export const AvailabilityPatchBodySchema = z.object({
  slots: z.array(AvailabilitySlotSchema).max(7),
});

export type AvailabilityPatchBody = z.infer<typeof AvailabilityPatchBodySchema>;
