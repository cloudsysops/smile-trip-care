import { timingSafeEqual } from "node:crypto";

export function timingSafeSecretCompare(provided: string | null, expected: string): boolean {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
