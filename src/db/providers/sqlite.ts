import Database from "better-sqlite3";
import type { DatabaseClient, DatabaseConfig, QueryResult } from "../types.js";

export class SqliteClient implements DatabaseClient {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.db) return;

    const filePath = this.config.filePath || this.config.database || ":memory:";
    this.db = new Database(filePath);
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...(params || [])) as T[];

    return {
      rows,
      rowCount: rows.length,
      fields: rows.length > 0 ? Object.keys(rows[0] as object) : undefined,
    };
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.run(...(params || []));

    return result.changes;
  }

  async transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const transaction = this.db.transaction(async () => {
      return await fn(this);
    });

    return transaction() as T;
  }
}
