import { APIRequestContext, APIResponse } from "@playwright/test";

export interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  private request: APIRequestContext;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(request: APIRequestContext, config: ApiClientConfig = {}) {
    this.request = request;
    this.baseURL = config.baseURL || process.env.BASE_URL || "";
    this.defaultHeaders = config.headers || {};
    this.defaultTimeout = config.timeout || 30000;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private mergeHeaders(options?: RequestOptions): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...options?.headers,
    };
  }

  async get<T = unknown>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request.get(
      this.buildUrl(endpoint, options?.params),
      {
        headers: this.mergeHeaders(options),
        timeout: options?.timeout || this.defaultTimeout,
      }
    );
    return new ApiResponse<T>(response);
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(
      this.buildUrl(endpoint, options?.params),
      {
        data,
        headers: this.mergeHeaders(options),
        timeout: options?.timeout || this.defaultTimeout,
      }
    );
    return new ApiResponse<T>(response);
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request.put(
      this.buildUrl(endpoint, options?.params),
      {
        data,
        headers: this.mergeHeaders(options),
        timeout: options?.timeout || this.defaultTimeout,
      }
    );
    return new ApiResponse<T>(response);
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request.patch(
      this.buildUrl(endpoint, options?.params),
      {
        data,
        headers: this.mergeHeaders(options),
        timeout: options?.timeout || this.defaultTimeout,
      }
    );
    return new ApiResponse<T>(response);
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.request.delete(
      this.buildUrl(endpoint, options?.params),
      {
        headers: this.mergeHeaders(options),
        timeout: options?.timeout || this.defaultTimeout,
      }
    );
    return new ApiResponse<T>(response);
  }
}

export class ApiResponse<T = unknown> {
  private response: APIResponse;
  private _body: T | null = null;

  constructor(response: APIResponse) {
    this.response = response;
  }

  get status(): number {
    return this.response.status();
  }

  get statusText(): string {
    return this.response.statusText();
  }

  get ok(): boolean {
    return this.response.ok();
  }

  get headers(): Record<string, string> {
    return this.response.headers();
  }

  async json(): Promise<T> {
    if (this._body === null) {
      this._body = (await this.response.json()) as T;
    }
    return this._body;
  }

  async text(): Promise<string> {
    return this.response.text();
  }

  async body(): Promise<Buffer> {
    return this.response.body();
  }
}
