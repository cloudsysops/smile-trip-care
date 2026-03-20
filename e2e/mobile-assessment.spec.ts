/**
 * E2E: Assessment page in mobile viewport.
 * Verifies key form elements and submit CTA are visible and reachable.
 */
import { test, expect } from "@playwright/test";

test.describe("Assessment mobile smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test("assessment form is visible and submit CTA is reachable", async ({ page }) => {
    await page.goto("/assessment");
    await expect(page.locator("#step-treatment")).toBeVisible();

    // Step 0 visible
    await expect(page.getByLabel(/implant/i).first()).toBeVisible();
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Step 1
    await expect(page.getByText(/first time exploring|smile history/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 2
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 3: contact form and submit
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    const submitBtn = page.getByRole("button", { name: /submit my evaluation/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeInViewport();
  });
});
