# Playwright API & Database Test Automation Boilerplate

<p align="center">
  <strong>A production-ready test automation framework by <a href="https://github.com/QualityHawkAI">Quality Hawk AI</a></strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#reports">Reports</a> •
  <a href="#license">License</a>
</p>

---

A comprehensive, enterprise-grade test automation boilerplate for **API testing** and **database validation** using Playwright, TypeScript, and multi-provider SQL support. Built for teams that need reliable, scalable, and maintainable test infrastructure.

## Features

- **API Testing** - Type-safe API client with full HTTP method support (GET, POST, PUT, PATCH, DELETE)
- **Multi-Database Support** - PostgreSQL, MySQL, SQL Server, and SQLite out of the box
- **Rich Reporting** - Playwright HTML, Allure, JUnit XML, and JSON reports
- **TypeScript First** - Full type safety with modern ES2022+ features
- **CI/CD Ready** - Pre-configured for GitHub Actions, GitLab CI, and Jenkins
- **Test Fixtures** - Playwright fixtures for seamless API and database integration
- **Transaction Support** - Database transactions with automatic rollback for test isolation

## Quick Start

```bash
# Clone the repository
git clone https://github.com/QualityHawkAI/playwright-api-db-boilerplate.git
cd playwright-api-db-boilerplate

# Install dependencies
npm install
npx playwright install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run tests
npm test
```

## Project Structure

```
.
├── src/
│   ├── api/                    # API client utilities
│   ├── db/                     # Database providers (PostgreSQL, MySQL, MSSQL, SQLite)
│   ├── fixtures/               # Playwright test fixtures
│   ├── utils/                  # Helper utilities
│   └── tests/                  # Test files
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
└── claude.md                   # AI-assisted development guide
```

## Running Tests

```bash
# Run all tests
npm test

# Run by category
npm run test:api          # API tests only
npm run test:db           # Database tests only

# Run with UI
npm run test:ui           # Interactive UI mode
npm run test:debug        # Debug mode

# Run mock tests (no external dependencies)
npx playwright test --grep @mock
```

## Reports

Multiple reporting formats are generated automatically:

| Report | Command | Output |
|--------|---------|--------|
| Playwright HTML | `npm run report:html` | `playwright-report/` |
| Allure | `npm run report:allure` | `allure-report/` |
| JUnit XML | Auto-generated | `test-results/junit.xml` |
| JSON | Auto-generated | `test-results/results.json` |

```bash
# Generate and view Allure report
npm run test:with-allure
```

## Database Support

Configure your database provider via environment variables:

```env
DB_PROVIDER=postgres  # postgres | mysql | mssql | sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=your_user
DB_PASSWORD=your_password
```

## Documentation

See [claude.md](./claude.md) for comprehensive documentation on:
- Adding new API services
- Creating custom fixtures
- Writing database repositories
- CI/CD integration examples
- Best practices

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Playwright | 1.57.0 | Test framework |
| TypeScript | 5.9.3 | Type safety |
| PostgreSQL (pg) | 8.16.3 | PostgreSQL driver |
| MySQL2 | 3.16.0 | MySQL driver |
| MSSQL | 12.2.0 | SQL Server driver |
| better-sqlite3 | 12.5.0 | SQLite driver |
| Allure | 3.4.3 | Reporting |

## CI/CD Integration

Pre-configured examples for:
- **GitHub Actions** - Full workflow with Allure report publishing
- **GitLab CI** - Multi-stage pipeline with artifacts
- **Jenkins** - Declarative pipeline with report integration

See [claude.md](./claude.md#cicd-integration) for complete examples.

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with precision by <strong>Quality Hawk AI</strong>
</p>
