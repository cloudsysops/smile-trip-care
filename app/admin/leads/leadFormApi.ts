"use client";

export async function patchLeadById(
  leadId: string,
  payload: Record<string, unknown>,
  fallbackError = "Update failed",
): Promise<void> {
  const response = await fetch(`/api/admin/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data.error as string) || fallbackError);
  }
}
