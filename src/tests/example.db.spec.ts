import { test, expect } from "../fixtures/index.js";

test.describe("Example Database Tests @db", () => {
  test("SELECT query example", async ({ db }) => {
    const result = await db.query("SELECT 1 as value");

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty("value");
  });

  test("Query with parameters", async ({ db }) => {
    // Note: Parameter syntax varies by provider
    // PostgreSQL/MySQL: $1, $2 or ?
    // MSSQL: @p0, @p1 (converted from ?)
    const result = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [1]
    );

    expect(result.rowCount).toBeGreaterThanOrEqual(0);
  });

  test("INSERT and verify", async ({ db }) => {
    await db.transaction(async (client) => {
      // Insert a test record
      const insertCount = await client.execute(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ["Test User", "test@example.com"]
      );
      expect(insertCount).toBe(1);

      // Verify the insert
      const result = await client.query(
        "SELECT * FROM users WHERE email = ?",
        ["test@example.com"]
      );
      expect(result.rows).toHaveLength(1);

      // Rollback will happen automatically if we throw or transaction completes
    });
  });

  test("UPDATE and verify", async ({ db }) => {
    await db.transaction(async (client) => {
      // Update a record
      const updateCount = await client.execute(
        "UPDATE users SET name = ? WHERE id = ?",
        ["Updated Name", 1]
      );

      // Verify update affected rows
      expect(updateCount).toBeGreaterThanOrEqual(0);
    });
  });

  test("DELETE and verify", async ({ db }) => {
    await db.transaction(async (client) => {
      // Delete a record
      const deleteCount = await client.execute(
        "DELETE FROM users WHERE id = ?",
        [999]
      );

      expect(deleteCount).toBeGreaterThanOrEqual(0);
    });
  });

  test("Complex query with joins", async ({ db }) => {
    const result = await db.query(`
      SELECT u.name, o.order_id, o.total
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
    `, [1]);

    expect(result.rows).toBeDefined();
  });

  test("Aggregate functions", async ({ db }) => {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_users,
        MAX(created_at) as latest_signup
      FROM users
    `);

    expect(result.rows).toHaveLength(1);
  });
});
