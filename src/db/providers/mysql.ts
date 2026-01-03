import mysql from "mysql2/promise";
import type { DatabaseClient, DatabaseConfig, QueryResult } from "../types.js";

export class MySqlClient implements DatabaseClient {
  private pool: mysql.Pool | null = null;
  private connection: mysql.PoolConnection | null = null;
  private config: DatabaseConfig;
  private isTransaction = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.pool) return;

    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      connectionLimit: this.config.pool?.max || 10,
      ssl: this.config.ssl ? {} : undefined,
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.release();
      this.connection = null;
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

    const conn = this.isTransaction ? this.connection! : this.pool;
    const [rows, fields] = await conn.execute(sql, params);

    const resultRows = Array.isArray(rows) ? rows : [];

    return {
      rows: resultRows as T[],
      rowCount: Array.isArray(rows)
        ? rows.length
        : (rows as mysql.ResultSetHeader).affectedRows || 0,
      fields: fields?.map((f) => f.name),
    };
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const conn = this.isTransaction ? this.connection! : this.pool;
    const [result] = await conn.execute(sql, params);

    return (result as mysql.ResultSetHeader).affectedRows || 0;
  }

  async transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    this.connection = await this.pool.getConnection();
    this.isTransaction = true;

    try {
      await this.connection.beginTransaction();
      const result = await fn(this);
      await this.connection.commit();
      return result;
    } catch (error) {
      await this.connection.rollback();
      throw error;
    } finally {
      this.connection.release();
      this.connection = null;
      this.isTransaction = false;
    }
  }
}
