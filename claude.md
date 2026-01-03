# Playwright API & Database Test Automation Boilerplate

This is a test automation framework for API testing and database validation using Playwright, TypeScript, and multi-provider SQL support.

## Project Structure

```
.
├── src/
│   ├── api/                    # API client utilities
│   │   ├── api-client.ts       # Main API client class
│   │   └── index.ts
│   ├── db/                     # Database utilities
│   │   ├── providers/          # Database provider implementations
│   │   │   ├── postgres.ts     # PostgreSQL client
│   │   │   ├── mysql.ts        # MySQL client
│   │   │   ├── mssql.ts        # SQL Server client
│   │   │   └── sqlite.ts       # SQLite client
│   │   ├── database-factory.ts # Factory for creating DB clients
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── index.ts
│   ├── fixtures/               # Playwright test fixtures
│   │   ├── base.fixture.ts     # Base fixtures with api and db
│   │   └── index.ts
│   ├── utils/                  # Helper utilities
│   │   ├── test-data.ts        # Test data generators
│   │   └── index.ts
│   └── tests/                  # Test files
│       ├── example.api.spec.ts       # API test examples
│       ├── example.db.spec.ts        # Database test examples
│       └── example.integration.spec.ts # Integration test examples
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
├── .env.example                # Environment variables template
└── .gitignore
```

## Getting Started

### Installation

```bash
npm install
npx playwright install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   ```env
   BASE_URL=http://your-api-url.com
   API_TOKEN=your-token

   DB_PROVIDER=postgres  # postgres | mysql | mssql | sqlite
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database
   DB_USER=your_user
   DB_PASSWORD=your_password
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run database tests only
npm run test:db

# Run with UI mode
npm run test:ui

# Run with debug mode
npm run test:debug

# Run tests and generate Allure report
npm run test:with-allure

# Clean all report directories
npm run clean:reports
```

## Test Reports

The framework includes multiple reporting options for different use cases.

### Available Reports

| Report Type | Output Location | Command |
|-------------|-----------------|---------|
| HTML (Playwright) | `playwright-report/` | `npm run report:html` |
| Allure | `allure-report/` | `npm run report:allure` |
| JSON | `test-results/results.json` | Generated automatically |
| JUnit XML | `test-results/junit.xml` | Generated automatically |

### Playwright HTML Report

The built-in Playwright HTML report provides:
- Test execution timeline
- Screenshots and traces on failure
- Filtering by status, project, and file

```bash
# Open HTML report after running tests
npm run report:html
```

### Allure Report

[Allure](https://allurereport.org/) provides rich, interactive reports with:
- Test execution history
- Categories and severity levels
- Attachments (screenshots, logs, API responses)
- Trend charts and statistics

**Prerequisites**: Install Allure CLI

```bash
# macOS
brew install allure

# Windows (via Scoop)
scoop install allure

# npm (cross-platform)
npm install -g allure-commandline
```

**Usage**:

```bash
# Generate and open Allure report
npm run report:allure

# Or step by step:
npm run report:allure:generate  # Generate report
npm run report:allure:open      # Open in browser

# Run tests and open Allure report
npm run test:with-allure
```

### Adding Metadata to Allure Reports

Use Allure decorators in your tests for richer reports:

```typescript
import { test, expect } from "../fixtures/index.js";
import * as allure from "allure-js-commons";

test.describe("Users API @api", () => {
  test("should create user", async ({ api }) => {
    // Add metadata
    await allure.epic("User Management");
    await allure.feature("User Creation");
    await allure.story("Create new user via API");
    await allure.severity("critical");
    await allure.owner("QA Team");
    await allure.tag("smoke");

    // Add steps for better visibility
    await allure.step("Prepare user data", async () => {
      // Step logic
    });

    await allure.step("Send POST request", async () => {
      const response = await api.post("/users", {
        name: "Test User",
        email: "test@example.com",
      });

      // Attach request/response for debugging
      await allure.attachment(
        "Response Body",
        JSON.stringify(await response.json(), null, 2),
        "application/json"
      );

      expect(response.status).toBe(201);
    });
  });
});
```

### JUnit XML Report

The JUnit XML report (`test-results/junit.xml`) is automatically generated and compatible with:
- Jenkins
- GitLab CI
- Azure DevOps
- CircleCI
- Most CI/CD platforms

### JSON Report

The JSON report (`test-results/results.json`) provides programmatic access to test results for:
- Custom dashboards
- Slack/Teams notifications
- Data analysis

### Custom Reporter

Create custom reporters in `src/reporters/`:

```typescript
// src/reporters/custom-reporter.ts
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

class CustomReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting test run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase) {
    console.log(`Starting: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished: ${test.title} - ${result.status}`);
  }

  onEnd(result: FullResult) {
    console.log(`Test run finished: ${result.status}`);
  }
}

export default CustomReporter;
```

Add to `playwright.config.ts`:

```typescript
reporter: [
  // ... other reporters
  ["./src/reporters/custom-reporter.ts"],
],
```

## Building on This Boilerplate

### Adding New API Endpoints

Create service classes in `src/api/` to organize endpoints by domain:

```typescript
// src/api/services/user-service.ts
import { ApiClient, ApiResponse } from "../api-client.js";

export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  constructor(private api: ApiClient) {}

  async getAll(): Promise<ApiResponse<User[]>> {
    return this.api.get<User[]>("/users");
  }

  async getById(id: number): Promise<ApiResponse<User>> {
    return this.api.get<User>(`/users/${id}`);
  }

  async create(user: Omit<User, "id">): Promise<ApiResponse<User>> {
    return this.api.post<User>("/users", user);
  }

  async update(id: number, user: Partial<User>): Promise<ApiResponse<User>> {
    return this.api.put<User>(`/users/${id}`, user);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.api.delete(`/users/${id}`);
  }
}
```

### Adding Custom Fixtures

Extend the base fixture in `src/fixtures/`:

```typescript
// src/fixtures/custom.fixture.ts
import { test as base } from "./base.fixture.js";
import { UserService } from "../api/services/user-service.js";

interface CustomFixtures {
  userService: UserService;
}

export const test = base.extend<CustomFixtures>({
  userService: async ({ api }, use) => {
    const userService = new UserService(api);
    await use(userService);
  },
});

export { expect } from "@playwright/test";
```

### Adding New Database Queries

Create repository classes in `src/db/`:

```typescript
// src/db/repositories/user-repository.ts
import { DatabaseClient, QueryResult } from "../types.js";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export class UserRepository {
  constructor(private db: DatabaseClient) {}

  async findAll(): Promise<UserRow[]> {
    const result = await this.db.query<UserRow>("SELECT * FROM users");
    return result.rows;
  }

  async findById(id: number): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return result.rows[0] || null;
  }

  async create(name: string, email: string): Promise<number> {
    return this.db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
  }

  async update(id: number, data: Partial<UserRow>): Promise<number> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.email) {
      fields.push("email = ?");
      values.push(data.email);
    }

    values.push(id);

    return this.db.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  async delete(id: number): Promise<number> {
    return this.db.execute("DELETE FROM users WHERE id = ?", [id]);
  }
}
```

### Writing New Tests

#### API Tests

```typescript
// src/tests/users.api.spec.ts
import { test, expect } from "../fixtures/index.js";

test.describe("Users API @api", () => {
  test("should return user list", async ({ api }) => {
    const response = await api.get("/users");

    expect(response.status).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
  });

  test("should create user with valid data", async ({ api }) => {
    const response = await api.post("/users", {
      name: "New User",
      email: "new@example.com",
    });

    expect(response.status).toBe(201);

    const user = await response.json();
    expect(user).toHaveProperty("id");
  });
});
```

#### Database Tests

```typescript
// src/tests/users.db.spec.ts
import { test, expect } from "../fixtures/index.js";

test.describe("Users Database @db", () => {
  test("should have users table", async ({ db }) => {
    // PostgreSQL/MySQL syntax
    const result = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = ?",
      ["users"]
    );

    expect(Number(result.rows[0].count)).toBeGreaterThan(0);
  });

  test("should rollback on error in transaction", async ({ db }) => {
    const email = "transaction-test@example.com";

    try {
      await db.transaction(async (client) => {
        await client.execute(
          "INSERT INTO users (name, email) VALUES (?, ?)",
          ["Test", email]
        );
        throw new Error("Intentional rollback");
      });
    } catch {
      // Expected
    }

    const result = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    expect(result.rows).toHaveLength(0); // Rolled back
  });
});
```

#### Integration Tests

```typescript
// src/tests/user-workflow.integration.spec.ts
import { test, expect } from "../fixtures/index.js";
import { generateRandomEmail } from "../utils/index.js";

test.describe("User Workflow @integration", () => {
  test("complete user lifecycle", async ({ api, db }) => {
    const email = generateRandomEmail();

    // 1. Create via API
    const createRes = await api.post("/users", { name: "Test", email });
    expect(createRes.status).toBe(201);
    const { id } = await createRes.json();

    // 2. Verify in DB
    let dbResult = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    expect(dbResult.rows).toHaveLength(1);

    // 3. Update via API
    await api.put(`/users/${id}`, { name: "Updated" });

    // 4. Verify update in DB
    dbResult = await db.query(
      "SELECT name FROM users WHERE id = ?",
      [id]
    );
    expect(dbResult.rows[0].name).toBe("Updated");

    // 5. Delete via API
    await api.delete(`/users/${id}`);

    // 6. Verify deletion in DB
    dbResult = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    expect(dbResult.rows).toHaveLength(0);
  });
});
```

## Database Provider Notes

### Parameter Placeholders

The framework normalizes parameter placeholders across providers:
- Use `?` for parameters in all providers
- The framework converts to the appropriate format for each provider

### Provider-Specific Queries

For provider-specific SQL syntax, check the provider at runtime:

```typescript
test("provider-specific query", async ({ db }) => {
  const provider = process.env.DB_PROVIDER;

  let sql: string;
  if (provider === "postgres") {
    sql = "SELECT NOW() as current_time";
  } else if (provider === "mysql") {
    sql = "SELECT NOW() as current_time";
  } else if (provider === "mssql") {
    sql = "SELECT GETDATE() as current_time";
  } else {
    sql = "SELECT datetime('now') as current_time";
  }

  const result = await db.query(sql);
  expect(result.rows[0].current_time).toBeDefined();
});
```

## Test Tags

Use tags to organize and filter tests:
- `@api` - API tests
- `@db` - Database tests
- `@integration` - Integration tests
- `@smoke` - Smoke tests
- `@regression` - Regression tests

Run specific tags:
```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @slow
```

## CI/CD Integration

The framework includes CI-friendly defaults:
- Retries enabled when `CI=true`
- Single worker in CI for stability
- Multiple report formats generated (HTML, JSON, JUnit, Allure)

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npm test
        env:
          CI: true
          DB_PROVIDER: postgres
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: test_db
          DB_USER: test
          DB_PASSWORD: test

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30

      - name: Upload Allure Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results
          path: allure-results/
          retention-days: 30

      # Optional: Publish JUnit results
      - name: Publish Test Results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Playwright Tests
          path: test-results/junit.xml
          reporter: java-junit

  # Optional: Generate and deploy Allure report
  allure-report:
    needs: test
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Download Allure Results
        uses: actions/download-artifact@v4
        with:
          name: allure-results
          path: allure-results

      - name: Generate Allure Report
        uses: simple-elf/allure-report-action@v1.7
        with:
          allure_results: allure-results
          allure_history: allure-history

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_branch: gh-pages
          publish_dir: allure-history
```

### GitLab CI

```yaml
stages:
  - test
  - report

variables:
  DB_PROVIDER: postgres
  DB_HOST: postgres
  DB_PORT: 5432
  DB_NAME: test_db
  DB_USER: test
  DB_PASSWORD: test

test:
  stage: test
  image: mcr.microsoft.com/playwright:v1.57.0
  services:
    - name: postgres:15
      alias: postgres
      variables:
        POSTGRES_DB: test_db
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
  script:
    - npm ci
    - npm test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
      - allure-results/
    reports:
      junit: test-results/junit.xml
    expire_in: 30 days

allure:
  stage: report
  image: frankescobar/allure-docker-service
  script:
    - allure generate allure-results -o allure-report
  artifacts:
    paths:
      - allure-report/
    expire_in: 30 days
  when: always
```

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        CI = 'true'
        DB_PROVIDER = 'postgres'
        DB_HOST = 'localhost'
        DB_PORT = '5432'
        DB_NAME = 'test_db'
        DB_USER = 'test'
        DB_PASSWORD = 'test'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'test-results/junit.xml'
                    publishHTML([
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report'
                    ])
                    allure([
                        results: [[path: 'allure-results']]
                    ])
                }
            }
        }
    }
}
```

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on other tests
2. **Use transactions**: Wrap database operations in transactions to auto-rollback
3. **Generate unique data**: Use utilities like `generateRandomEmail()` to avoid conflicts
4. **Tag tests appropriately**: Use tags for filtering and organization
5. **Keep tests focused**: One test should verify one thing
6. **Use Page Object Model for API**: Create service classes for API endpoints
7. **Use Repository pattern for DB**: Create repository classes for database tables
