import { test, expect } from "../fixtures/index.js";

test.describe("Example API Tests @api", () => {
  test("GET request example", async ({ api }) => {
    const response = await api.get("/users");

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test("POST request example", async ({ api }) => {
    const payload = {
      name: "Test User",
      email: "test@example.com",
    };

    const response = await api.post("/users", payload);

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty("id");
  });

  test("PUT request example", async ({ api }) => {
    const payload = {
      name: "Updated User",
    };

    const response = await api.put("/users/1", payload);

    expect(response.status).toBe(200);
  });

  test("DELETE request example", async ({ api }) => {
    const response = await api.delete("/users/1");

    expect(response.status).toBe(204);
  });

  test("Request with query parameters", async ({ api }) => {
    const response = await api.get("/users", {
      params: {
        page: "1",
        limit: "10",
        sort: "name",
      },
    });

    expect(response.status).toBe(200);
  });

  test("Request with custom headers", async ({ api }) => {
    const response = await api.get("/users", {
      headers: {
        "X-Custom-Header": "custom-value",
      },
    });

    expect(response.status).toBe(200);
  });
});
