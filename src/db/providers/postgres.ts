import pg from "pg";
import type { DatabaseClient, DatabaseConfig, QueryResult } from "../types.js";

const { Pool } = pg;

export class PostgresClient implements DatabaseClient {
  private pool: pg.Pool | null = null;
  private client: pg.PoolClient | null = null;
  private config: DatabaseConfig;
  private isTransaction = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.pool) return;

    const poolConfig: pg.PoolConfig = this.config.connectionString
      ? { connectionString: this.config.connectionString }
      : {
          host: this.config.host,
          port: this.config.port || 5432,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          ssl: this.config.ssl,
          min: this.config.pool?.min || 1,
          max: this.config.pool?.max || 10,
        };

    this.pool = new Pool(poolConfig);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const client = this.isTransaction ? this.client! : this.pool;
    const result = await client.query(sql, params);

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
      fields: result.fields?.map((f) => f.name),
    };
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    const result = await this.query(sql, params);
    return result.rowCount;
  }

  async transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    this.client = await this.pool.connect();
    this.isTransaction = true;

    try {
      await this.client.query("BEGIN");
      const result = await fn(this);
      await this.client.query("COMMIT");
      return result;
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    } finally {
      this.client.release();
      this.client = null;
      this.isTransaction = false;
    }
  }
}
