export type DatabaseProvider = "postgres" | "mysql" | "mssql" | "sqlite";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  filePath?: string; // For SQLite
  connectionString?: string;
  pool?: {
    min?: number;
    max?: number;
  };
  ssl?: boolean | object;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
  fields?: string[];
}

export interface DatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;
  execute(sql: string, params?: unknown[]): Promise<number>;
  transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T>;
}
