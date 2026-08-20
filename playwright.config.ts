import { defineConfig, devices } from "@playwright/test";

const feBaseUrl = process.env.TASKVIEW_E2E_FE_URL ?? "http://fe:3000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "output/verification/playwright-artifacts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 6 * 60_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["line"],
    ["html", { outputFolder: "output/verification/report", open: "never" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: feBaseUrl,
    viewport: { width: 1440, height: 1024 },
    colorScheme: "light",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "full-story",
      testMatch: /full-story\.spec\.ts/,
    },
    {
      name: "visual-matrix",
      testMatch: /visual-matrix\.spec\.ts/,
    },
  ],
});
