import { test, expect } from "../fixtures/index.js";
import { generateRandomEmail } from "../utils/index.js";

interface User {
  id: number;
  name: string;
  email: string;
}

test.describe("Integration Tests @integration", () => {
  test("Create user via API and verify in database", async ({ api, db }) => {
    const email = generateRandomEmail();
    const payload = {
      name: "Integration Test User",
      email,
    };

    // Create user via API
    const response = await api.post<User>("/users", payload);
    expect(response.status).toBe(201);

    const apiUser = await response.json();
    expect(apiUser.id).toBeDefined();

    // Verify user exists in database
    const dbResult = await db.query<User>(
      "SELECT id, name, email FROM users WHERE email = ?",
      [email]
    );

    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].name).toBe(payload.name);
    expect(dbResult.rows[0].email).toBe(email);
  });

  test("Update user via API and verify in database", async ({ api, db }) => {
    const userId = 1;
    const newName = "Updated via API";

    // Update user via API
    const response = await api.put(`/users/${userId}`, { name: newName });
    expect(response.status).toBe(200);

    // Verify update in database
    const dbResult = await db.query<{ name: string }>(
      "SELECT name FROM users WHERE id = ?",
      [userId]
    );

    expect(dbResult.rows[0]?.name).toBe(newName);
  });

  test("Delete user via API and verify in database", async ({ api, db }) => {
    // First create a user to delete
    const email = generateRandomEmail();
    const createResponse = await api.post<{ id: number }>("/users", {
      name: "User to Delete",
      email,
    });
    const user = await createResponse.json();

    // Delete via API
    const deleteResponse = await api.delete(`/users/${user.id}`);
    expect(deleteResponse.status).toBe(204);

    // Verify deletion in database
    const dbResult = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [user.id]
    );

    expect(dbResult.rows).toHaveLength(0);
  });

  test("API response matches database state", async ({ api, db }) => {
    // Get users from API
    const apiResponse = await api.get<Array<{ id: number }>>("/users");
    const apiUsers = await apiResponse.json();

    // Get count from database
    const dbResult = await db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );

    // Verify counts match
    expect(apiUsers.length).toBe(Number(dbResult.rows[0].count));
  });
});
