import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const isCI = !!process.env.CI;

// Reporter configuration based on environment
const reporters: Array<
  | ["list"]
  | ["dot"]
  | ["html", { open: string; outputFolder: string }]
  | ["json", { outputFile: string }]
  | ["junit", { outputFile: string }]
  | ["allure-playwright", { outputFolder: string; suiteTitle?: string }]
> = [
  // Console output
  isCI ? ["dot"] : ["list"],

  // HTML Report - Playwright's built-in
  [
    "html",
    {
      open: "never",
      outputFolder: "playwright-report",
    },
  ],

  // JSON Report - for programmatic access
  [
    "json",
    {
      outputFile: "test-results/results.json",
    },
  ],

  // JUnit XML - for CI/CD integration (Jenkins, GitLab, etc.)
  [
    "junit",
    {
      outputFile: "test-results/junit.xml",
    },
  ],

  // Allure Report - rich interactive reports
  [
    "allure-playwright",
    {
      outputFolder: "allure-results",
      suiteTitle: "API & Database Tests",
    },
  ],
];

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: reporters,
  outputDir: "test-results",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    extraHTTPHeaders: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
    },
    {
      name: "db",
      testMatch: /.*\.db\.spec\.ts/,
    },
    {
      name: "integration",
      testMatch: /.*\.integration\.spec\.ts/,
    },
  ],
});
