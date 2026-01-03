import sql from "mssql";
import type { DatabaseClient, DatabaseConfig, QueryResult } from "../types.js";

export class MsSqlClient implements DatabaseClient {
  private pool: sql.ConnectionPool | null = null;
  private currentTransaction: sql.Transaction | null = null;
  private config: DatabaseConfig;
  private isTransaction = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.pool) return;

    if (this.config.connectionString) {
      this.pool = await sql.connect(this.config.connectionString);
    } else {
      const sqlConfig: sql.config = {
        server: this.config.host || "localhost",
        port: this.config.port || 1433,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        pool: {
          min: this.config.pool?.min || 1,
          max: this.config.pool?.max || 10,
        },
        options: {
          encrypt: !!this.config.ssl,
          trustServerCertificate: true,
        },
      };
      this.pool = await sql.connect(sqlConfig);
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentTransaction) {
      this.currentTransaction = null;
    }
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  private convertParams(
    request: sql.Request,
    params?: unknown[]
  ): sql.Request {
    if (!params) return request;

    params.forEach((param, index) => {
      request.input(`p${index}`, param);
    });

    return request;
  }

  private convertSql(sqlQuery: string, params?: unknown[]): string {
    if (!params) return sqlQuery;

    let convertedSql = sqlQuery;
    params.forEach((_, index) => {
      convertedSql = convertedSql.replace("?", `@p${index}`);
    });

    return convertedSql;
  }

  async query<T = Record<string, unknown>>(
    sqlQuery: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const request = this.isTransaction
      ? new sql.Request(this.currentTransaction!)
      : new sql.Request(this.pool);

    this.convertParams(request, params);
    const convertedSql = this.convertSql(sqlQuery, params);

    const result = await request.query(convertedSql);

    return {
      rows: result.recordset as T[],
      rowCount: result.rowsAffected[0] || result.recordset?.length || 0,
      fields: result.recordset?.columns
        ? Object.keys(result.recordset.columns)
        : undefined,
    };
  }

  async execute(sqlQuery: string, params?: unknown[]): Promise<number> {
    const result = await this.query(sqlQuery, params);
    return result.rowCount;
  }

  async transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    this.currentTransaction = new sql.Transaction(this.pool);
    this.isTransaction = true;

    try {
      await this.currentTransaction.begin();
      const result = await fn(this);
      await this.currentTransaction.commit();
      return result;
    } catch (error) {
      await this.currentTransaction.rollback();
      throw error;
    } finally {
      this.currentTransaction = null;
      this.isTransaction = false;
    }
  }
}
