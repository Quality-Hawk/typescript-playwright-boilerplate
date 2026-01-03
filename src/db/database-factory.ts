import type { DatabaseClient, DatabaseConfig, DatabaseProvider } from "./types.js";
import { PostgresClient } from "./providers/postgres.js";
import { MySqlClient } from "./providers/mysql.js";
import { MsSqlClient } from "./providers/mssql.js";
import { SqliteClient } from "./providers/sqlite.js";

export class DatabaseFactory {
  static create(config: DatabaseConfig): DatabaseClient {
    switch (config.provider) {
      case "postgres":
        return new PostgresClient(config);
      case "mysql":
        return new MySqlClient(config);
      case "mssql":
        return new MsSqlClient(config);
      case "sqlite":
        return new SqliteClient(config);
      default:
        throw new Error(`Unsupported database provider: ${config.provider}`);
    }
  }

  static fromEnv(): DatabaseClient {
    const provider = process.env.DB_PROVIDER as DatabaseProvider;

    if (!provider) {
      throw new Error("DB_PROVIDER environment variable is required");
    }

    const config: DatabaseConfig = {
      provider,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
      database: process.env.DB_NAME || process.env.DB_DATABASE || "",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      filePath: process.env.DB_FILE_PATH,
      connectionString: process.env.DB_CONNECTION_STRING,
      ssl: process.env.DB_SSL === "true",
      pool: {
        min: process.env.DB_POOL_MIN
          ? parseInt(process.env.DB_POOL_MIN, 10)
          : undefined,
        max: process.env.DB_POOL_MAX
          ? parseInt(process.env.DB_POOL_MAX, 10)
          : undefined,
      },
    };

    return this.create(config);
  }
}
