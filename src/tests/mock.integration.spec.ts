import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

/**
 * Mock integration tests combining API calls and database operations.
 * Uses httpbin.org for API and SQLite in-memory for database.
 */
test.describe("Mock Integration Tests @integration @mock", () => {
  let db: Database.Database;

  test.beforeAll(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER,
        response_time_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE sync_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE,
        data TEXT,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  test.afterAll(() => {
    db.close();
  });

  test("API call result stored in database", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get("https://httpbin.org/get");
    const responseTime = Date.now() - startTime;

    // Store API call in database
    const result = db
      .prepare(
        "INSERT INTO api_logs (endpoint, method, status_code, response_time_ms) VALUES (?, ?, ?, ?)"
      )
      .run("/get", "GET", response.status(), responseTime);

    expect(result.changes).toBe(1);

    // Verify the log was stored
    const log = db.prepare("SELECT * FROM api_logs WHERE id = ?").get(
      result.lastInsertRowid
    ) as { endpoint: string; method: string; status_code: number };

    expect(log.endpoint).toBe("/get");
    expect(log.method).toBe("GET");
    expect(log.status_code).toBe(200);
  });

  test("Sync API data to database", async ({ request }) => {
    // Fetch data from API
    const response = await request.get("https://httpbin.org/uuid");
    expect(response.status()).toBe(200);

    const body = await response.json();
    const uuid = body.uuid;

    // Store in database
    db.prepare("INSERT INTO sync_records (external_id, data) VALUES (?, ?)").run(
      uuid,
      JSON.stringify(body)
    );

    // Verify sync
    const record = db
      .prepare("SELECT * FROM sync_records WHERE external_id = ?")
      .get(uuid) as { external_id: string; data: string };

    expect(record).toBeDefined();
    expect(record.external_id).toBe(uuid);
    expect(JSON.parse(record.data)).toHaveProperty("uuid");
  });

  test("Batch API calls with database tracking", async ({ request }) => {
    const endpoints = ["/get", "/headers", "/user-agent"];
    const results: Array<{ endpoint: string; status: number }> = [];

    for (const endpoint of endpoints) {
      const response = await request.get(`https://httpbin.org${endpoint}`);
      results.push({ endpoint, status: response.status() });

      db.prepare(
        "INSERT INTO api_logs (endpoint, method, status_code, response_time_ms) VALUES (?, ?, ?, ?)"
      ).run(endpoint, "GET", response.status(), 0);
    }

    // Verify all calls succeeded
    expect(results.every((r) => r.status === 200)).toBe(true);

    // Verify database has all records
    const logs = db
      .prepare("SELECT endpoint FROM api_logs WHERE method = 'GET'")
      .all() as Array<{ endpoint: string }>;

    for (const endpoint of endpoints) {
      expect(logs.some((l) => l.endpoint === endpoint)).toBe(true);
    }
  });

  test("API response validation against database schema", async ({ request }) => {
    const response = await request.post("https://httpbin.org/post", {
      data: {
        id: 1,
        name: "Test Item",
        price: 29.99,
        active: true,
      },
    });

    const body = await response.json();
    const postedData = body.json;

    // Validate required fields
    expect(postedData).toHaveProperty("id");
    expect(postedData).toHaveProperty("name");
    expect(postedData).toHaveProperty("price");

    // Validate types
    expect(typeof postedData.id).toBe("number");
    expect(typeof postedData.name).toBe("string");
    expect(typeof postedData.price).toBe("number");
    expect(typeof postedData.active).toBe("boolean");
  });

  test("Error handling - API failure logged to database", async ({ request }) => {
    const response = await request.get("https://httpbin.org/status/500");

    // Log the error
    db.prepare(
      "INSERT INTO api_logs (endpoint, method, status_code, response_time_ms) VALUES (?, ?, ?, ?)"
    ).run("/status/500", "GET", response.status(), 0);

    expect(response.status()).toBe(500);
    expect(response.ok()).toBe(false);

    // Verify error was logged
    const errorLog = db
      .prepare("SELECT * FROM api_logs WHERE status_code = 500")
      .get() as { status_code: number };

    expect(errorLog).toBeDefined();
    expect(errorLog.status_code).toBe(500);
  });

  test("Data consistency between API and DB", async ({ request }) => {
    // Create a unique identifier
    const testId = `test-${Date.now()}`;

    // Simulate posting data via API
    const postResponse = await request.post("https://httpbin.org/post", {
      data: { testId, value: 42 },
    });
    const postBody = await postResponse.json();

    // Store in database
    db.prepare("INSERT INTO sync_records (external_id, data) VALUES (?, ?)").run(
      testId,
      JSON.stringify(postBody.json)
    );

    // Fetch from database and verify
    const dbRecord = db
      .prepare("SELECT data FROM sync_records WHERE external_id = ?")
      .get(testId) as { data: string };

    const dbData = JSON.parse(dbRecord.data);
    expect(dbData.testId).toBe(testId);
    expect(dbData.value).toBe(42);
  });
});
