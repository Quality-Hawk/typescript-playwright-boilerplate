import { test as base } from "@playwright/test";
import { ApiClient } from "../api/index.js";
import { DatabaseFactory, DatabaseClient } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

export interface TestFixtures {
  api: ApiClient;
  db: DatabaseClient;
}

export const test = base.extend<TestFixtures>({
  api: async ({ request }, use) => {
    const apiClient = new ApiClient(request, {
      baseURL: process.env.BASE_URL,
      headers: {
        Authorization: process.env.API_TOKEN
          ? `Bearer ${process.env.API_TOKEN}`
          : "",
      },
    });
    await use(apiClient);
  },

  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const db = DatabaseFactory.fromEnv();
    await db.connect();
    await use(db);
    await db.disconnect();
  },
});

export { expect } from "@playwright/test";
