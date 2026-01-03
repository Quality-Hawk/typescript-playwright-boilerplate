import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

/**
 * Mock database tests using SQLite in-memory database.
 * These tests don't require any external database server.
 */
test.describe("Mock Database Tests @db @mock", () => {
  let db: Database.Database;

  test.beforeAll(() => {
    // Create in-memory SQLite database
    db = new Database(":memory:");

    // Create test tables
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0
      );
    `);

    // Seed test data
    db.exec(`
      INSERT INTO users (name, email) VALUES
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com'),
        ('Bob Wilson', 'bob@example.com');

      INSERT INTO products (name, price, stock) VALUES
        ('Widget A', 19.99, 100),
        ('Widget B', 29.99, 50),
        ('Gadget X', 99.99, 25);

      INSERT INTO orders (user_id, total, status) VALUES
        (1, 49.98, 'completed'),
        (1, 99.99, 'pending'),
        (2, 29.99, 'completed');
    `);
  });

  test.afterAll(() => {
    db.close();
  });

  test("SELECT query returns data", () => {
    const rows = db.prepare("SELECT * FROM users").all();

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveProperty("id");
    expect(rows[0]).toHaveProperty("name");
    expect(rows[0]).toHaveProperty("email");
  });

  test("SELECT with WHERE clause", () => {
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("john@example.com");

    expect(row).toBeDefined();
    expect((row as { name: string }).name).toBe("John Doe");
  });

  test("INSERT creates new record", () => {
    const result = db
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .run("Test User", "test@example.com");

    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeGreaterThan(0);

    // Verify insert
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("test@example.com");
    expect(user).toBeDefined();
  });

  test("UPDATE modifies existing record", () => {
    const result = db
      .prepare("UPDATE users SET name = ? WHERE email = ?")
      .run("John Updated", "john@example.com");

    expect(result.changes).toBe(1);

    // Verify update
    const user = db
      .prepare("SELECT name FROM users WHERE email = ?")
      .get("john@example.com") as { name: string };
    expect(user.name).toBe("John Updated");

    // Revert for other tests
    db.prepare("UPDATE users SET name = ? WHERE email = ?").run(
      "John Doe",
      "john@example.com"
    );
  });

  test("DELETE removes record", () => {
    // Insert a record to delete
    db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run(
      "Delete Me",
      "delete@example.com"
    );

    const result = db
      .prepare("DELETE FROM users WHERE email = ?")
      .run("delete@example.com");

    expect(result.changes).toBe(1);

    // Verify deletion
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("delete@example.com");
    expect(user).toBeUndefined();
  });

  test("JOIN query across tables", () => {
    const rows = db
      .prepare(
        `
      SELECT u.name, o.total, o.status
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE u.email = ?
    `
      )
      .all("john@example.com");

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("name");
    expect(rows[0]).toHaveProperty("total");
    expect(rows[0]).toHaveProperty("status");
  });

  test("Aggregate functions", () => {
    const result = db
      .prepare(
        `
      SELECT
        COUNT(*) as total_users,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT SUM(total) FROM orders) as total_revenue
      FROM users
    `
      )
      .get() as { total_users: number; total_orders: number; total_revenue: number };

    expect(result.total_users).toBe(3);
    expect(result.total_orders).toBe(3);
    expect(Number(result.total_revenue)).toBeCloseTo(179.96, 2);
  });

  test("Transaction commits on success", () => {
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)").run(
        "Trans Product",
        49.99,
        10
      );
      return db.prepare("SELECT * FROM products WHERE name = ?").get("Trans Product");
    });

    const result = transaction();
    expect(result).toBeDefined();

    // Cleanup
    db.prepare("DELETE FROM products WHERE name = ?").run("Trans Product");
  });

  test("Transaction rolls back on error", () => {
    const initialCount = (
      db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number }
    ).count;

    try {
      const transaction = db.transaction(() => {
        db.prepare(
          "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
        ).run("Rollback Product", 29.99, 5);
        throw new Error("Intentional error for rollback");
      });
      transaction();
    } catch {
      // Expected error
    }

    const finalCount = (
      db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number }
    ).count;
    expect(finalCount).toBe(initialCount);
  });

  test("Parameterized queries prevent SQL injection", () => {
    const maliciousInput = "'; DROP TABLE users; --";

    // This should safely escape the input
    const result = db
      .prepare("SELECT * FROM users WHERE name = ?")
      .all(maliciousInput);

    expect(result).toHaveLength(0);

    // Verify table still exists
    const users = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
      count: number;
    };
    expect(users.count).toBeGreaterThan(0);
  });

  test("NULL handling", () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS nullable_test (
        id INTEGER PRIMARY KEY,
        optional_field TEXT
      )
    `);

    db.prepare("INSERT INTO nullable_test (optional_field) VALUES (?)").run(null);

    const row = db
      .prepare("SELECT * FROM nullable_test WHERE optional_field IS NULL")
      .get();
    expect(row).toBeDefined();

    // Cleanup
    db.exec("DROP TABLE nullable_test");
  });
});
