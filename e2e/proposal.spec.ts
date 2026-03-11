/**
 * E2E: Proposal page render and conversion elements.
 * No mocks: loads /assessment/proposal (works with or without lead_id/recommended_package_slug).
 */
import { test, expect } from "@playwright/test";

test.describe("Proposal page", () => {
  test("renders savings block, trust section, timeline, and CTA area", async ({ page }) => {
    await page.goto("/assessment/proposal");
    await expect(page.getByRole("heading", { name: /personalized smile preview/i })).toBeVisible();

    // Savings block (heading text may be "Typical US cost vs Colombia" or "Estimated savings vs. U.S. prices")
    const savingsHeading = page.locator("#savings-heading");
    await expect(savingsHeading).toBeVisible();
    await expect(savingsHeading).toContainText(/savings|typical US cost|colombia|U\.?S\.?/i);
    await expect(page.getByText(/you save|estimated US cost/i).first()).toBeVisible();

    // Journey timeline
    const journeyHeading = page.locator("#journey-heading");
    await expect(journeyHeading).toBeVisible();
    await expect(journeyHeading).toContainText(/journey|smile|how your/i);
    await expect(page.getByText(/assessment|coordinate|specialist/i).first()).toBeVisible();

    // Trust section
    await expect(page.locator("#trust-heading")).toBeVisible();
    await expect(page.getByText(/why medvoyage|trust|clinic/i).first()).toBeVisible();

    // CTA area: primary WhatsApp CTA is present (full CTA test in next spec)
    await expect(page.getByRole("link", { name: /talk to a dental|whatsapp|coordinator/i }).first()).toBeVisible();
  });

  test("WhatsApp CTA is present with well-formed href and message", async ({ page }) => {
    await page.goto("/assessment/proposal");
    const whatsAppLink = page.getByRole("link", { name: /talk to a dental|whatsapp|coordinator/i });
    await expect(whatsAppLink.first()).toBeVisible();
    const href = await whatsAppLink.first().getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+/);
    expect(href).toContain("text=");
  });
});
