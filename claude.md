# Playwright API & Database Test Automation Boilerplate

> **Quality Hawk AI Test Generation Reference**
> This document provides the complete context for automated test generation.

---

## Quick Reference for Test Generation

### File Location & Naming Convention

```
src/tests/
├── {resource}.api.spec.ts         # API tests (e.g., auth.api.spec.ts, users.api.spec.ts)
├── {resource}.db.spec.ts          # Database tests (e.g., users.db.spec.ts)
├── {resource}.integration.spec.ts # Integration tests combining API + DB
```

**Naming Rules:**
- Use lowercase with hyphens for multi-word resources: `user-profile.api.spec.ts`
- Always include the test type suffix: `.api.spec.ts`, `.db.spec.ts`, `.integration.spec.ts`
- Group related endpoints in the same file by resource

### Required Imports

```typescript
// ALWAYS use this import for tests
import { test, expect } from "../fixtures/index.js";
```

**Additional imports when needed:**

```typescript
// For test data generation
import {
  generateRandomString,
  generateRandomEmail,
  generateRandomNumber,
  generateUUID,
  sleep,
} from "../utils/index.js";

// For Allure reporting metadata (optional)
import * as allure from "allure-js-commons";
```

### Test Structure Template

```typescript
import { test, expect } from "../fixtures/index.js";

test.describe("{Resource} API Tests", () => {
  test.describe("{HTTP_METHOD} {/endpoint}", () => {
    test("Should {expected behavior}", { tag: ["@api", "@smoke"] }, async ({ request }) => {
      // Arrange: Set up test data
      const payload = {
        field: "value",
      };

      // Act: Execute the request
      const response = await request.post("/endpoint", { data: payload });

      // Assert: Verify the response
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty("id");
    });
  });
});
```

---

## Available Test Fixtures

When you write `async ({ ... })` in a test, these fixtures are available:

| Fixture | Type | Description | Usage |
|---------|------|-------------|-------|
| `request` | `APIRequestContext` | Playwright's native request context | Direct API calls without pre-configuration |
| `api` | `ApiClient` | Pre-configured API client with baseURL | Recommended for most API tests |
| `db` | `DatabaseClient` | Database client (requires DB_PROVIDER env) | Database validation tests |

### Using `request` fixture (Playwright native)

```typescript
test("Using request fixture", async ({ request }) => {
  const response = await request.get("https://api.example.com/users");
  expect(response.status()).toBe(200);

  const response2 = await request.post("https://api.example.com/users", {
    data: { name: "John", email: "john@example.com" },
    headers: { "Authorization": "Bearer token" },
  });
  expect(response2.status()).toBe(201);
});
```

### Using `api` fixture (Pre-configured client)

```typescript
test("Using api fixture", async ({ api }) => {
  // baseURL is already configured from BASE_URL env var
  const response = await api.get("/users");
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(Array.isArray(data)).toBe(true);
});
```

### Using `db` fixture (Database client)

```typescript
test("Using db fixture", async ({ db }) => {
  const result = await db.query("SELECT * FROM users WHERE id = ?", [1]);
  expect(result.rows).toHaveLength(1);

  const insertCount = await db.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ["Test", "test@example.com"]
  );
  expect(insertCount).toBe(1);
});
```

---

## API Client Methods

The `api` fixture provides these methods:

```typescript
// GET request
const response = await api.get("/endpoint");
const response = await api.get("/endpoint", {
  params: { page: "1", limit: "10" },
  headers: { "X-Custom": "value" },
});

// POST request
const response = await api.post("/endpoint", { name: "value" });
const response = await api.post("/endpoint", payload, {
  headers: { "Content-Type": "application/json" },
});

// PUT request
const response = await api.put("/endpoint", { name: "updated" });

// PATCH request
const response = await api.patch("/endpoint", { field: "value" });

// DELETE request
const response = await api.delete("/endpoint");
```

### Response Object Properties

```typescript
const response = await api.get("/users");

response.status      // number: HTTP status code (200, 201, 400, etc.)
response.statusText  // string: HTTP status text
response.ok          // boolean: true if status is 2xx
response.headers     // Record<string, string>: Response headers

// Get response body
const json = await response.json();   // Parse as JSON
const text = await response.text();   // Get as string
const buffer = await response.body(); // Get as Buffer
```

---

## Test Data Generators

Available from `../utils/index.js`:

```typescript
import {
  generateRandomString,
  generateRandomEmail,
  generateRandomNumber,
  generateUUID,
  sleep,
} from "../utils/index.js";

// Generate random string (default 10 chars)
const str = generateRandomString();        // "aB3kL9mNpQ"
const str = generateRandomString(20);      // 20 character string

// Generate random email
const email = generateRandomEmail();       // "test_aB3kL9mN@example.com"

// Generate random number in range
const num = generateRandomNumber(1, 100);  // Random number 1-100

// Generate UUID v4
const uuid = generateUUID();               // "550e8400-e29b-41d4-a716-446655440000"

// Sleep/delay (milliseconds)
await sleep(1000);                         // Wait 1 second
```

---

## Test Tags Convention

Use tags to categorize and filter tests:

| Tag | Description | When to Use |
|-----|-------------|-------------|
| `@api` | API tests | All API endpoint tests |
| `@db` | Database tests | Tests that validate database state |
| `@integration` | Integration tests | Tests combining API + DB |
| `@smoke` | Smoke tests | Critical path, quick validation |
| `@regression` | Regression tests | Full test coverage |
| `@auth` | Authentication tests | Login, logout, token tests |
| `@negative` | Negative tests | Error cases, invalid inputs |
| `@security` | Security tests | Auth bypass, injection tests |

**How to apply tags:**

```typescript
// Single tag
test("Should return 200", { tag: "@api" }, async ({ request }) => {});

// Multiple tags
test("Should return 200", { tag: ["@api", "@smoke"] }, async ({ request }) => {});

// In describe block (applies to all tests in block)
test.describe("Auth API @auth @api", () => {
  test("Should login", async ({ request }) => {});
});
```

---

## Test Patterns by Scenario

### Pattern 1: Positive Test (Success Case)

```typescript
test("Should return 200 for valid GET request", { tag: ["@api", "@smoke"] }, async ({ request }) => {
  const response = await request.get("/api/users");

  expect(response.status()).toBe(200);
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});
```

### Pattern 2: POST with Request Body

```typescript
test("Should create resource with valid data", { tag: ["@api", "@smoke"] }, async ({ request }) => {
  const payload = {
    name: "Test User",
    email: generateRandomEmail(),
  };

  const response = await request.post("/api/users", { data: payload });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body).toHaveProperty("id");
  expect(body.name).toBe(payload.name);
  expect(body.email).toBe(payload.email);
});
```

### Pattern 3: Negative Test (Error Case)

```typescript
test("Should return 400 for invalid request body", { tag: ["@api", "@negative"] }, async ({ request }) => {
  const invalidPayload = {
    // Missing required 'email' field
    name: "Test User",
  };

  const response = await request.post("/api/users", { data: invalidPayload });

  expect(response.status()).toBe(400);
  expect(response.ok()).toBe(false);

  const body = await response.json();
  expect(body).toHaveProperty("error");
});
```

### Pattern 4: Authentication Required

```typescript
test("Should return 401 without authentication", { tag: ["@api", "@auth", "@negative"] }, async ({ request }) => {
  const response = await request.get("/api/protected-resource");

  expect(response.status()).toBe(401);
});

test("Should return 200 with valid token", { tag: ["@api", "@auth"] }, async ({ request }) => {
  const response = await request.get("/api/protected-resource", {
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
  });

  expect(response.status()).toBe(200);
});
```

### Pattern 5: Path Parameters

```typescript
test("Should return user by ID", { tag: ["@api"] }, async ({ request }) => {
  const userId = 123;

  const response = await request.get(`/api/users/${userId}`);

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.id).toBe(userId);
});

test("Should return 404 for non-existent resource", { tag: ["@api", "@negative"] }, async ({ request }) => {
  const nonExistentId = 999999;

  const response = await request.get(`/api/users/${nonExistentId}`);

  expect(response.status()).toBe(404);
});
```

### Pattern 6: Query Parameters

```typescript
test("Should filter results with query params", { tag: ["@api"] }, async ({ request }) => {
  const response = await request.get("/api/users", {
    params: {
      status: "active",
      page: "1",
      limit: "10",
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.length).toBeLessThanOrEqual(10);
});
```

### Pattern 7: PUT/PATCH Update

```typescript
test("Should update resource with PUT", { tag: ["@api"] }, async ({ request }) => {
  const userId = 1;
  const updatePayload = {
    name: "Updated Name",
    email: "updated@example.com",
  };

  const response = await request.put(`/api/users/${userId}`, { data: updatePayload });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.name).toBe(updatePayload.name);
});

test("Should partially update with PATCH", { tag: ["@api"] }, async ({ request }) => {
  const userId = 1;

  const response = await request.patch(`/api/users/${userId}`, {
    data: { name: "Patched Name" },
  });

  expect(response.status()).toBe(200);
});
```

### Pattern 8: DELETE

```typescript
test("Should delete resource", { tag: ["@api"] }, async ({ request }) => {
  const resourceId = 1;

  const response = await request.delete(`/api/resources/${resourceId}`);

  expect(response.status()).toBe(204);
});
```

### Pattern 9: Response Schema Validation

```typescript
test("Should return valid response schema", { tag: ["@api"] }, async ({ request }) => {
  const response = await request.get("/api/users/1");

  expect(response.status()).toBe(200);

  const body = await response.json();

  // Validate required fields exist
  expect(body).toHaveProperty("id");
  expect(body).toHaveProperty("name");
  expect(body).toHaveProperty("email");
  expect(body).toHaveProperty("createdAt");

  // Validate field types
  expect(typeof body.id).toBe("number");
  expect(typeof body.name).toBe("string");
  expect(typeof body.email).toBe("string");
});
```

### Pattern 10: Database Validation (Integration)

```typescript
test("Should persist data to database", { tag: ["@integration", "@api", "@db"] }, async ({ request, db }) => {
  const email = generateRandomEmail();
  const payload = { name: "DB Test User", email };

  // Create via API
  const response = await request.post("/api/users", { data: payload });
  expect(response.status()).toBe(201);

  const apiUser = await response.json();

  // Verify in database
  const dbResult = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  expect(dbResult.rows).toHaveLength(1);
  expect(dbResult.rows[0].id).toBe(apiUser.id);
  expect(dbResult.rows[0].name).toBe(payload.name);
});
```

---

## Environment Variables

Configure these in `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BASE_URL` | Yes | `http://localhost:3000` | API base URL |
| `API_TOKEN` | No | - | Bearer token for authenticated requests |
| `DB_PROVIDER` | For DB tests | - | Database type: `postgres`, `mysql`, `mssql`, `sqlite` |
| `DB_HOST` | For DB tests | `localhost` | Database host |
| `DB_PORT` | For DB tests | Provider default | Database port |
| `DB_NAME` | For DB tests | - | Database name |
| `DB_USER` | For DB tests | - | Database username |
| `DB_PASSWORD` | For DB tests | - | Database password |
| `DB_CONNECTION_STRING` | Alternative | - | Full connection string (overrides individual settings) |
| `CI` | No | `false` | Set to `true` in CI/CD environments |

**Example `.env`:**

```env
BASE_URL=https://api.example.com
API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

DB_PROVIDER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=testdb
DB_USER=testuser
DB_PASSWORD=testpass
```

---

## Project Structure Reference

```
.
├── src/
│   ├── api/                          # API client utilities
│   │   ├── api-client.ts             # ApiClient class with HTTP methods
│   │   └── index.ts                  # Exports: ApiClient, ApiResponse, types
│   │
│   ├── db/                           # Database utilities
│   │   ├── providers/
│   │   │   ├── postgres.ts           # PostgreSQL implementation
│   │   │   ├── mysql.ts              # MySQL implementation
│   │   │   ├── mssql.ts              # SQL Server implementation
│   │   │   └── sqlite.ts             # SQLite implementation
│   │   ├── database-factory.ts       # Factory for creating DB clients
│   │   ├── types.ts                  # DatabaseClient, QueryResult interfaces
│   │   └── index.ts                  # Exports all DB utilities
│   │
│   ├── fixtures/                     # Playwright test fixtures
│   │   ├── base.fixture.ts           # Defines: request, api, db fixtures
│   │   └── index.ts                  # Exports: test, expect
│   │
│   ├── utils/                        # Helper utilities
│   │   ├── test-data.ts              # Data generators
│   │   └── index.ts                  # Exports all utilities
│   │
│   └── tests/                        # TEST FILES GO HERE
│       ├── {resource}.api.spec.ts
│       ├── {resource}.db.spec.ts
│       └── {resource}.integration.spec.ts
│
├── playwright.config.ts              # Playwright configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies and scripts
└── .env.example                      # Environment template
```

---

## Complete Test File Example

```typescript
// src/tests/users.api.spec.ts
import { test, expect } from "../fixtures/index.js";
import { generateRandomEmail, generateRandomString } from "../utils/index.js";

test.describe("Users API Tests", () => {

  test.describe("GET /api/users", () => {
    test("Should return list of users", { tag: ["@api", "@smoke"] }, async ({ request }) => {
      const response = await request.get("/api/users");

      expect(response.status()).toBe(200);
      expect(response.ok()).toBe(true);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test("Should support pagination", { tag: ["@api"] }, async ({ request }) => {
      const response = await request.get("/api/users", {
        params: { page: "1", limit: "5" },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe("GET /api/users/:id", () => {
    test("Should return user by ID", { tag: ["@api"] }, async ({ request }) => {
      const response = await request.get("/api/users/1");

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("id", 1);
      expect(body).toHaveProperty("name");
      expect(body).toHaveProperty("email");
    });

    test("Should return 404 for non-existent user", { tag: ["@api", "@negative"] }, async ({ request }) => {
      const response = await request.get("/api/users/999999");

      expect(response.status()).toBe(404);
    });
  });

  test.describe("POST /api/users", () => {
    test("Should create user with valid data", { tag: ["@api", "@smoke"] }, async ({ request }) => {
      const payload = {
        name: generateRandomString(10),
        email: generateRandomEmail(),
      };

      const response = await request.post("/api/users", { data: payload });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty("id");
      expect(body.name).toBe(payload.name);
      expect(body.email).toBe(payload.email);
    });

    test("Should return 400 for missing required fields", { tag: ["@api", "@negative"] }, async ({ request }) => {
      const response = await request.post("/api/users", {
        data: { name: "Only Name" }, // Missing email
      });

      expect(response.status()).toBe(400);
    });

    test("Should return 400 for invalid email format", { tag: ["@api", "@negative"] }, async ({ request }) => {
      const response = await request.post("/api/users", {
        data: { name: "Test", email: "invalid-email" },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe("PUT /api/users/:id", () => {
    test("Should update user", { tag: ["@api"] }, async ({ request }) => {
      const updatePayload = {
        name: "Updated Name",
        email: generateRandomEmail(),
      };

      const response = await request.put("/api/users/1", { data: updatePayload });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.name).toBe(updatePayload.name);
    });
  });

  test.describe("DELETE /api/users/:id", () => {
    test("Should delete user", { tag: ["@api"] }, async ({ request }) => {
      // First create a user to delete
      const createResponse = await request.post("/api/users", {
        data: { name: "ToDelete", email: generateRandomEmail() },
      });
      const { id } = await createResponse.json();

      // Delete the user
      const deleteResponse = await request.delete(`/api/users/${id}`);

      expect(deleteResponse.status()).toBe(204);
    });
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run by test type
npm run test:api          # Only *.api.spec.ts files
npm run test:db           # Only *.db.spec.ts files

# Run by tag
npx playwright test --grep @smoke
npx playwright test --grep @api
npx playwright test --grep "@smoke|@regression"

# Run specific file
npx playwright test src/tests/users.api.spec.ts

# Run with UI mode
npm run test:ui

# Run with debug
npm run test:debug
```

---

## Assertions Reference

Common Playwright assertions for API testing:

```typescript
// Status code assertions
expect(response.status()).toBe(200);
expect(response.status()).toBe(201);
expect(response.status()).toBe(204);
expect(response.status()).toBe(400);
expect(response.status()).toBe(401);
expect(response.status()).toBe(403);
expect(response.status()).toBe(404);
expect(response.status()).toBe(500);

// Response state
expect(response.ok()).toBe(true);      // status 2xx
expect(response.ok()).toBe(false);     // status not 2xx

// Body assertions
const body = await response.json();
expect(body).toBeDefined();
expect(body).toHaveProperty("id");
expect(body).toHaveProperty("name", "expected value");
expect(body.items).toHaveLength(10);
expect(body.count).toBeGreaterThan(0);
expect(body.email).toContain("@");
expect(body.status).toMatch(/active|pending/);
expect(Array.isArray(body)).toBe(true);
expect(typeof body.id).toBe("number");
expect(typeof body.name).toBe("string");

// Array assertions
expect(body.users).toHaveLength(5);
expect(body.users.length).toBeGreaterThan(0);
expect(body.users.length).toBeLessThanOrEqual(10);

// Object matching
expect(body).toMatchObject({
  status: "success",
  data: expect.any(Object),
});

// Null/undefined
expect(body.deletedAt).toBeNull();
expect(body.optional).toBeUndefined();
```

---

## Best Practices

1. **One assertion focus per test** - Each test should verify one specific behavior
2. **Use descriptive test names** - "Should return 400 for invalid email" not "Test 1"
3. **Always include tags** - At minimum `@api` or `@db`, plus `@smoke` for critical tests
4. **Generate unique test data** - Use `generateRandomEmail()` to avoid conflicts
5. **Clean up test data** - Delete created resources or use transactions
6. **Group by endpoint** - Use nested `test.describe()` for each HTTP method + endpoint
7. **Test both positive and negative cases** - Include `@negative` tests for error handling
