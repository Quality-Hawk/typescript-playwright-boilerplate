import { test, expect } from "@playwright/test";

/**
 * Mock API tests that don't require a real API server.
 * These tests use httpbin.org as a mock API endpoint.
 */
test.describe("Mock API Tests @api @mock", () => {
  test("GET request returns 200", async ({ request }) => {
    const response = await request.get("https://httpbin.org/get");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("url");
    expect(body.url).toBe("https://httpbin.org/get");
  });

  test("POST request with JSON body", async ({ request }) => {
    const payload = {
      name: "Test User",
      email: "test@example.com",
    };

    const response = await request.post("https://httpbin.org/post", {
      data: payload,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.json).toEqual(payload);
  });

  test("PUT request with data", async ({ request }) => {
    const payload = { updated: true, value: 42 };

    const response = await request.put("https://httpbin.org/put", {
      data: payload,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.json).toEqual(payload);
  });

  test("DELETE request", async ({ request }) => {
    const response = await request.delete("https://httpbin.org/delete");
    expect(response.status()).toBe(200);
  });

  test("Request with query parameters", async ({ request }) => {
    const response = await request.get("https://httpbin.org/get", {
      params: {
        page: "1",
        limit: "10",
        search: "test",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.args).toEqual({
      page: "1",
      limit: "10",
      search: "test",
    });
  });

  test("Request with custom headers", async ({ request }) => {
    const response = await request.get("https://httpbin.org/headers", {
      headers: {
        "X-Custom-Header": "custom-value",
        "X-Test-Id": "12345",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.headers["X-Custom-Header"]).toBe("custom-value");
    expect(body.headers["X-Test-Id"]).toBe("12345");
  });

  test("Response status codes - 201 Created", async ({ request }) => {
    const response = await request.get("https://httpbin.org/status/201");
    expect(response.status()).toBe(201);
  });

  test("Response status codes - 404 Not Found", async ({ request }) => {
    const response = await request.get("https://httpbin.org/status/404");
    expect(response.status()).toBe(404);
    expect(response.ok()).toBe(false);
  });

  test("JSON response parsing", async ({ request }) => {
    const response = await request.get("https://httpbin.org/json");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("slideshow");
    expect(body.slideshow).toHaveProperty("title");
  });

  test("Response headers validation", async ({ request }) => {
    const response = await request.get(
      "https://httpbin.org/response-headers?Content-Type=application/json"
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
  });
});
