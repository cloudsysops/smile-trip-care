import { z } from "zod";

export const UuidSchema = z.string().uuid();

export const RouteIdParamSchema = z.object({
  id: UuidSchema,
});
