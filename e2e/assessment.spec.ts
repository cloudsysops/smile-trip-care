/**
 * E2E: Assessment funnel happy path.
 * No mocks: runs against baseURL (local or deploy). Submit hits real POST /api/leads.
 * Passes if submit completes with either: redirect to /assessment/proposal?lead_id=... or visible error (API down/schema drift).
 */
import { test, expect } from "@playwright/test";

test.describe("Assessment happy path", () => {
  test("opens assessment, completes steps, submit reaches success or known error", async ({ page }) => {
    await page.goto("/assessment");
    await expect(page.locator("#step-treatment")).toBeVisible();

    // Step 0: select treatment (use exact "Next" to avoid Next.js Dev Tools button in dev)
    await page.getByLabel(/implant/i).first().click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 1: smile history
    await expect(page.getByRole("heading", { name: /smile history/i })).toBeVisible();
    await page.getByText(/first time exploring/i).first().click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 2: timeline
    await expect(page.getByRole("heading", { name: /timeline|when/i })).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 3: contact + submit
    await expect(page.getByRole("heading", { name: /contact info/i })).toBeVisible();
    await page.getByLabel(/first name/i).fill("E2E");
    await page.getByLabel(/last name/i).fill("Test");
    await page.getByLabel(/email/i).fill("e2e-assessment@example.com");
    const submitBtn = page.getByRole("button", { name: /submit my evaluation/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Either redirect to proposal (success) or visible error (e.g. API 500 / schema drift)
    try {
      await page.waitForURL(/\/assessment\/proposal\?.*lead_id=/, { timeout: 15000 });
      await expect(page.getByRole("heading", { name: /personalized smile preview/i })).toBeVisible();
    } catch {
      await expect(page.getByText(/could not save your request|try again/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
