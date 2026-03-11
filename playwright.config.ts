import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "https://smile-transformation-platform-dev.vercel.app";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "e2e-results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },
  timeout: 120000,
  expect: {
    timeout: 10000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
