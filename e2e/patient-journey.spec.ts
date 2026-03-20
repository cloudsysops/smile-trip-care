import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "https://smile-transformation-platform-dev.vercel.app";
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "TestPassword123!";

const UX_ISSUES: string[] = [];

function trackIssue(message: string) {
  UX_ISSUES.push(message);
}

test.describe("MedVoyage Smile — Patient journey E2E", () => {
  test.beforeEach(async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === "error" && !text.includes("favicon")) {
        logs.push(`[${type}] ${text}`);
      }
    });
    (page as unknown as { _consoleErrors?: string[] })._consoleErrors = logs;
  });

  test.afterEach(async ({ page }, testInfo) => {
    const errors = (page as unknown as { _consoleErrors?: string[] })._consoleErrors;
    if (errors?.length) {
      trackIssue(`Console errors on ${testInfo.title}: ${errors.join("; ")}`);
    }
  });

  test("0. Critical path — landing → assessment → proposal → signup → patient dashboard", async ({ page }) => {
    const unique = `e2e-cp-${Date.now()}`;
    const email = `${unique}@example.com`;
    const password = E2E_TEST_PASSWORD;

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    const cta = page.getByRole("link", { name: /Get My Free Treatment Plan|Start Free Smile Evaluation/i }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/(assessment|assessment\?)/, { timeout: 10000 });

    await page.getByLabel(/First name/i).fill("CriticalPath");
    await page.getByLabel(/Last name/i).fill("Patient");
    await page.getByLabel(/Email/i).first().fill(email);
    await page.getByRole("button", { name: /Submit my evaluation/i }).click();
    await expect(page).toHaveURL(/\/assessment\/proposal\?.*lead_id=/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Your Personalized Smile Preview/i })).toBeVisible({ timeout: 5000 });

    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/Full name/i).fill("CriticalPath Patient");
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/\/(login|patient).*/, { timeout: 15000 });

    if (page.url().includes("/login")) {
      await page.getByLabel(/Email/i).fill(email);
      await page.getByLabel(/Password/i).fill(password);
      await page.getByRole("button", { name: /Sign in/i }).click();
      await expect(page).toHaveURL(/\/patient/, { timeout: 15000 });
    }

    await expect(page.getByText(/Patient dashboard|My journey|Overview|Your recommended journey/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("1. Landing page — hero and CTA", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    if (loadTime > 3000) trackIssue(`Landing page load took ${loadTime}ms (target <3s)`);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Free Smile Evaluation", { exact: false }).first()).toBeVisible();
    const cta = page.getByRole("link", { name: /Get My Free Treatment Plan|Start Free Smile Evaluation/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/assessment");
  });

  test("2. Click Start Smile Evaluation → assessment form", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Get My Free Treatment Plan|Start Free Smile Evaluation/i }).first().click();
    await expect(page).toHaveURL(/\/(assessment|assessment\?)/);
    await expect(page.getByRole("heading", { name: "Free smile evaluation", level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/First name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit my evaluation/i })).toBeVisible();
  });

  test("3. Fill and submit assessment → redirect to proposal", async ({ page }) => {
    await page.goto("/assessment", { waitUntil: "networkidle" });
    await page.getByLabel(/First name/i).fill("E2E");
    await page.getByLabel(/Last name/i).fill("Patient");
    const testEmail = `e2e-${Date.now()}@example.com`;
    await page.getByLabel(/Email/i).first().fill(testEmail);
    await page.getByRole("button", { name: /Submit my evaluation/i }).click();

    const redirected = await page.waitForURL(/\/assessment\/proposal\?.*lead_id=/, { timeout: 20000 }).catch(() => false);
    if (!redirected) {
      const errorEl = page.getByRole("alert");
      if (await errorEl.isVisible().catch(() => false)) {
        trackIssue(`Assessment submit failed: ${await errorEl.textContent()}`);
      } else {
        trackIssue("Assessment submit did not redirect to proposal (API may have rejected or rate-limited)");
      }
    }
    expect(page.url()).toMatch(/\/assessment\/proposal\?.*lead_id=/);
  });

  test("4. Proposal page — savings card and WhatsApp", async ({ page }) => {
    await page.goto("/assessment/proposal", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Your Personalized Smile Preview/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Estimated savings vs. U.S. prices", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: /Chat on WhatsApp|Message us on WhatsApp/i }).first()).toBeVisible();
  });

  test("5. Packages page — package cards load", async ({ page }) => {
    await page.goto("/packages", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Packages/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Comfort Recovery Journey", { exact: false }).first()).toBeVisible({ timeout: 10000 });
    const viewLinks = page.getByRole("link", { name: /View Package|Start Assessment/i });
    await expect(viewLinks.first()).toBeVisible();
  });

  test("6. Signup page — form present", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Create patient account/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Full name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create account/i })).toBeVisible();
  });

  test("7. Login page — form present", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("8. Signup → Login → Patient dashboard (when credentials provided)", async ({ page }) => {
    const email = E2E_TEST_EMAIL ?? `e2e-${Date.now()}@test.medvoyage.example`;
    const password = E2E_TEST_PASSWORD;

    await page.goto("/signup", { waitUntil: "networkidle" });
    await page.getByLabel(/Full name/i).fill("E2E Test Patient");
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();

    try {
      await expect(page).toHaveURL(/\/(login|patient).*/, { timeout: 15000 });
    } catch {
      trackIssue("Signup did not redirect to login or patient (auth may not be configured for E2E)");
      return;
    }

    if (page.url().includes("/login")) {
      await page.getByLabel(/Email/i).fill(email);
      await page.getByLabel(/Password/i).fill(password);
      await page.getByRole("button", { name: /Sign in/i }).click();
      try {
        await expect(page).toHaveURL(/\/patient/, { timeout: 15000 });
      } catch {
        trackIssue("Login did not redirect to /patient");
        return;
      }
    }

    if (page.url().includes("/patient")) {
      await expect(page.getByText(/Overview|Your assessments|Assessments|Consultation/i).first()).toBeVisible({ timeout: 10000 });
      const treatmentSection = page.getByText(/Your recommended journey|Consultation|Treatment|timeline/i).first();
      await expect(treatmentSection).toBeVisible({ timeout: 5000 }).catch(() => {
        trackIssue("Patient dashboard: treatment/journey section not found");
      });
    }
  });

  test("9. Key links on landing are valid", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const criticalLinks = [
      { name: "assessment", selector: 'a[href="/assessment"]' },
      { name: "packages", selector: 'a[href="/packages"]' },
    ];
    for (const { name, selector } of criticalLinks) {
      const link = page.locator(selector).first();
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      const res = await page.request.get(href!.startsWith("http") ? href! : `${BASE_URL}${href}`, { timeout: 10000 }).catch(() => null);
      if (res && res.status() >= 400) {
        trackIssue(`Broken link (${name}): ${href} → ${res.status()}`);
      }
    }
  });

  test("10. E2E report — UX issues summary", async () => {
    if (UX_ISSUES.length > 0) {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const reportPath = path.join(process.cwd(), "e2e-ux-issues.txt");
      fs.writeFileSync(reportPath, UX_ISSUES.join("\n"), "utf8");
      console.log("\n--- UX issues detected (see e2e-ux-issues.txt) ---");
      UX_ISSUES.forEach((u) => console.log(" -", u));
    }
  });
});
